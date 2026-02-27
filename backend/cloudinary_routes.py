"""
Cloudinary Media Upload Routes
Handles signed uploads for images and videos to Cloudinary CDN.
Victory Lane social feed media storage.
"""
import os
import time
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Initialize Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

router = APIRouter(prefix="/media", tags=["Media Upload"])

# Allowed folders for security
ALLOWED_FOLDERS = ("posts/", "users/", "avatars/", "covers/")

# File size limits (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB


class DeleteMediaRequest(BaseModel):
    public_id: str
    resource_type: str = "image"


class UploadConfirmRequest(BaseModel):
    public_id: str
    secure_url: str
    resource_type: str
    format: str
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None  # For videos
    bytes: Optional[int] = None


@router.get("/signature")
async def generate_upload_signature(
    resource_type: str = Query("image", enum=["image", "video"]),
    folder: str = Query("posts/", description="Upload folder path")
):
    """
    Generate a signed upload signature for Cloudinary.
    Frontend uses this to upload directly to Cloudinary CDN.
    """
    # Validate folder
    if not any(folder.startswith(f) for f in ALLOWED_FOLDERS):
        raise HTTPException(status_code=400, detail=f"Invalid folder. Allowed: {ALLOWED_FOLDERS}")
    
    timestamp = int(time.time())
    
    # Parameters to sign
    params = {
        "timestamp": timestamp,
        "folder": folder,
    }
    
    # Add transformation presets based on resource type
    if resource_type == "image":
        params["eager"] = "c_fill,w_800,h_800,q_auto|c_fill,w_400,h_400,q_auto|c_thumb,w_150,h_150,g_face"
    elif resource_type == "video":
        params["eager"] = "c_scale,w_720,q_auto|c_scale,w_480,q_auto"
        params["eager_async"] = "true"
        params["resource_type"] = "video"
    
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
        # Upload URL for frontend
        "upload_url": f"https://api.cloudinary.com/v1_1/{os.getenv('CLOUDINARY_CLOUD_NAME')}/{resource_type}/upload"
    }


@router.get("/config")
async def get_cloudinary_config():
    """
    Get public Cloudinary configuration for frontend.
    """
    return {
        "cloud_name": os.getenv("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.getenv("CLOUDINARY_API_KEY"),
        "max_image_size": MAX_IMAGE_SIZE,
        "max_video_size": MAX_VIDEO_SIZE,
        "allowed_image_formats": ["jpg", "jpeg", "png", "gif", "webp"],
        "allowed_video_formats": ["mp4", "mov", "avi", "webm", "mkv"]
    }


@router.post("/delete")
async def delete_media(request: DeleteMediaRequest):
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
            return {"success": False, "message": "Media not found or already deleted"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete media: {str(e)}")


@router.get("/transform-url")
async def get_transformed_url(
    public_id: str,
    resource_type: str = Query("image", enum=["image", "video"]),
    width: Optional[int] = None,
    height: Optional[int] = None,
    crop: str = Query("fill", enum=["fill", "fit", "thumb", "scale"]),
    quality: str = "auto",
    format: str = "auto"
):
    """
    Generate a transformed URL for an existing Cloudinary asset.
    Useful for generating thumbnails, resized versions, etc.
    """
    transformations = []
    
    if width:
        transformations.append(f"w_{width}")
    if height:
        transformations.append(f"h_{height}")
    if crop:
        transformations.append(f"c_{crop}")
    if quality:
        transformations.append(f"q_{quality}")
    if format:
        transformations.append(f"f_{format}")
    
    # Add face detection for avatars/profile pics
    if "avatar" in public_id or "profile" in public_id:
        transformations.append("g_face")
    
    transform_str = ",".join(transformations) if transformations else ""
    
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    
    if transform_str:
        url = f"https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transform_str}/{public_id}"
    else:
        url = f"https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}"
    
    return {"url": url, "public_id": public_id}


# Helper function to build optimized URLs
def get_optimized_image_url(public_id: str, width: int = 800) -> str:
    """Generate optimized image URL with auto format and quality."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/c_fill,w_{width},q_auto,f_auto/{public_id}"


def get_video_thumbnail_url(public_id: str, width: int = 400) -> str:
    """Generate video thumbnail URL."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    return f"https://res.cloudinary.com/{cloud_name}/video/upload/c_fill,w_{width},h_{int(width*0.5625)},q_auto,f_jpg,so_0/{public_id}"


def get_video_stream_url(public_id: str) -> str:
    """Generate video streaming URL with adaptive quality."""
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    return f"https://res.cloudinary.com/{cloud_name}/video/upload/q_auto/{public_id}"
