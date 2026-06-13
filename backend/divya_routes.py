"""
Divya AI Tutor — Combined routes:
  • /divya/live/*  — Real-time voice tutoring (Sarvam TTS)
  • /divya/*       — Podcast generation, Ask, Mind-map (also Sarvam TTS)
"""
import os
import uuid
import base64
import io
import wave
from datetime import datetime, timezone
from typing import List, Optional
 
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
 
load_dotenv()
 
# ── Keys ──────────────────────────────────────────────────────────────────────
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
SARVAM_KEY   = os.environ.get("SARVAM_API_KEY")
 
UPLOAD_DIR = "/tmp/divya_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
 
# ── Routers ───────────────────────────────────────────────────────────────────
router      = APIRouter(prefix="/divya",      tags=["divya"])
live_router = APIRouter(prefix="/divya/live", tags=["divya-live"])
 
# ── Constants ─────────────────────────────────────────────────────────────────
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
 
# Sarvam voice mapping (only speakers compatible with bulbul:v2 per the live API:
# anushka, abhilash, manisha, vidya, arya, karun, hitesh).
SARVAM_VOICE_MAP = {"divya": "anushka", "sher": "manisha"}
SARVAM_DEFAULT_SPEAKER = "anushka"

# Frontend may send short language codes ("en", "hi"); map to Sarvam's full codes
SHORT_TO_FULL_LANG = {
    "en": "en-IN", "hi": "hi-IN", "ta": "ta-IN", "te": "te-IN",
    "ml": "ml-IN", "kn": "kn-IN", "bn": "bn-IN", "mr": "mr-IN",
    "gu": "gu-IN", "pa": "pa-IN", "od": "od-IN",
}


def _normalize_lang(lang: Optional[str]) -> str:
    """Accept short ('en') or full ('en-IN') codes and return a valid Sarvam code."""
    if not lang:
        return "en-IN"
    if lang in LANGUAGE_NAMES:
        return lang
    return SHORT_TO_FULL_LANG.get(lang.lower(), "en-IN")
 
# Language code → human-readable name (used in system prompts)
LANGUAGE_NAMES = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "ml-IN": "Malayalam",
    "kn-IN": "Kannada",
    "bn-IN": "Bengali",
    "mr-IN": "Marathi",
    "gu-IN": "Gujarati",
    "pa-IN": "Punjabi",
    "od-IN": "Odia",
}
 
# Sarvam code → Whisper ISO 639-1 code
WHISPER_LANG_MAP = {
    "en-IN": "en", "hi-IN": "hi", "ta-IN": "ta", "te-IN": "te",
    "ml-IN": "ml", "kn-IN": "kn", "bn-IN": "bn", "mr-IN": "mr",
    "gu-IN": "gu", "pa-IN": "pa", "od-IN": "or",
}
 
# ── Tutor system prompts ──────────────────────────────────────────────────────
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
5. ALWAYS respond in {language_name}
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
5. ALWAYS respond in {language_name}
6. Be conversational but focused on helping the student score well""",
}
 
# ── Podcast system prompt ─────────────────────────────────────────────────────
PODCAST_SYSTEM_PROMPT = """You are a scriptwriter for an educational podcast called "Divya & Sher Explain".
 
CHARACTERS:
- **Divya**: A warm, enthusiastic female teacher who explains concepts clearly with examples and analogies.
- **Sher**: A curious, sharp female AI tutor who asks insightful questions and keeps the conversation engaging.
 
RULES:
1. Write a natural, engaging conversation between Divya and Sher that summarises and explains the uploaded content.
2. Start with Divya greeting listeners and introducing the topic.
3. Sher should ask questions a student would ask; Divya answers them.
4. Keep it educational but fun — like two friends discussing what they learned.
5. Cover ALL key points from the content.
6. End with a brief recap by Sher and a motivational closing by Divya.
7. Each dialogue line should be 1-3 sentences max.
8. Output ONLY the dialogue in this exact format:
 
DIVYA: [dialogue]
SHER: [dialogue]
DIVYA: [dialogue]
...
 
Do NOT include stage directions or any other formatting.
Generate at least 20 exchanges (40+ lines) for thorough coverage."""
 
ASK_SYSTEM_PROMPT = """You are Divya, a warm and enthusiastic female teacher having a conversation with a student.
 
RULES:
1. Respond naturally and warmly as Divya
2. Keep responses concise (2-4 sentences)
3. Be encouraging and educational
4. If the question is about the content, reference it directly
5. Use simple Hindi-English mix naturally if appropriate
6. Explain concepts clearly with simple examples
 
OUTPUT FORMAT (exactly this, no extra text):
DIVYA: [your response]"""
 
MINDMAP_SYSTEM_PROMPT = """You are an educational content analyser. Generate a mind map structure from the provided content.
 
