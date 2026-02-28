/**
 * Cloudinary Upload Utility for Victory Lane
 * Handles signed uploads directly to Cloudinary CDN
 */

const BACKEND_URL = window.location.origin;

/**
 * Upload a file to Cloudinary using signed upload flow
 * @param {File} file - The file to upload
 * @param {string} resourceType - 'image' or 'video'
 * @param {string} folder - Upload folder (e.g., 'posts/', 'avatars/')
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<object>} Cloudinary response with secure_url, public_id, etc.
 */
export async function uploadToCloudinary(file, resourceType = 'image', folder = 'posts/', onProgress = null) {
  try {
    // Step 1: Get signed upload params from backend
    const signatureRes = await fetch(
      `${BACKEND_URL}/api/media/cloudinary/signature?resource_type=${resourceType}&folder=${folder}`
    );
    
    if (!signatureRes.ok) {
      throw new Error('Failed to get upload signature');
    }
    
    const sigData = await signatureRes.json();
    
    // Step 2: Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sigData.api_key);
    formData.append('timestamp', sigData.timestamp);
    formData.append('signature', sigData.signature);
    formData.append('folder', sigData.folder);
    
    // For videos, we need to include resource_type in the upload
    if (resourceType === 'video') {
      formData.append('resource_type', 'video');
    }
    
    if (sigData.eager) {
      formData.append('eager', sigData.eager);
    }
    if (sigData.eager_async === 'true') {
      formData.append('eager_async', 'true');
    }
    
    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error?.message || 'Upload failed'));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      xhr.open('POST', sigData.upload_url);
      xhr.send(formData);
    });
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(file, folder = 'posts/', onProgress = null) {
  return uploadToCloudinary(file, 'image', folder, onProgress);
}

/**
 * Upload a video to Cloudinary
 */
export async function uploadVideo(file, folder = 'posts/', onProgress = null) {
  return uploadToCloudinary(file, 'video', folder, onProgress);
}

/**
 * Delete media from Cloudinary
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  const response = await fetch(`${BACKEND_URL}/api/media/cloudinary/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_id: publicId, resource_type: resourceType })
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete media');
  }
  
  return response.json();
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(publicId, options = {}) {
  const {
    width = 800,
    height = null,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;
  
  const transforms = [`c_${crop}`, `w_${width}`, `q_${quality}`, `f_${format}`];
  if (height) transforms.push(`h_${height}`);
  
  // Get cloud name from the public_id or use a default
  // Cloudinary URLs already contain cloud name
  return `https://res.cloudinary.com/dzebupykv/image/upload/${transforms.join(',')}/${publicId}`;
}

/**
 * Get video thumbnail URL
 */
export function getVideoThumbnailUrl(publicId, width = 400) {
  return `https://res.cloudinary.com/dzebupykv/video/upload/c_fill,w_${width},h_${Math.round(width * 0.5625)},q_auto,f_jpg,so_0/${publicId}`;
}

/**
 * Get video streaming URL
 */
export function getVideoStreamUrl(publicId) {
  return `https://res.cloudinary.com/dzebupykv/video/upload/q_auto/${publicId}`;
}

/**
 * Validate file before upload
 */
export function validateFile(file, resourceType = 'image') {
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 100 * 1024 * 1024; // 100MB
  const maxVideoDuration = 90; // 1 minute 30 seconds
  
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  
  if (resourceType === 'image') {
    if (!allowedImageTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid image format. Allowed: JPG, PNG, GIF, WebP' };
    }
    if (file.size > maxImageSize) {
      return { valid: false, error: 'Image too large. Maximum size: 10MB' };
    }
  } else if (resourceType === 'video') {
    if (!allowedVideoTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid video format. Allowed: MP4, WebM, MOV, AVI' };
    }
    if (file.size > maxVideoSize) {
      return { valid: false, error: 'Video too large. Maximum size: 100MB' };
    }
  }
  
  return { valid: true, maxVideoDuration };
}

/**
 * Validate video duration (must be called after getting video metadata)
 * @param {number} duration - Video duration in seconds
 * @returns {object} Validation result
 */
export function validateVideoDuration(duration) {
  const maxDuration = 90; // 1 minute 30 seconds
  if (duration > maxDuration) {
    return { 
      valid: false, 
      error: `Video too long. Maximum duration: 1 minute 30 seconds (${maxDuration}s). Your video: ${Math.round(duration)}s` 
    };
  }
  return { valid: true };
}

/**
 * Get video duration from file
 * @param {File} file - Video file
 * @returns {Promise<number>} Duration in seconds
 */
export function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

export default {
  uploadToCloudinary,
  uploadImage,
  uploadVideo,
  deleteFromCloudinary,
  getOptimizedImageUrl,
  getVideoThumbnailUrl,
  getVideoStreamUrl,
  validateFile,
  validateVideoDuration,
  getVideoDuration
};
