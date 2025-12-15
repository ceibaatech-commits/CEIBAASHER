from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import base64
import os
import json
from typing import Optional
from datetime import datetime
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContent

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
    try:
        print(f"[Image Extraction] Starting extraction for exam: {exam_id}, subject: {subject}")
        
        # Read image file
        image_content = await image.read()
        
        # Convert to base64
        image_base64 = base64.b64encode(image_content).decode('utf-8')
        
        # Determine image media type
        media_type = image.content_type or "image/jpeg"
        print(f"[Image Extraction] Image received, type: {media_type}, size: {len(image_content)} bytes")
        
        # Initialize LlmChat with Emergent key and Claude model
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"image-extraction-{uuid.uuid4()}",
            system_message="You are an expert at extracting structured data from images. You analyze images containing educational questions and extract them in JSON format."
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        print("[Image Extraction] LlmChat initialized with Claude model")
        
        # Create file content with base64 image - use "image" as content_type for images
        image_attachment = FileContent(
            content_type="image",
            file_content_base64=image_base64
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

        # Create user message with file content
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_attachment]
        )
        
        print("[Image Extraction] Sending request to Claude Vision API...")
        
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
        
        print(f"[Image Extraction] Successfully extracted and saved {inserted_count} questions")
        
        # Return serializable response (prepared_questions are already without _id)
        response_questions = [
            {
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"]
            }
            for q in prepared_questions
        ]
        
        return {
            "success": True,
            "message": f"Successfully extracted and saved {inserted_count} questions",
            "questions_count": inserted_count,
            "questions": response_questions
        }
        
    except Exception as e:
        print(f"[Image Extraction] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error extracting questions: {str(e)}")


@router.post("/victory-lane/extract-questions-from-image")
async def extract_questions_for_victory_lane(
    image: UploadFile = File(...)
):
    """
    Extract MCQ questions from an uploaded image for Victory Lane quiz rooms
    Does NOT save to database - just returns extracted questions
    """
    try:
        print("[Victory Lane Image Extraction] Starting extraction")
        
        # Read image file
        image_content = await image.read()
        
        # Convert to base64
        image_base64 = base64.b64encode(image_content).decode('utf-8')
        
        # Determine image media type
        media_type = image.content_type or "image/jpeg"
        print(f"[Victory Lane Image Extraction] Image received, type: {media_type}, size: {len(image_content)} bytes")
        
        # Initialize LlmChat with Emergent key and Claude model
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"victory-image-{uuid.uuid4()}",
            system_message="You are an expert at extracting structured data from images. You analyze images containing educational questions and extract them in JSON format."
        ).with_model("anthropic", "claude-sonnet-4-20250514")
        
        print("[Victory Lane Image Extraction] LlmChat initialized")
        
        # Create file content
        image_attachment = FileContent(
            content_type="image",
            file_content_base64=image_base64
        )
        
        # Construct prompt
        prompt = """Extract all Multiple Choice Questions (MCQs) from this image. 

For each question, provide:
1. Question text (with proper mathematical notation if present)
2. Four options (A, B, C, D)
3. DO NOT include the correct answer - just extract the question and options

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "question": "Question text here",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"]
  }
]

Extract up to 50 questions. If there are mathematical formulas, use LaTeX notation within $ symbols.
Be accurate and thorough."""

        # Create user message
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_attachment]
        )
        
        print("[Victory Lane Image Extraction] Sending request to Claude...")
        
        # Send message and get response
        response_text = await chat.send_message(user_message)
        
        print(f"[Victory Lane Image Extraction] Response received, length: {len(response_text)} chars")
        
        # Parse JSON response
        try:
            if response_text.startswith("```"):
                response_text = response_text.split("```json")[1].split("```")[0].strip() if "```json" in response_text else response_text.split("```")[1].split("```")[0].strip()
            
            questions = json.loads(response_text)
        except json.JSONDecodeError as e:
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
            else:
                raise HTTPException(status_code=500, detail=f"Failed to parse response: {str(e)}")
        
        # Validate questions structure
        if not isinstance(questions, list) or len(questions) == 0:
            raise HTTPException(status_code=400, detail="No questions extracted from image")
        
        # Limit to 50 questions
        questions = questions[:50]
        
        print(f"[Victory Lane Image Extraction] Successfully extracted {len(questions)} questions")
        
        return {
            "success": True,
            "message": f"Successfully extracted {len(questions)} questions",
            "questions": questions
        }
        
    except Exception as e:
        print(f"[Victory Lane Image Extraction] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error extracting questions: {str(e)}")


