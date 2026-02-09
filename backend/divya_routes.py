"""
Divya AI Tutor — Podcast-style PDF/Image summarizer
Two AI characters (Divya + Sher) discuss uploaded content as a podcast.
"""
import os
import uuid
import asyncio
import tempfile
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/divya", tags=["divya"])

EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
UPLOAD_DIR = "/tmp/divya_uploads"
AUDIO_DIR = "/tmp/divya_audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

MAX_PDF_PAGES = 30
MAX_IMAGES = 5
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

SYSTEM_PROMPT = """You are a scriptwriter for an educational podcast called "Divya & Sher Explain".

CHARACTERS:
- **Divya**: A warm, enthusiastic female teacher who explains concepts clearly with examples and analogies. She leads the discussion.
- **Sher**: A curious, sharp female AI tutor who asks insightful questions, adds interesting facts, and keeps the conversation engaging.

RULES:
1. Write a natural, engaging conversation between Divya and Sher that summarizes and explains the uploaded content.
2. Start with Divya greeting listeners and introducing the topic.
3. Sher should ask questions that a student would ask, and Divya should answer them.
4. Keep it educational but fun — like two friends discussing what they learned.
5. Cover ALL key points from the content — don't skip important details.
6. End with a brief recap by Sher and a motivational closing by Divya.
7. Each dialogue line should be 1-3 sentences max for natural speech.
8. Output ONLY the dialogue in this exact format (no other text):

DIVYA: [dialogue text]
SHER: [dialogue text]
DIVYA: [dialogue text]
...

Do NOT include any stage directions, descriptions, or formatting other than DIVYA: and SHER: prefixes.
Generate at least 20 exchanges (40+ lines) for thorough coverage."""


def parse_dialogue(text: str) -> List[dict]:
    """Parse DIVYA:/SHER: dialogue into structured list."""
    lines = []
    current_speaker = None
    current_text = []

    for line in text.strip().split('\n'):
        line = line.strip()
        if not line:
            continue

        if line.startswith('DIVYA:'):
            if current_speaker and current_text:
                lines.append({"speaker": current_speaker, "text": ' '.join(current_text).strip()})
            current_speaker = "Divya"
            current_text = [line[6:].strip()]
        elif line.startswith('SHER:'):
            if current_speaker and current_text:
                lines.append({"speaker": current_speaker, "text": ' '.join(current_text).strip()})
            current_speaker = "Sher"
            current_text = [line[5:].strip()]
        elif current_speaker:
            current_text.append(line)

    if current_speaker and current_text:
        lines.append({"speaker": current_speaker, "text": ' '.join(current_text).strip()})

    return lines


