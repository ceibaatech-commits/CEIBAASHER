"""
Media Upload Routes for Victory Lane Posts
Uses Cloudinary CDN for image and video hosting - offloads media from main server.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
import os
import time
import uuid
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from dotenv import load_dotenv
from typing import Optional
from pydantic import BaseModel

load_dotenv()

router = APIRouter(prefix="/media", tags=["Media Upload"])
db = None

def init_db(database):
    global db
    db = database

# Initialize Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# Fallback local upload directory (for legacy support)
UPLOAD_DIR = Path(__file__).parent / "uploads" / "media"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi", ".mkv"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_VIDEO_DURATION = 90  # 1 minute 30 seconds

# Allowed folders for Cloudinary
ALLOWED_FOLDERS = ("posts/", "users/", "avatars/", "covers/")

# Aspect ratio configurations
# 16:9 for professional content (1600x900)
# 4:5 for engagement/vertical (1080x1350)
IMAGE_TRANSFORMATIONS = {
    "feed": "c_fill,w_1200,ar_16:9,q_auto,f_auto|c_fill,w_600,ar_4:5,q_auto,f_auto|c_thumb,w_150,h_150,g_face,q_auto",
    "profile": "c_fill,w_400,h_400,g_face,q_auto,f_auto",
    "cover": "c_fill,w_1500,h_500,q_auto,f_auto"
}

VIDEO_TRANSFORMATIONS = "c_scale,w_1280,ar_16:9,q_auto|c_scale,w_720,ar_16:9,q_auto|c_scale,w_480,q_auto"


class DeleteMediaRequest(BaseModel):
    public_id: str
    resource_type: str = "image"


# ==================== CLOUDINARY ENDPOINTS ====================

@router.get("/cloudinary/signature")
async def generate_cloudinary_signature(
    resource_type: str = Query("image", enum=["image", "video"]),
    folder: str = Query("posts/", description="Upload folder path"),
    use_case: str = Query("feed", enum=["feed", "profile", "cover"], description="Use case for transformations")
):
    """
    Generate a signed upload signature for Cloudinary.
    Frontend uses this to upload directly to Cloudinary CDN (offloads server).
    
    Aspect Ratios:
    - 16:9 (1600x900) for professional content/links
    - 4:5 (1080x1350) for engagement/vertical images (like Instagram)
    - Avoids ultra-tall images (nothing taller than 4:5)
    
    Video: Max 90 seconds (1:30)
    """
    # Validate folder
    if not any(folder.startswith(f) for f in ALLOWED_FOLDERS):
        raise HTTPException(status_code=400, detail=f"Invalid folder. Allowed: {ALLOWED_FOLDERS}")
    
    timestamp = int(time.time())
    
    # Parameters to sign - only include params that will be sent as form data
    params = {
        "timestamp": timestamp,
        "folder": folder,
    }
    
    # Add transformation presets based on resource type and use case
    if resource_type == "image":
        # Use case-specific transformations with proper aspect ratios
        eager_transform = IMAGE_TRANSFORMATIONS.get(use_case, IMAGE_TRANSFORMATIONS["feed"])
        params["eager"] = eager_transform
    elif resource_type == "video":
        # Video with duration limit and proper aspect ratio
        params["eager"] = VIDEO_TRANSFORMATIONS
        params["eager_async"] = "true"
        # Note: resource_type is NOT included in signature - it's in the URL path
        # Note: Duration validation happens on frontend before upload
    
    # Generate signature
    signature = cloudinary.utils.api_sign_request(
        params,
        os.getenv("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "folder": folder,
        "resource_type": resource_type,
        "eager": params.get("eager"),
        "eager_async": params.get("eager_async", "false"),
        "upload_url": f"https://api.cloudinary.com/v1_1/{os.getenv('CLOUDINARY_CLOUD_NAME')}/{resource_type}/upload",
        "max_video_duration": MAX_VIDEO_DURATION if resource_type == "video" else None
    }


@router.get("/cloudinary/config")
async def get_cloudinary_config():
    """
    Get public Cloudinary configuration for frontend.
    """
    return {
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "max_image_size": MAX_IMAGE_SIZE,
        "max_video_size": MAX_VIDEO_SIZE,
        "max_video_duration": MAX_VIDEO_DURATION,  # 90 seconds (1:30)
        "allowed_image_formats": ["jpg", "jpeg", "png", "gif", "webp"],
        "allowed_video_formats": ["mp4", "mov", "avi", "webm", "mkv"],
        "aspect_ratios": {
            "professional": "16:9",  # 1600x900 for links/graphics
            "engagement": "4:5",     # 1080x1350 for vertical content
            "max_vertical": "4:5"    # Don't go taller than this
        }
    }


@router.post("/cloudinary/delete")
async def delete_cloudinary_media(request: DeleteMediaRequest):
    """
    Delete media from Cloudinary (backend only).
    Should be called after verifying ownership.
    """
    try:
        result = cloudinary.uploader.destroy(
            request.public_id,
            resource_type=request.resource_type,
            invalidate=True
        )
        
        if result.get("result") == "ok":
            return {"success": True, "message": "Media deleted successfully"}
        else:
            return {"success": False, "message": "Media not found or already deleted", "result": result}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete media: {str(e)}")


@router.get("/cloudinary/transform")
async def get_transformed_url(
    public_id: str,
    resource_type: str = Query("image", enum=["image", "video"]),
    width: Optional[int] = None,
    height: Optional[int] = None,
    crop: str = Query("fill", enum=["fill", "fit", "thumb", "scale", "limit"]),
    quality: str = "auto",
    format: str = "auto"
):
    """
    Generate a transformed URL for an existing Cloudinary asset.
    """
    transformations = []
    
    if crop:
        transformations.append(f"c_{crop}")
    if width:
        transformations.append(f"w_{width}")
    if height:
        transformations.append(f"h_{height}")
    if quality:
        transformations.append(f"q_{quality}")
    if format:
        transformations.append(f"f_{format}")
    
    # Add face detection for avatars
    if "avatar" in public_id or "profile" in public_id:
        transformations.append("g_face")
    
    transform_str = ",".join(transformations) if transformations else ""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    
    if transform_str:
        url = f"https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transform_str}/{public_id}"
    else:
        url = f"https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}"
    
    return {"url": url, "public_id": public_id}


# ==================== LEGACY LOCAL UPLOAD (Fallback) ====================

@router.post("/upload")
async def upload_media(file: UploadFile = File(...)):
    """
    Direct upload to server (LEGACY - use Cloudinary signature flow instead).
    Kept for backward compatibility.
    """
    try:
        # Check global media permission
        if db is not None:
            settings = await db.platform_settings.find_one({"type": "victory_lane"}, {"_id": 0})
            if not settings or not settings.get("allow_media_posts", False):
                raise HTTPException(status_code=403, detail="Media uploads are currently disabled by administrator")
            
            file_ext = Path(file.filename).suffix.lower()
            is_image = file_ext in ALLOWED_IMAGE_EXTENSIONS
            is_video = file_ext in ALLOWED_VIDEO_EXTENSIONS
            
            if is_image and not settings.get("allow_image_posts", False):
                raise HTTPException(status_code=403, detail="Image uploads are currently disabled by administrator")
            if is_video and not settings.get("allow_video_posts", False):
                raise HTTPException(status_code=403, detail="Video uploads are currently disabled by administrator")
        else:
            file_ext = Path(file.filename).suffix.lower()
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
        
        # Save file locally (legacy)
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return the URL path
        media_url = f"/api/media/view/{safe_filename}"
        
        return {
            "success": True,
            "url": media_url,
            "filename": safe_filename,
            "type": "image" if is_image else "video",
            "size": file_size,
            "storage": "local"  # Indicate this is local storage
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/view/{filename}")
async def get_media(filename: str):
    """
    Serve a locally uploaded media file (legacy).
    """
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Media not found")
    
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
    Delete a locally uploaded media file (legacy).
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


# ==================== HELPER FUNCTIONS ====================

def get_optimized_image_url(public_id: str, width: int = 800) -> str:
    """Generate optimized Cloudinary image URL."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/c_fill,w_{width},q_auto,f_auto/{public_id}"


def get_video_thumbnail_url(public_id: str, width: int = 400) -> str:
    """Generate video thumbnail URL from Cloudinary."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    return f"https://res.cloudinary.com/{cloud_name}/video/upload/c_fill,w_{width},h_{int(width*0.5625)},q_auto,f_jpg,so_0/{public_id}"


def get_video_stream_url(public_id: str) -> str:
    """Generate video streaming URL with adaptive quality."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    return f"https://res.cloudinary.com/{cloud_name}/video/upload/q_auto/{public_id}"
