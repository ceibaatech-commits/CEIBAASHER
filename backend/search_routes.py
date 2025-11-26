from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import re

router = APIRouter(prefix="/api", tags=["search"])

# Import exam data
from exam_data import EXAMS
from cbse_chapter_data import CBSE_CHAPTER_DATA

@router.get("/search")
async def search_content(query: str = ""):
    """
    Search for exams and chapters based on query
    Returns unified results with type indication
    """
    if not query or len(query.strip()) < 2:
        return {"success": True, "results": []}
    
    query_lower = query.lower().strip()
    results = []
    
    # Search in exams
    for exam_key, exam_data in EXAMS.items():
        exam_name = exam_data.get("name", "")
        exam_full_name = exam_data.get("full_name", "")
        
        if (query_lower in exam_name.lower() or 
            query_lower in exam_full_name.lower() or
            query_lower in exam_key.lower()):
            results.append({
                "type": "exam",
                "name": exam_name,
                "full_name": exam_full_name,
                "slug": exam_key,
                "icon": exam_data.get("icon", "📝")
            })
    
    # Search in CBSE chapters
    for class_num, subjects in CBSE_CHAPTER_DATA.items():
        for subject_name, chapters in subjects.items():
            # Check if subject matches
            if query_lower in subject_name.lower():
                results.append({
                    "type": "chapter",
                    "name": f"Class {class_num} - {subject_name}",
                    "class": class_num,
                    "subject": subject_name.lower().replace(" ", "-"),
                    "chapter_count": len(chapters)
                })
                continue
            
            # Check individual chapters
            for chapter in chapters:
                chapter_name = chapter.get("name", "")
                if query_lower in chapter_name.lower():
                    results.append({
                        "type": "chapter",
                        "name": f"{chapter_name} (Class {class_num})",
                        "class": class_num,
                        "subject": subject_name.lower().replace(" ", "-"),
                        "chapter_name": chapter_name
                    })
    
    # Limit results to top 10
    results = results[:10]
    
    return {
        "success": True,
        "results": results,
        "count": len(results)
    }
