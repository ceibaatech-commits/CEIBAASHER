"""
Media Upload Routes for Victory Lane Posts
Handles image and video uploads for social posts
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
from pathlib import Path

router = APIRouter(prefix="/media", tags=["Media Upload"])

# Upload directory for post media
UPLOAD_DIR = Path(__file__).parent / "uploads" / "media"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    """
    Upload an image or video for a Victory Lane post.
    Returns the media URL that can be stored in the post document.
    """
    try:
        # Get file extension
        file_ext = Path(file.filename).suffix.lower()
        
        # Determine file type
        is_image = file_ext in ALLOWED_IMAGE_EXTENSIONS
        is_video = file_ext in ALLOWED_VIDEO_EXTENSIONS
        
        if not is_image and not is_video:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed images: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}. Allowed videos: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
            )
        
        # Read file content to check size
        content = await file.read()
        file_size = len(content)
        
        # Check size limits
        if is_image and file_size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large. Maximum size: {MAX_IMAGE_SIZE // (1024*1024)}MB"
            )
        
        if is_video and file_size > MAX_VIDEO_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Video too large. Maximum size: {MAX_VIDEO_SIZE // (1024*1024)}MB"
            )
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())[:12]
        safe_filename = f"{unique_id}{file_ext}"
        file_path = UPLOAD_DIR / safe_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return the URL path
        media_url = f"/api/media/view/{safe_filename}"
        
        return {
            "success": True,
            "url": media_url,
            "filename": safe_filename,
            "type": "image" if is_image else "video",
            "size": file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/view/{filename}")
async def get_media(filename: str):
    """
    Serve an uploaded media file.
    """
    # Sanitize filename to prevent directory traversal
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Determine media type
    ext = file_path.suffix.lower()
    media_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".avi": "video/x-msvideo"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    
    return FileResponse(file_path, media_type=media_type)


@router.delete("/delete/{filename}")
async def delete_media(filename: str):
    """
    Delete an uploaded media file.
    """
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Media not found")
    
    try:
        os.remove(file_path)
        return {"success": True, "message": "Media deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