OUTPUT ONLY valid JSON in this exact format:
{
  "title": "Main Topic Title",
  "branches": [
    {"label": "Branch 1 Name", "children": ["Sub-point 1", "Sub-point 2", "Sub-point 3"]},
    {"label": "Branch 2 Name", "children": ["Sub-point 1", "Sub-point 2"]}
  ],
  "summary": "A one-sentence summary of the entire content"
}
 
RULES:
- Create 4-6 main branches covering key topics
- Each branch should have 2-4 children (brief, 3-8 words each)
- Output ONLY the JSON, no other text"""
 
 
# ══════════════════════════════════════════════════════════════════════════════
# SHARED UTILITIES
# ══════════════════════════════════════════════════════════════════════════════
 
async def _sarvam_tts(text: str, speaker: str, language: str) -> bytes:
    """Generate TTS audio via Sarvam AI. Returns concatenated WAV bytes."""
    import httpx
 
    if not SARVAM_KEY:
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY is not configured")
 
    # Chunk text at word boundaries (Sarvam limit ~490 chars per request)
    MAX_CHARS = 490
    words = text.split()
    chunks: List[str] = []
    current: List[str] = []
    for word in words:
        if sum(len(w) + 1 for w in current) + len(word) > MAX_CHARS:
            if current:
                chunks.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        chunks.append(" ".join(current))
    if not chunks:
        chunks = [text]
 
    wav_parts: List[bytes] = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for chunk in chunks:
            resp = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={
                    "API-Subscription-Key": SARVAM_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": [chunk],
                    "target_language_code": language,
                    "speaker": speaker,
                    "model": "bulbul:v2",
                    "enable_preprocessing": True,
                    "speech_sample_rate": 22050,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            audio_b64 = data["audios"][0]
            if "," in audio_b64:
                audio_b64 = audio_b64.split(",", 1)[1]
            wav_parts.append(base64.b64decode(audio_b64))
 
    if len(wav_parts) == 1:
        return wav_parts[0]
 
    # Concatenate multiple WAV chunks
    output = io.BytesIO()
    with wave.open(output, "wb") as out_wav:
        for i, wav_bytes in enumerate(wav_parts):
            with wave.open(io.BytesIO(wav_bytes), "rb") as in_wav:
                if i == 0:
                    out_wav.setparams(in_wav.getparams())
                out_wav.writeframes(in_wav.readframes(in_wav.getnframes()))
    return output.getvalue()
 
 
async def _extract_with_gemini(content: bytes, mime_type: str, filename: str) -> str:
    """Use Gemini to extract/describe content from files."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
 
    tmp_path = f"/tmp/divya_{uuid.uuid4().hex[:8]}_{filename}"
    with open(tmp_path, "wb") as f:
        f.write(content)
 
    try:
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"extract-{uuid.uuid4().hex[:8]}",
            system_message="Extract all text content from this file. If it's an image, describe the educational content in detail.",
        ).with_model("gemini", "gemini-2.5-flash")
 
        msg = UserMessage(
            text="Extract all text and educational content from this file.",
            file_contents=[FileContentWithMimeType(file_path=tmp_path, mime_type=mime_type)],
        )
        result = await chat.send_message(msg)
        return result.strip()
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
 
 
def _parse_dialogue(text: str) -> List[dict]:
    """Parse DIVYA:/SHER: dialogue into a structured list."""
    lines = []
    current_speaker = None
    current_text = []
 
    for line in text.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("DIVYA:"):
            if current_speaker and current_text:
                lines.append({"speaker": current_speaker, "text": " ".join(current_text).strip()})
            current_speaker = "Divya"
            current_text = [line[6:].strip()]
        elif line.startswith("SHER:"):
            if current_speaker and current_text:
                lines.append({"speaker": current_speaker, "text": " ".join(current_text).strip()})
            current_speaker = "Sher"
            current_text = [line[5:].strip()]
        elif current_speaker:
            current_text.append(line)
 
    if current_speaker and current_text:
        lines.append({"speaker": current_speaker, "text": " ".join(current_text).strip()})
 
    return lines
 
 
# ══════════════════════════════════════════════════════════════════════════════
# LIVE TUTOR ROUTES  (/divya/live/*)
# ══════════════════════════════════════════════════════════════════════════════
 
class LiveAskRequest(BaseModel):
    text: str
    tutor: str = "divya"
    language: str = "en-IN"
    context: str = ""
    chat_history: list = []
 
 
