"""
Question Image Upload Routes
Handles image uploads for quiz questions and options
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
import shutil
from pathlib import Path

router = APIRouter(prefix="/question-images", tags=["Question Images"])

# Upload directory
UPLOAD_DIR = Path(__file__).parent / "uploads" / "questions"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload")
async def upload_question_image(file: UploadFile = File(...)):
    """
    Upload an image for a question or option.
    Returns the image URL that can be stored in the question document.
    """
    try:
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Read file content to check size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = f"{unique_id}{file_ext}"
        file_path = UPLOAD_DIR / safe_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return the URL path (will be served via /api/question-images/view/{filename})
        image_url = f"/api/question-images/view/{safe_filename}"
        
        return {
            "success": True,
            "image_url": image_url,
            "filename": safe_filename
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/view/{filename}")
async def get_question_image(filename: str):
    """
    Serve an uploaded question image.
    """
    # Sanitize filename to prevent directory traversal
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Determine media type
    ext = file_path.suffix.lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    
    return FileResponse(file_path, media_type=media_type)


@router.delete("/delete/{filename}")
async def delete_question_image(filename: str):
    """
    Delete an uploaded question image.
    """
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        os.remove(file_path)
        return {"success": True, "message": "Image deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
