from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import base64
import os
import json
from typing import Optional
from datetime import datetime
import uuid
import tempfile
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

router = APIRouter()

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "test_database")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# Emergent LLM Key from environment
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "sk-emergent-1F12f948757325bDaE")

@router.post("/extract-questions-from-image")
async def extract_questions_from_image(
    image: UploadFile = File(...),
    exam_id: str = Form(...),
    exam_name: str = Form(...),
    syllabus_topic: str = Form(...),
    subject: str = Form(...),
    sub_topic: Optional[str] = Form(None)
):
    """
    Extract MCQ questions from an uploaded image using Claude AI Vision
    """
    temp_file_path = None
    try:
        print(f"[Image Extraction] Starting extraction for exam: {exam_id}, subject: {subject}")
        
        # Read image file
        image_content = await image.read()
        
        # Determine image media type
        media_type = image.content_type or "image/jpeg"
        print(f"[Image Extraction] Image received, type: {media_type}, size: {len(image_content)} bytes")
        
        # Save image to temp file for emergentintegrations
        suffix = ".jpg"
        if "png" in media_type:
            suffix = ".png"
        elif "webp" in media_type:
            suffix = ".webp"
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(image_content)
            temp_file_path = temp_file.name
        
        print(f"[Image Extraction] Saved temp file: {temp_file_path}")
        
        # Initialize LlmChat with Emergent key and Claude model
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"image-extraction-{uuid.uuid4()}",
            system_message="You are an expert at extracting structured data from images. You analyze images containing educational questions and extract them in JSON format."
        ).with_model("anthropic", "claude-3-5-sonnet-20241022")
        
        print(f"[Image Extraction] LlmChat initialized with Claude model")
        
        # Create image file content
        image_file = FileContentWithMimeType(
            file_path=temp_file_path,
            mime_type=media_type
        )
        
        # Construct prompt for Claude
        prompt = """Extract all Multiple Choice Questions (MCQs) from this image. 

For each question, provide:
1. Question text (with proper mathematical notation if present)
2. Option A text
3. Option B text
4. Option C text
5. Option D text
6. Correct answer (A, B, C, or D)
7. Explanation for the correct answer

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "question": "Question text here",
    "options": [
      {"id": "A", "text": "Option A text"},
      {"id": "B", "text": "Option B text"},
      {"id": "C", "text": "Option C text"},
      {"id": "D", "text": "Option D text"}
    ],
    "correct_answer": "A",
    "explanation": "Explanation text"
  }
]

If there are mathematical formulas, use LaTeX notation within $ symbols. For example: $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$

Extract ALL questions you can see in the image. Be accurate and thorough."""

        # Create user message with image attachment
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_file]
        )
        
        print(f"[Image Extraction] Sending request to Claude Vision API...")
        
        # Send message and get response
        response_text = await chat.send_message(user_message)
        
        print(f"[Image Extraction] Response received, length: {len(response_text)} chars")
        
        # Parse JSON response
        try:
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```json")[1].split("```")[0].strip() if "```json" in response_text else response_text.split("```")[1].split("```")[0].strip()
            
            questions = json.loads(response_text)
        except json.JSONDecodeError as e:
            # If JSON parsing fails, try to extract JSON from the text
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
            else:
                raise HTTPException(status_code=500, detail=f"Failed to parse Claude response: {str(e)}")
        
        # Validate questions structure
        if not isinstance(questions, list) or len(questions) == 0:
            raise HTTPException(status_code=400, detail="No questions extracted from image")
        
        # Prepare questions for database storage
        prepared_questions = []
        for idx, q in enumerate(questions):
            question_doc = {
                "id": str(uuid.uuid4()),
                "exam_id": exam_id,
                "exam_name": exam_name,
                "subject": syllabus_topic,
                "topic": subject,
                "subtopic": sub_topic or None,
                "question": q.get("question", ""),
                "options": q.get("options", []),
                "correct_answer": q.get("correct_answer", ""),
                "explanation": q.get("explanation", ""),
                "question_type": "MCQ",
                "marks": 4 if exam_id == "JEE" else 2.5,
                "negative_marks": -1 if exam_id == "JEE" else -0.83,
                "time_limit": 180,
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
                "source": "image_extraction"
            }
            prepared_questions.append(question_doc)
        
        # Insert into database
        if prepared_questions:
            result = await db.questions.insert_many(prepared_questions)
            inserted_count = len(result.inserted_ids)
        else:
            inserted_count = 0
        
        # Clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        print(f"[Image Extraction] Successfully extracted and saved {inserted_count} questions")
        
        return {
            "success": True,
            "message": f"Successfully extracted and saved {inserted_count} questions",
            "questions_count": inserted_count,
            "questions": prepared_questions  # Return for preview
        }
        
    except Exception as e:
        # Clean up temp file on error
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        
        print(f"[Image Extraction] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error extracting questions: {str(e)}")