@live_router.post("/ask")
async def live_ask(req: LiveAskRequest):
    """Real-time tutoring: takes text, returns text + Sarvam audio response."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
 
    tutor = req.tutor.lower() if req.tutor.lower() in TUTOR_PROMPTS else "divya"
    language = _normalize_lang(req.language)
    language_name = LANGUAGE_NAMES[language]
    sarvam_speaker = SARVAM_VOICE_MAP.get(tutor, SARVAM_DEFAULT_SPEAKER)
 
    system_prompt = TUTOR_PROMPTS[tutor].format(language_name=language_name)
 
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
            system_message=system_prompt,
        ).with_model("gemini", "gemini-2.5-flash")
 
        response_text = await chat.send_message(UserMessage(text=full_prompt))
        response_text = response_text.strip()
 
        for prefix in ["DIVYA:", "SHER:", "Divya:", "Sher:"]:
            if response_text.startswith(prefix):
                response_text = response_text[len(prefix):].strip()
 
        audio_bytes = await _sarvam_tts(response_text[:2000], sarvam_speaker, language)
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
 
        return {
            "success": True,
            "text": response_text,
            "audio_base64": audio_b64,
            "tutor": tutor,
            "language": language,
        }
 
    except Exception as e:
        print(f"[DIVYA-LIVE] Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")
 
 
@live_router.post("/upload-context")
async def upload_context(files: List[UploadFile] = File(...)):
    """Upload PDF/images and extract text for tutoring context."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
 
    extracted_text = []
 
    for f in files:
        content = await f.read()
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
 
        if ext == "pdf":
            try:
                from PyPDF2 import PdfReader
 
                reader = PdfReader(io.BytesIO(content))
                pages_text = []
                for i, page in enumerate(reader.pages[:30]):
                    text = page.extract_text()
                    if text:
                        pages_text.append(f"[Page {i+1}] {text}")
                if pages_text:
                    extracted_text.append("\n".join(pages_text))
                else:
                    extracted_text.append(await _extract_with_gemini(content, "application/pdf", f.filename))
            except Exception:
                extracted_text.append(await _extract_with_gemini(content, "application/pdf", f.filename))
 
        elif ext in ("png", "jpg", "jpeg", "webp"):
            mime = f"image/{ext}" if ext != "jpg" else "image/jpeg"
            extracted_text.append(await _extract_with_gemini(content, mime, f.filename))
 
    full_context = "\n\n---\n\n".join(extracted_text)
    return {
        "success": True,
        "context": full_context[:8000],
        "char_count": len(full_context),
    }
 
 
@live_router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form("en-IN"),
):
    """Transcribe audio using OpenAI Whisper with language hint."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
 
    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")
 
    whisper_lang = WHISPER_LANG_MAP.get(_normalize_lang(language), "en")
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
            language=whisper_lang,
        )
 
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
        raise HTTPException(
            status_code=500,
            detail="Transcription failed. Please try again or type your question instead.",
        )
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass
 
 
# ══════════════════════════════════════════════════════════════════════════════
# PODCAST + ASK + MIND-MAP ROUTES  (/divya/*)
# ══════════════════════════════════════════════════════════════════════════════
 
async def _generate_dialogue(file_paths: List[str], mime_types: List[str], user_prompt: str = "") -> str:
    """Use Gemini to generate a podcast dialogue from uploaded files."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
 
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"divya-{uuid.uuid4().hex[:8]}",
        system_message=PODCAST_SYSTEM_PROMPT,
    ).with_model("gemini", "gemini-2.5-flash")
 
    file_contents = [
        FileContentWithMimeType(file_path=fp, mime_type=mime)
        for fp, mime in zip(file_paths, mime_types)
    ]
 
    prompt = "Summarise and explain the content from the uploaded files as a podcast dialogue between Divya and Sher."
    if user_prompt:
        prompt += f"\n\nUser's specific request: {user_prompt}"
 
    return await chat.send_message(UserMessage(text=prompt, file_contents=file_contents))
 
 
async def _podcast_audio_sarvam(dialogue: List[dict], language: str = "en-IN") -> bytes:
    """Generate full podcast audio from dialogue using Sarvam TTS. Returns WAV bytes."""
    voice_map = {"Divya": "anushka", "Sher": "manisha"}
    wav_parts: List[bytes] = []
 
    for line in dialogue:
        speaker_voice = voice_map.get(line["speaker"], SARVAM_DEFAULT_SPEAKER)
        chunk_bytes = await _sarvam_tts(line["text"], speaker_voice, language)
        wav_parts.append(chunk_bytes)
 
    if not wav_parts:
        return b""
    if len(wav_parts) == 1:
        return wav_parts[0]
 
    # Concatenate all WAV parts
    output = io.BytesIO()
    with wave.open(output, "wb") as out_wav:
        for i, wav_bytes in enumerate(wav_parts):
            with wave.open(io.BytesIO(wav_bytes), "rb") as in_wav:
                if i == 0:
                    out_wav.setparams(in_wav.getparams())
                out_wav.writeframes(in_wav.readframes(in_wav.getnframes()))
    return output.getvalue()
 
 
