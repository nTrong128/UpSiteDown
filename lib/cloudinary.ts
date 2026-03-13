import { v2 as cloudinary } from 'cloudinary';
import { ALLOWED_FILE_TYPES } from '@/lib/file-types';

export { ALLOWED_FILE_TYPES };

// Configure cloudinary from CLOUDINARY_URL environment variable
// Format: cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
if (process.env.CLOUDINARY_URL) {
  // Cloudinary auto-configures from CLOUDINARY_URL when using v2
  cloudinary.config({
    secure: true,
  });
}

/** Maximum file size in bytes (4MB)
 * This limit ensures files stay under serverless function body size limits
 * (e.g., Vercel has a 4.5MB limit for serverless functions)
 */
export const MAX_FILE_SIZE = 4 * 1024 * 1024;

/** Allowed image MIME types (kept for backwards compatibility) */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Upload an image to Cloudinary
 * @param fileBuffer - The file buffer to upload
 * @param options - Upload options
 * @returns The upload result with secure URL
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options?: { folder?: string; publicId?: string }
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder || 'upsitedown',
        public_id: options?.publicId,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - The Cloudinary resource type ('image', 'video', 'raw'). Defaults to 'image'.
 * @returns Whether the deletion was successful
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Extract the public ID and resource type from a Cloudinary URL.
 * Cloudinary URL format:
 *   https://res.cloudinary.com/<cloud>/image|video|raw/upload/[version]/<public_id>.<ext>
 * @returns Object with publicId and resourceType, or null if not a valid Cloudinary URL.
 */
export function extractFromCloudinaryUrl(url: string): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex < 2) return null;

    // The segment immediately before 'upload' is the resource type
    const rawResourceType = pathParts[uploadIndex - 1];
    const resourceType: 'image' | 'video' | 'raw' =
      rawResourceType === 'video' ? 'video' :
      rawResourceType === 'raw' ? 'raw' :
      'image';

    let publicIdParts = pathParts.slice(uploadIndex + 1);

    // Remove version if present (starts with 'v' followed by numbers)
    if (publicIdParts.length > 0 && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }

    // Join remaining parts and strip file extension
    const publicIdWithExt = publicIdParts.join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

    return publicId ? { publicId, resourceType } : null;
  } catch {
    return null;
  }
}

/**
 * Extract the public ID from a Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns The public ID or null if not a valid Cloudinary URL
 * @deprecated Use extractFromCloudinaryUrl which also returns the resource type.
 */
export function extractPublicIdFromUrl(url: string): string | null {
  return extractFromCloudinaryUrl(url)?.publicId ?? null;
}

export { cloudinary };