async def generate_dialogue(file_paths: List[str], mime_types: List[str], user_prompt: str = "") -> str:
    """Use Gemini to generate a podcast dialogue from uploaded files."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"divya-{uuid.uuid4().hex[:8]}",
        system_message=SYSTEM_PROMPT
    ).with_model("gemini", "gemini-2.5-flash")

    file_contents = []
    for fpath, mime in zip(file_paths, mime_types):
        file_contents.append(FileContentWithMimeType(file_path=fpath, mime_type=mime))

    prompt = "Summarize and explain the content from the uploaded files as a podcast dialogue between Divya and Sher."
    if user_prompt:
        prompt += f"\n\nUser's specific request: {user_prompt}"

    msg = UserMessage(text=prompt, file_contents=file_contents)
    response = await chat.send_message(msg)
    return response


async def generate_audio_for_line(text: str, voice: str, idx: int) -> str:
    """Generate TTS audio for a single dialogue line."""
    from emergentintegrations.llm.openai import OpenAITextToSpeech

    tts = OpenAITextToSpeech(api_key=EMERGENT_KEY)

    # Chunk if > 4000 chars
    chunks = [text[i:i+4000] for i in range(0, len(text), 4000)]
    audio_parts = []
    for chunk in chunks:
        audio_bytes = await tts.generate_speech(
            text=chunk,
            model="tts-1",
            voice=voice,
            response_format="mp3",
            speed=1.05
        )
        audio_parts.append(audio_bytes)

    out_path = os.path.join(AUDIO_DIR, f"line_{idx}_{uuid.uuid4().hex[:6]}.mp3")
    with open(out_path, 'wb') as f:
        for part in audio_parts:
            f.write(part)
    return out_path


async def generate_podcast_audio(dialogue: List[dict]) -> str:
    """Generate full podcast audio from dialogue lines, concatenating MP3 files."""
    # Divya = nova (higher, feminine, alto - like Capella)
    # Sher = echo (mid-range, masculine-leaning - like Eclipse)
    # Both use English-Hindi blend naturally through content
    voice_map = {"Divya": "nova", "Sher": "echo"}

    audio_files = []
    for idx, line in enumerate(dialogue):
        voice = voice_map.get(line["speaker"], "nova")
        audio_path = await generate_audio_for_line(line["text"], voice, idx)
        audio_files.append(audio_path)

    # Concatenate MP3 files
    output_path = os.path.join(AUDIO_DIR, f"podcast_{uuid.uuid4().hex[:8]}.mp3")
    with open(output_path, 'wb') as out:
        for af in audio_files:
            with open(af, 'rb') as inp:
                out.write(inp.read())

    # Cleanup individual files
    for af in audio_files:
        try:
            os.remove(af)
        except OSError:
            pass

    return output_path


@router.post("/generate-podcast")
async def generate_podcast(
    files: List[UploadFile] = File(...),
    prompt: Optional[str] = Form("")
):
    """
    Upload PDF(s) and/or images (up to 5). Returns a podcast-style dialogue + audio.
    """
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")

    if len(files) > MAX_IMAGES + 1:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_IMAGES + 1} files allowed")

    # Save and validate files
    saved_paths = []
    mime_types = []
    has_pdf = False

    for f in files:
        if f.size and f.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File {f.filename} exceeds 20MB limit")

        content = await f.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File {f.filename} exceeds 20MB limit")

        ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else ''
        content_type = f.content_type or ''

        if ext == 'pdf' or 'pdf' in content_type:
            if has_pdf:
                raise HTTPException(status_code=400, detail="Only 1 PDF allowed per request")
            has_pdf = True
            mime = "application/pdf"
        elif ext in ('png', 'jpg', 'jpeg', 'webp') or 'image' in content_type:
            mime = f"image/{ext}" if ext in ('png', 'jpeg', 'webp') else "image/jpeg"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {f.filename}. Use PDF or images (PNG/JPG/WEBP)")

        fpath = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex[:10]}_{f.filename}")
        with open(fpath, 'wb') as out:
            out.write(content)
        saved_paths.append(fpath)
        mime_types.append(mime)

    try:
        # Step 1: Generate dialogue script
        raw_dialogue = await generate_dialogue(saved_paths, mime_types, prompt or "")
        dialogue = parse_dialogue(raw_dialogue)

        if len(dialogue) < 4:
            raise HTTPException(status_code=500, detail="Could not generate enough dialogue from the content. Please try with different content.")

        # Step 2: Generate podcast audio
        audio_path = await generate_podcast_audio(dialogue)
        audio_filename = os.path.basename(audio_path)

        return {
            "success": True,
            "dialogue": dialogue,
            "audio_url": f"/api/divya/audio/{audio_filename}",
            "total_lines": len(dialogue),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[DIVYA] Error generating podcast: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate podcast: {str(e)}")
    finally:
        # Cleanup uploaded files
        for fp in saved_paths:
            try:
                os.remove(fp)
            except OSError:
                pass


@router.get("/audio/{filename}")
async def get_audio(filename: str, request: "Request"):
    """Serve generated audio files with proper Range request support for browser audio players."""
    from fastapi.responses import Response
    from fastapi import Request
    
    filepath = os.path.join(AUDIO_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio not found")

    file_size = os.path.getsize(filepath)
    
    # Check for Range header (required for audio seeking in browsers)
    range_header = request.headers.get("range")
    
    if range_header:
        # Parse Range header: "bytes=start-end" or "bytes=start-"
        try:
            range_match = range_header.replace("bytes=", "").split("-")
            start = int(range_match[0]) if range_match[0] else 0
            end = int(range_match[1]) if range_match[1] else file_size - 1
            
            # Clamp values
            start = max(0, min(start, file_size - 1))
            end = max(start, min(end, file_size - 1))
            content_length = end - start + 1
            
            # Read the requested range
            with open(filepath, "rb") as f:
                f.seek(start)
                data = f.read(content_length)
            
            return Response(
                content=data,
                status_code=206,  # Partial Content
                media_type="audio/mpeg",
                headers={
                    "Accept-Ranges": "bytes",
                    "Content-Range": f"bytes {start}-{end}/{file_size}",
                    "Content-Length": str(content_length),
                    "Cache-Control": "public, max-age=3600",
                }
            )
        except (ValueError, IndexError):
            pass  # Fall through to full file response
    
    # No Range header or invalid range - return full file
    with open(filepath, "rb") as f:
        data = f.read()
    
    return Response(
        content=data,
        status_code=200,
        media_type="audio/mpeg",
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(file_size),
            "Cache-Control": "public, max-age=3600",
        }
    )



# Pydantic models for request bodies
from pydantic import BaseModel

class AskRequest(BaseModel):
    question: str
    context: str = ""
    recent_chat: str = ""

class MindMapRequest(BaseModel):
    content: str


ASK_SYSTEM_PROMPT = """You are Divya and Sher, two friendly AI tutors having a conversation with a student.
You are helping the student understand educational content they uploaded.

