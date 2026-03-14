"""
Divya & Sher Live AI Tutor — Real-time audio conversation
Students speak, the AI tutor responds in audio with text transcript.
"""
import os
import uuid
import base64
import tempfile
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/divya/live", tags=["divya-live"])

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")

# Voice mapping for TTS
VOICE_MAP = {
    "divya": "nova",
    "sher": "shimmer",
}

# Language configuration
LANGUAGE_MAP = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "mr": "Marathi",
    "te": "Telugu",
    "kn": "Kannada",
    "bn": "Bengali",
}

# Tutor system prompts
TUTOR_PROMPTS = {
    "divya": """You are Divya, a warm, enthusiastic female Indian teacher and AI tutor.

PERSONALITY:
- You explain concepts clearly with real-world examples and analogies
- You are encouraging, patient, and make learning fun
- You naturally use Hinglish (mix of Hindi-English) when the student speaks Hindi
- You celebrate small wins ("Bahut achha!", "Excellent!", "Wah, you got it!")

RULES:
1. Keep responses concise: 2-4 sentences for simple questions, up to 6 for complex ones
2. If a student seems confused, break it down into simpler steps
3. Use examples from daily life to explain abstract concepts
4. If the student asks about something from the uploaded PDF, reference it directly
5. ALWAYS respond in {language}
6. Be conversational, as if talking to a student face-to-face""",

    "sher": """You are Sher, a sharp, detail-oriented female Indian tutor and exam coach.

PERSONALITY:
- You focus on exam preparation and scoring strategies
- You break complex topics into numbered steps
- You love using mnemonics and memory tricks
- You are direct, efficient, and results-oriented
- You naturally use Hinglish when the student speaks Hindi

RULES:
1. Keep responses concise: 2-4 sentences for simple questions, up to 6 for complex ones
2. Always highlight what's "exam important" or "frequently asked"
3. Use mnemonics and tricks to help students remember
4. If a student asks about PDF content, give targeted, exam-focused answers
5. ALWAYS respond in {language}
6. Be conversational but focused on helping the student score well""",
}


class LiveAskRequest(BaseModel):
    text: str
    tutor: str = "divya"
    language: str = "en"
    context: str = ""
    chat_history: list = []


@router.post("/ask")
async def live_ask(req: LiveAskRequest):
    """Real-time tutoring: takes text, returns text + audio response."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    tutor = req.tutor.lower() if req.tutor.lower() in TUTOR_PROMPTS else "divya"
    language = LANGUAGE_MAP.get(req.language, "English")
    voice = VOICE_MAP.get(tutor, "nova")

    # Build system prompt
    system_prompt = TUTOR_PROMPTS[tutor].format(language=language)

    # Build conversation context
    prompt_parts = []
    if req.context:
        prompt_parts.append(f"[Study Material Context]\n{req.context[:3000]}")
    if req.chat_history:
        recent = req.chat_history[-8:]
        history_text = "\n".join([f"{m.get('role', 'user')}: {m.get('text', '')}" for m in recent])
        prompt_parts.append(f"[Recent Conversation]\n{history_text}")
    prompt_parts.append(f"Student says: {req.text}")

    full_prompt = "\n\n".join(prompt_parts)

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"live-{tutor}-{uuid.uuid4().hex[:8]}",
            system_message=system_prompt
        ).with_model("gemini", "gemini-2.5-flash")

        response_text = await chat.send_message(UserMessage(text=full_prompt))
        response_text = response_text.strip()

        # Clean up any role prefixes
        for prefix in ["DIVYA:", "SHER:", "Divya:", "Sher:"]:
            if response_text.startswith(prefix):
                response_text = response_text[len(prefix):].strip()

        # Generate TTS audio
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        tts = OpenAITextToSpeech(api_key=EMERGENT_KEY)

        # Chunk text if needed (max 4096 chars)
        tts_text = response_text[:4000]
        audio_bytes = await tts.generate_speech(
            text=tts_text,
            model="tts-1",
            voice=voice,
            speed=1.0,
            response_format="mp3"
        )

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        return {
            "success": True,
            "text": response_text,
            "audio_base64": audio_b64,
            "tutor": tutor,
            "language": req.language,
        }

    except Exception as e:
        print(f"[DIVYA-LIVE] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


@router.post("/upload-context")
async def upload_context(
    files: List[UploadFile] = File(...),
):
    """Upload PDF/images and extract text for tutoring context."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    extracted_text = []

    for f in files:
        content = await f.read()
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""

        if ext == "pdf":
            # Extract text from PDF
            try:
                from PyPDF2 import PdfReader
                import io
                reader = PdfReader(io.BytesIO(content))
                pages_text = []
                for i, page in enumerate(reader.pages[:30]):
                    text = page.extract_text()
                    if text:
                        pages_text.append(f"[Page {i+1}] {text}")
                if pages_text:
                    extracted_text.append("\n".join(pages_text))
                else:
                    # Fallback: use Gemini to extract from scanned PDF
                    extracted_text.append(await _extract_with_gemini(content, "application/pdf", f.filename))
            except Exception:
                extracted_text.append(await _extract_with_gemini(content, "application/pdf", f.filename))

        elif ext in ("png", "jpg", "jpeg", "webp"):
            # Use Gemini to describe image content
            mime = f"image/{ext}" if ext != "jpg" else "image/jpeg"
            extracted_text.append(await _extract_with_gemini(content, mime, f.filename))

    full_context = "\n\n---\n\n".join(extracted_text)

    return {
        "success": True,
        "context": full_context[:8000],
        "char_count": len(full_context),
    }


async def _extract_with_gemini(content: bytes, mime_type: str, filename: str) -> str:
    """Use Gemini to extract/describe content from files."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

    # Save to temp file
    tmp_path = f"/tmp/divya_{uuid.uuid4().hex[:8]}_{filename}"
    with open(tmp_path, "wb") as f:
        f.write(content)

    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"extract-{uuid.uuid4().hex[:8]}",
            system_message="Extract all text content from this file. If it's an image, describe the educational content in detail."
        ).with_model("gemini", "gemini-2.5-flash")

        msg = UserMessage(
            text="Extract all text and educational content from this file.",
            file_contents=[FileContentWithMimeType(file_path=tmp_path, mime_type=mime_type)]
        )
        result = await chat.send_message(msg)
        return result.strip()
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio using OpenAI Whisper."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")

    # Save to temp file with proper extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "webm"
    tmp_path = f"/tmp/divya_audio_{uuid.uuid4().hex[:8]}.{ext}"
    with open(tmp_path, "wb") as f:
        f.write(content)

    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        stt = OpenAISpeechToText(api_key=EMERGENT_KEY)

        result = await stt.transcribe(
            file=tmp_path,
            model="whisper-1",
            response_format="json",
        )

        # Extract text from result
        text = ""
        if hasattr(result, "text"):
            text = result.text
        elif isinstance(result, dict):
            text = result.get("text", "")
        elif isinstance(result, str):
            text = result

        return {"success": True, "text": text.strip()}

    except Exception as e:
        print(f"[DIVYA-LIVE] Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed. Please try again or type your question instead.")
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
