import { v2 as cloudinary } from 'cloudinary';
import { getResourceTypeFromUrl } from './file-utils';

// Configure cloudinary from CLOUDINARY_URL environment variable
// Format: cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
if (process.env.CLOUDINARY_URL) {
  // Cloudinary auto-configures from CLOUDINARY_URL when using v2
  cloudinary.config({
    secure: true,
  });
}

/** Maximum file size in bytes (10MB) used for the server-side upload route */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed image MIME types (kept for backwards-compatibility) */
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
 * Delete a file from Cloudinary.
 * @param publicId - The public ID of the file to delete
 * @param url - The Cloudinary URL (used to infer the resource type)
 * @returns Whether the deletion was successful
 */
export async function deleteFromCloudinary(publicId: string, url?: string): Promise<boolean> {
  try {
    const resourceType = url ? getResourceTypeFromUrl(url) : 'image';
    if (!url) {
      console.warn('deleteFromCloudinary: no URL provided, defaulting resource_type to "image". Non-image files may not be deleted correctly.');
    }
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Extract the public ID from a Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns The public ID or null if not a valid Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Cloudinary URLs typically look like:
    // https://res.cloudinary.com/<cloud_name>/image/upload/<version>/<folder>/<public_id>.<ext>
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Everything after 'upload' and the version (if present) is the public ID
    let publicIdParts = pathParts.slice(uploadIndex + 1);
    
    // Remove version if present (starts with 'v' followed by numbers)
    if (publicIdParts.length > 0 && /^v\d+$/.test(publicIdParts[0])) {
      publicIdParts = publicIdParts.slice(1);
    }
    
    // Join remaining parts and remove file extension
    const publicIdWithExt = publicIdParts.join('/');
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
    
    return publicId || null;
  } catch {
    return null;
  }
}

/**
 * Generate signed upload parameters for direct client-side uploads to Cloudinary.
 * The browser can use these params to upload a file directly to Cloudinary,
 * completely bypassing serverless function body-size limits.
 * @param folder - Cloudinary folder to upload into
 * @returns Signed upload parameters (timestamp, signature, apiKey, cloudName, folder)
 */
export function generateUploadSignature(folder: string = 'upsitedown'): {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = { timestamp, folder };
  const config = cloudinary.config();
  const signature = cloudinary.utils.api_sign_request(
    params,
    config.api_secret as string
  );
  return {
    timestamp,
    signature,
    apiKey: config.api_key as string,
    cloudName: config.cloud_name as string,
    folder,
  };
}

export { cloudinary };
