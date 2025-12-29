"""
Admin Data Routes - Manage hardcoded exam data and CBSE chapters
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import re

router = APIRouter()

# ============== PYDANTIC MODELS ==============

class HardcodedExamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None

class CbseChapterDelete(BaseModel):
    class_key: str
    subject_slug: str
    chapter_index: int

class CbseChapterCreate(BaseModel):
    class_key: str
    subject_slug: str
    chapter_name: str

class CbseChapterUpdate(BaseModel):
    class_key: str
    subject_slug: str
    chapter_index: int
    new_chapter_name: str

# ============== HARDCODED EXAM ROUTES ==============

@router.delete("/hardcoded-exam/{exam_id}")
async def delete_hardcoded_exam(exam_id: str):
    """
    Delete a hardcoded exam from exam_data.py
    Note: This modifies the source Python file
    """
    try:
        # Read the exam_data.py file
        exam_data_path = os.path.join(os.path.dirname(__file__), 'exam_data.py')
        
        with open(exam_data_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find and remove the exam entry
        # This is a simplified approach - for production, consider using AST
        pattern = rf'\s*\{{\s*"id":\s*"{re.escape(exam_id)}"[^}}]*\}},?\s*'
        
        new_content = re.sub(pattern, '', content)
        
        if content == new_content:
            raise HTTPException(status_code=404, detail=f"Exam with ID '{exam_id}' not found")
        
        # Write back the modified content
        with open(exam_data_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return {"success": True, "message": f"Exam '{exam_id}' deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/hardcoded-exam/{exam_id}")
async def update_hardcoded_exam(exam_id: str, exam: HardcodedExamUpdate):
    """
    Update a hardcoded exam in exam_data.py
    Note: This modifies the source Python file
    """
    try:
        exam_data_path = os.path.join(os.path.dirname(__file__), 'exam_data.py')
        
        with open(exam_data_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the exam entry and update fields
        # This is complex for Python files - for now, return a message
        return {
            "success": False, 
            "message": "Direct file editing for hardcoded exams requires manual update in exam_data.py",
            "suggestion": f"To update exam '{exam_id}', please edit /app/backend/exam_data.py directly"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== CBSE CHAPTER ROUTES ==============

@router.delete("/cbse-chapter")
async def delete_cbse_chapter(data: CbseChapterDelete):
    """
    Delete a chapter from CBSE data files
    Modifies both cbse_chapter_data.py and cbse_master_data.py
    """
    try:
        # This requires modifying Python source files
        # For safety, we'll return instructions instead of auto-modifying
        return {
            "success": False,
            "message": "CBSE chapter deletion requires manual update",
            "files_to_edit": [
                "/app/backend/cbse_chapter_data.py",
                "/app/backend/cbse_master_data.py"
            ],
            "instruction": f"Remove chapter at index {data.chapter_index} from class {data.class_key}, subject {data.subject_slug}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cbse-chapter")
async def create_cbse_chapter(data: CbseChapterCreate):
    """
    Add a new chapter to CBSE data
    """
    try:
        return {
            "success": False,
            "message": "CBSE chapter creation requires manual update",
            "files_to_edit": [
                "/app/backend/cbse_chapter_data.py",
                "/app/backend/cbse_master_data.py"
            ],
            "instruction": f"Add chapter '{data.chapter_name}' to class {data.class_key}, subject {data.subject_slug}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/cbse-chapter")
async def update_cbse_chapter(data: CbseChapterUpdate):
    """
    Update a chapter in CBSE data
    """
    try:
        return {
            "success": False,
            "message": "CBSE chapter update requires manual update",
            "files_to_edit": [
                "/app/backend/cbse_chapter_data.py",
                "/app/backend/cbse_master_data.py"
            ],
            "instruction": f"Update chapter at index {data.chapter_index} to '{data.new_chapter_name}' in class {data.class_key}, subject {data.subject_slug}"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== GET FILTERED EXAMS ==============

@router.get("/other-competitive-exams")
async def get_other_competitive_exams():
    """
    Get exams filtered to show only 'Other Competitive Exams'
    Excludes specific IDs and categories
    """
    try:
        from exam_data import EXAM_DATA
        
        EXCLUDED_IDS = ['NDA', 'Agniveer', 'CDS', 'CAPF']
        EXCLUDED_CATEGORIES = [
            'Admission Tests', 'Banking Examinations', 'UPSC Examinations', 
            'SSC Examinations', 'Teaching Examinations', 'Language Proficiency Tests', 
            'Language Games', 'UPPSC Examinations', 'CSBC Examinations', 
            'RSMSSB Examinations', 'Defence Exams', 'Government Jobs', 'Medical Entrance'
        ]
        
        filtered_exams = []
        for exam in EXAM_DATA:
            exam_id = exam.get('id', '').upper()
            exam_category = exam.get('category', '')
            
            # Skip if ID is in excluded list
            if exam_id in EXCLUDED_IDS:
                continue
            
            # Skip if category is in excluded list
            if exam_category in EXCLUDED_CATEGORIES:
                continue
            
            filtered_exams.append(exam)
        
        return {
            "success": True,
            "exams": filtered_exams,
            "total": len(filtered_exams),
            "excluded_ids": EXCLUDED_IDS,
            "excluded_categories": EXCLUDED_CATEGORIES
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
