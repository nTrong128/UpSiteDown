/**
 * Returns the Cloudinary resource type ('image' | 'video' | 'raw') inferred
 * from a Cloudinary URL path segment.
 * Defaults to 'image' for URLs that don't contain a recognised resource-type
 * segment (e.g. '/video/upload/' or '/raw/upload/'), which is the correct
 * fallback for the vast majority of files already stored in the database.
 */
export function getResourceTypeFromUrl(url: string): 'image' | 'video' | 'raw' {
  if (url.includes('/video/upload/')) return 'video';
  if (url.includes('/raw/upload/')) return 'raw';
  return 'image';
}

/**
 * Returns true when the URL or filename extension is a common image type.
 */
export function isImageFile(nameOrUrl: string): boolean {
  const lower = nameOrUrl.toLowerCase().split('?')[0]; // strip query params
  return /\.(jpe?g|png|gif|webp|avif|svg|bmp|tiff?)$/.test(lower);
}

/**
 * Returns true when the MIME type belongs to a video file.
 */
export function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Maps a MIME type or filename to a human-readable category label.
 */
export function getFileCategory(mimeOrName: string): string {
  const m = mimeOrName.toLowerCase();
  if (m.startsWith('image/') || isImageFile(m)) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m === 'application/pdf' || m.endsWith('.pdf')) return 'pdf';
  if (
    [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
    ].includes(m) ||
    /\.(zip|rar|7z|tar|gz|bz2)$/.test(m)
  )
    return 'archive';
  if (
    [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ].includes(m) ||
    /\.(docx?|xlsx?|pptx?)$/.test(m)
  )
    return 'document';
  if (m.startsWith('text/') || /\.(txt|md|csv|json|xml|yaml|yml|html?|css|js|ts)$/.test(m))
    return 'text';
  return 'file';
}
