"""
Translation Routes - Multi-language support for quiz questions
Supports: English, Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, 
          Kannada, Malayalam, Punjabi, Odia, Urdu
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
import asyncio
from deep_translator import GoogleTranslator

router = APIRouter()

# Database connection will be injected
db = None

def init_db(database):
    """Initialize database connection"""
    global db
    db = database

# Supported languages with their codes
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "bn": "Bengali (বাংলা)",
    "mr": "Marathi (मराठी)",
    "gu": "Gujarati (ગુજરાતી)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "or": "Odia (ଓଡ଼ିଆ)",
    "ur": "Urdu (اردو)"
}


class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: str = "en"


class TranslateQuestionRequest(BaseModel):
    question_id: str
    target_lang: str


class TranslateBatchRequest(BaseModel):
    texts: List[str]
    target_lang: str
    source_lang: str = "en"


def translate_text_sync(text: str, target_lang: str, source_lang: str = "en") -> str:
    """Synchronous translation using GoogleTranslator"""
    if not text or not text.strip():
        return text
    
    if target_lang == source_lang:
        return text
    
    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        return translated if translated else text
    except Exception as e:
        print(f"Translation error: {e}")
        return text


async def translate_text(text: str, target_lang: str, source_lang: str = "en") -> str:
    """Async wrapper for translation"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, translate_text_sync, text, target_lang, source_lang)


async def get_cached_translation(text: str, target_lang: str, source_lang: str = "en") -> Optional[str]:
    """Check if translation exists in cache"""
    if db is None:
        return None
    
    cache_key = f"{source_lang}_{target_lang}_{hash(text)}"
    cached = await db.translations_cache.find_one({"cache_key": cache_key}, {"_id": 0})
    
    if cached:
        return cached.get("translated_text")
    return None


async def save_translation_cache(text: str, translated: str, target_lang: str, source_lang: str = "en"):
    """Save translation to cache"""
    if db is None:
        return
    
    cache_key = f"{source_lang}_{target_lang}_{hash(text)}"
    await db.translations_cache.update_one(
        {"cache_key": cache_key},
        {
            "$set": {
                "cache_key": cache_key,
                "original_text": text,
                "translated_text": translated,
                "source_lang": source_lang,
                "target_lang": target_lang,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )


@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    return {
        "success": True,
        "languages": [
            {"code": code, "name": name}
            for code, name in SUPPORTED_LANGUAGES.items()
        ]
    }


@router.post("/translate")
async def translate_single_text(request: TranslateRequest):
    """Translate a single text"""
    try:
        if request.target_lang not in SUPPORTED_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {request.target_lang}")
        
        # Check cache first
        cached = await get_cached_translation(request.text, request.target_lang, request.source_lang)
        if cached:
            return {
                "success": True,
                "original": request.text,
                "translated": cached,
                "target_lang": request.target_lang,
                "cached": True
            }
        
        # Translate
        translated = await translate_text(request.text, request.target_lang, request.source_lang)
        
        # Cache the result
        await save_translation_cache(request.text, translated, request.target_lang, request.source_lang)
        
        return {
            "success": True,
            "original": request.text,
            "translated": translated,
            "target_lang": request.target_lang,
            "cached": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")


@router.post("/translate/batch")
async def translate_batch_texts(request: TranslateBatchRequest):
    """Translate multiple texts at once"""
    try:
        if request.target_lang not in SUPPORTED_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {request.target_lang}")
        
        results = []
        for text in request.texts:
            # Check cache first
            cached = await get_cached_translation(text, request.target_lang, request.source_lang)
            if cached:
                results.append(cached)
            else:
                translated = await translate_text(text, request.target_lang, request.source_lang)
                await save_translation_cache(text, translated, request.target_lang, request.source_lang)
                results.append(translated)
        
        return {
            "success": True,
            "translations": results,
            "target_lang": request.target_lang
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")


@router.post("/translate/question")
async def translate_question(request: TranslateQuestionRequest):
    """Translate a quiz question with all its options"""
    try:
        if request.target_lang not in SUPPORTED_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {request.target_lang}")
        
        # Find the question
        question = await db.questions.find_one({"id": request.question_id}, {"_id": 0})
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # If target is English, return original
        if request.target_lang == "en":
            return {
                "success": True,
                "question": question,
                "language": request.target_lang
            }
        
        # Check if we have cached translation for this question
        cache_key = f"question_{request.question_id}_{request.target_lang}"
        cached = await db.question_translations.find_one({"cache_key": cache_key}, {"_id": 0})
        
        if cached:
            return {
                "success": True,
                "question": cached.get("translated_question"),
                "language": request.target_lang,
                "cached": True
            }
        
        # Translate the question
        translated_question = question.copy()
        
        # Translate question text
        if question.get("question"):
            translated_question["question"] = await translate_text(question["question"], request.target_lang)
        
        # Translate options
        if question.get("options"):
            translated_options = []
            for opt in question["options"]:
                translated_opt = await translate_text(opt, request.target_lang)
                translated_options.append(translated_opt)
            translated_question["options"] = translated_options
        
        # Translate explanation if exists
        if question.get("explanation"):
            translated_question["explanation"] = await translate_text(question["explanation"], request.target_lang)
        
        # Cache the translated question
        await db.question_translations.update_one(
            {"cache_key": cache_key},
            {
                "$set": {
                    "cache_key": cache_key,
                    "question_id": request.question_id,
                    "target_lang": request.target_lang,
                    "translated_question": translated_question,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        return {
            "success": True,
            "question": translated_question,
            "language": request.target_lang,
            "cached": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")


@router.get("/translate/questions/{sheet_id}")
async def get_translated_questions(
    sheet_id: str,
    target_lang: str = "en",
    skip: int = 0,
    limit: int = 50
):
    """Get all questions for a sheet with optional translation"""
    try:
        if target_lang not in SUPPORTED_LANGUAGES:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {target_lang}")
        
        # Get questions
        questions = await db.questions.find(
            {"sheet_id": sheet_id},
            {"_id": 0}
        ).skip(skip).limit(limit).to_list(limit)
        
        if target_lang == "en":
            return {
                "success": True,
                "questions": questions,
                "language": target_lang,
                "total": len(questions)
            }
        
        # Translate each question
        translated_questions = []
        for q in questions:
            cache_key = f"question_{q['id']}_{target_lang}"
            cached = await db.question_translations.find_one({"cache_key": cache_key}, {"_id": 0})
            
            if cached:
                translated_questions.append(cached.get("translated_question"))
            else:
                # Translate on the fly
                translated_q = q.copy()
                
                if q.get("question"):
                    translated_q["question"] = await translate_text(q["question"], target_lang)
                
                if q.get("options"):
                    translated_q["options"] = [
                        await translate_text(opt, target_lang) for opt in q["options"]
                    ]
                
                if q.get("explanation"):
                    translated_q["explanation"] = await translate_text(q["explanation"], target_lang)
                
                # Cache it
                await db.question_translations.update_one(
                    {"cache_key": cache_key},
                    {
                        "$set": {
                            "cache_key": cache_key,
                            "question_id": q["id"],
                            "target_lang": target_lang,
                            "translated_question": translated_q,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                    },
                    upsert=True
                )
                
                translated_questions.append(translated_q)
        
        return {
            "success": True,
            "questions": translated_questions,
            "language": target_lang,
            "total": len(translated_questions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")