CHARACTERS:
- **Divya**: A warm, enthusiastic female teacher. She explains concepts clearly with examples.
- **Sher**: A curious, sharp female tutor who adds interesting facts and follow-up insights.

RULES:
1. Respond naturally as if continuing a podcast conversation with the student
2. Divya should provide the main answer
3. Sher should add a brief follow-up insight or interesting fact
4. Keep responses concise (2-3 sentences each)
5. Be encouraging and educational
6. If the question is about the content, reference it directly
7. Use simple Hindi-English mix naturally if appropriate (like "Acha, so...")

OUTPUT FORMAT (exactly this, no extra text):
DIVYA: [response]
SHER: [follow-up]"""


MINDMAP_SYSTEM_PROMPT = """You are an educational content analyzer. Generate a mind map structure from the provided content.

OUTPUT ONLY valid JSON in this exact format:
{
  "title": "Main Topic Title",
  "branches": [
    {
      "label": "Branch 1 Name",
      "children": ["Sub-point 1", "Sub-point 2", "Sub-point 3"]
    },
    {
      "label": "Branch 2 Name", 
      "children": ["Sub-point 1", "Sub-point 2"]
    }
  ],
  "summary": "A one-sentence summary of the entire content"
}

RULES:
- Create 4-6 main branches covering key topics
- Each branch should have 2-4 children points
- Keep labels concise (2-5 words)
- Keep children points brief (3-8 words each)
- The summary should be clear and educational
- Output ONLY the JSON, no other text"""


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
            system_message=ASK_SYSTEM_PROMPT
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Build context-aware prompt
        prompt = f"Student's question: {req.question}"
        if req.context:
            prompt = f"Content context:\n{req.context[:2000]}\n\n{prompt}"
        if req.recent_chat:
            prompt = f"Recent conversation:\n{req.recent_chat}\n\n{prompt}"
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse the response into Divya and Sher lines
        responses = []
        for line in response.strip().split('\n'):
            line = line.strip()
            if line.startswith('DIVYA:'):
                responses.append({"speaker": "Divya", "text": line[6:].strip()})
            elif line.startswith('SHER:'):
                responses.append({"speaker": "Sher", "text": line[5:].strip()})
        
        if not responses:
            responses = [{"speaker": "Divya", "text": response.strip()}]
        
        return {"success": True, "responses": responses}
        
    except Exception as e:
        print(f"[DIVYA] Ask error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")


@router.post("/mind-map")
async def generate_mind_map(req: MindMapRequest):
    """Generate a mind map structure from the content."""
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Content is required")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import json
        
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"divya-map-{uuid.uuid4().hex[:8]}",
            system_message=MINDMAP_SYSTEM_PROMPT
        ).with_model("gemini", "gemini-2.5-flash")
        
        response = await chat.send_message(UserMessage(
            text=f"Create a mind map from this educational content:\n\n{req.content[:4000]}"
        ))
        
        # Extract JSON from response
        response_text = response.strip()
        # Try to find JSON in the response
        if response_text.startswith('{'):
            json_str = response_text
        else:
            # Find JSON block
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            if start != -1 and end > start:
                json_str = response_text[start:end]
            else:
                raise ValueError("No valid JSON found in response")
        
        mind_map = json.loads(json_str)
        
        # Validate structure
        if not isinstance(mind_map.get('branches'), list):
            mind_map['branches'] = []
        if not mind_map.get('title'):
            mind_map['title'] = "Content Overview"
        
        return {"success": True, "mind_map": mind_map}
        
    except json.JSONDecodeError as e:
        print(f"[DIVYA] Mind map JSON error: {e}")
        # Return a basic fallback structure
        return {
            "success": True,
            "mind_map": {
                "title": "Content Summary",
                "branches": [
                    {"label": "Key Points", "children": ["See transcript for details"]}
                ],
                "summary": "Could not generate detailed mind map. Please review the transcript."
            }
        }
    except Exception as e:
        print(f"[DIVYA] Mind map error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate mind map: {str(e)}")