@router.post("/generate-podcast")
async def generate_podcast(
    files: List[UploadFile] = File(...),
    prompt: Optional[str] = Form(""),
    language: Optional[str] = Form("en-IN"),
):
    """Upload PDF(s)/images. Returns podcast-style dialogue + Sarvam WAV audio."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
 
    if len(files) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 files allowed")
 
    saved_paths, mime_types = [], []
    has_pdf = False
 
    for f in files:
        content = await f.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File {f.filename} exceeds 20MB limit")
 
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else ""
        content_type = f.content_type or ""
 
        if ext == "pdf" or "pdf" in content_type:
            if has_pdf:
                raise HTTPException(status_code=400, detail="Only 1 PDF allowed per request")
            has_pdf = True
            mime = "application/pdf"
        elif ext in ("png", "jpg", "jpeg", "webp") or "image" in content_type:
            mime = f"image/{ext}" if ext in ("png", "jpeg", "webp") else "image/jpeg"
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {f.filename}. Use PDF or images (PNG/JPG/WEBP)",
            )
 
        fpath = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex[:10]}_{f.filename}")
        with open(fpath, "wb") as out:
            out.write(content)
        saved_paths.append(fpath)
        mime_types.append(mime)
 
    # Normalise language (accept short or full codes)
    lang = _normalize_lang(language)
 
    try:
        raw_dialogue = await _generate_dialogue(saved_paths, mime_types, prompt or "")
        dialogue = _parse_dialogue(raw_dialogue)
 
        if len(dialogue) < 4:
            raise HTTPException(
                status_code=500,
                detail="Could not generate enough dialogue. Please try with different content.",
            )
 
        audio_bytes = await _podcast_audio_sarvam(dialogue, lang)
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
 
        return {
            "success": True,
            "dialogue": dialogue,
            "audio_base64": audio_base64,
            "total_lines": len(dialogue),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
 
    except HTTPException:
        raise
    except Exception as e:
        print(f"[DIVYA] Error generating podcast: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate podcast: {str(e)}")
    finally:
        for fp in saved_paths:
            try:
                os.remove(fp)
            except OSError:
                pass
 
 
class AskRequest(BaseModel):
    question: str
    context: str = ""
    recent_chat: str = ""
 
 
@router.post("/ask")
async def ask_question(req: AskRequest):
    """Handle user questions during the 'Join Conversation' feature."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
 
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
 
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"divya-ask-{uuid.uuid4().hex[:8]}",
            system_message=ASK_SYSTEM_PROMPT,
        ).with_model("gemini", "gemini-2.5-flash")
 
        prompt = f"Student's question: {req.question}"
        if req.context:
            prompt = f"Content context:\n{req.context[:2000]}\n\n{prompt}"
        if req.recent_chat:
            prompt = f"Recent conversation:\n{req.recent_chat}\n\n{prompt}"
 
        response = await chat.send_message(UserMessage(text=prompt))
        response_text = response.strip()
 
        if response_text.startswith("DIVYA:"):
            response_text = response_text[6:].strip()
        response_text = " ".join(response_text.split("\n")).strip()
 
        return {"success": True, "responses": [{"speaker": "Divya", "text": response_text}]}
 
    except Exception as e:
        print(f"[DIVYA] Ask error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")
 
 
class MindMapRequest(BaseModel):
    content: str
 
 
@router.post("/mind-map")
async def generate_mind_map(req: MindMapRequest):
    """Generate a mind map structure from the content."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
 
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Content is required")
 
    try:
        import json
        from emergentintegrations.llm.chat import LlmChat, UserMessage
 
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"divya-map-{uuid.uuid4().hex[:8]}",
            system_message=MINDMAP_SYSTEM_PROMPT,
        ).with_model("gemini", "gemini-2.5-flash")
 
        response = await chat.send_message(
            UserMessage(text=f"Create a mind map from this educational content:\n\n{req.content[:4000]}")
        )
 
        response_text = response.strip()
        if response_text.startswith("{"):
            json_str = response_text
        else:
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start != -1 and end > start:
                json_str = response_text[start:end]
            else:
                raise ValueError("No valid JSON found in response")
 
        mind_map = json.loads(json_str)
        if not isinstance(mind_map.get("branches"), list):
            mind_map["branches"] = []
        if not mind_map.get("title"):
            mind_map["title"] = "Content Overview"
 
        return {"success": True, "mind_map": mind_map}
 
    except json.JSONDecodeError:
        return {
            "success": True,
            "mind_map": {
                "title": "Content Summary",
                "branches": [{"label": "Key Points", "children": ["See transcript for details"]}],
                "summary": "Could not generate detailed mind map. Please review the transcript.",
            },
        }
    except Exception as e:
        print(f"[DIVYA] Mind map error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate mind map: {str(e)}")