@router.post("/extract-questions-from-sheet")
async def extract_questions_from_sheet(request: dict):
    """
    Extract MCQ questions from a Google Sheet URL
    Expected format: Question | Option A | Option B | Option C | Option D | Correct Answer (0-3)
    """
    try:
        sheet_url = request.get("sheet_url", "")
        
        if not sheet_url or "docs.google.com/spreadsheets" not in sheet_url:
            raise HTTPException(status_code=400, detail="Invalid Google Sheets URL")
        
        print(f"[Sheet Extraction] Starting extraction from: {sheet_url}")
        
        # Extract spreadsheet ID from URL
        import re
        sheet_id_match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', sheet_url)
        if not sheet_id_match:
            raise HTTPException(status_code=400, detail="Could not extract spreadsheet ID from URL")
        
        sheet_id = sheet_id_match.group(1)
        
        # Construct CSV export URL (this works for publicly accessible sheets)
        csv_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
        
        print(f"[Sheet Extraction] CSV URL: {csv_url}")
        
        # Fetch CSV data
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(csv_url) as response:
                if response.status != 200:
                    raise HTTPException(
                        status_code=400, 
                        detail="Failed to fetch sheet. Make sure it's publicly accessible (Anyone with the link can view)"
                    )
                
                csv_content = await response.text()
        
        print(f"[Sheet Extraction] CSV fetched, size: {len(csv_content)} bytes")
        
        # Parse CSV
        import csv
        from io import StringIO
        
        csv_reader = csv.reader(StringIO(csv_content))
        rows = list(csv_reader)
        
        if len(rows) < 2:  # At least header + 1 data row
            raise HTTPException(status_code=400, detail="Sheet is empty or has insufficient data")
        
        # Skip header row and parse questions
        questions = []
        for idx, row in enumerate(rows[1:], start=2):  # Start from row 2 (after header)
            if len(row) < 6:  # Need at least: question + 4 options + correct answer
                print(f"[Sheet Extraction] Row {idx} skipped - insufficient columns")
                continue
            
            try:
                question_text = row[0].strip()
                options = [row[1].strip(), row[2].strip(), row[3].strip(), row[4].strip()]
                
                # Parse correct answer (can be 0-3 or A-D)
                correct_answer_str = row[5].strip().upper()
                if correct_answer_str in ['A', 'B', 'C', 'D']:
                    correct_answer = ord(correct_answer_str) - ord('A')
                else:
                    correct_answer = int(correct_answer_str)
                
                if correct_answer < 0 or correct_answer > 3:
                    print(f"[Sheet Extraction] Row {idx} skipped - invalid correct answer")
                    continue
                
                # Optional explanation column
                explanation = row[6].strip() if len(row) > 6 else ""
                
                questions.append({
                    "question": question_text,
                    "options": options,
                    "correctAnswer": correct_answer,
                    "explanation": explanation
                })
                
                # Limit to 50 questions
                if len(questions) >= 50:
                    break
                    
            except (ValueError, IndexError) as e:
                print(f"[Sheet Extraction] Row {idx} skipped - parse error: {str(e)}")
                continue
        
        if len(questions) == 0:
            raise HTTPException(status_code=400, detail="No valid questions found in sheet")
        
        print(f"[Sheet Extraction] Successfully extracted {len(questions)} questions")
        
        return {
            "success": True,
            "message": f"Successfully extracted {len(questions)} questions",
            "questions": questions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Sheet Extraction] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error extracting questions from sheet: {str(e)}")
