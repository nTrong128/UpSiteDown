/**
 * File type categories, detection utilities, and dropzone configuration.
 */

export type FileCategory = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'archive' | 'other';

/** All MIME types allowed for upload */
export const ALLOWED_FILE_TYPES: string[] = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
  // Videos
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
  'video/x-matroska',
  // Audio
  'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/aac', 'audio/flac',
  'audio/x-m4a',
  // PDF
  'application/pdf',
  // Documents
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/rtf',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-bzip2',
];

/** react-dropzone accept config covering all allowed file types */
export const DROPZONE_ACCEPT: Record<string, string[]> = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'],
  'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v'],
  'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.m4a'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],
  'application/x-tar': ['.tar'],
  'application/gzip': ['.gz'],
  'application/x-bzip2': ['.bz2'],
};

/**
 * Extension → category map used for display/categorization purposes.
 * This is a broader superset than ALLOWED_FILE_TYPES; it correctly categorizes
 * files even if their MIME types are not in the upload allowlist.
 */
const EXT_TO_CATEGORY: Record<string, FileCategory> = {
  // Images
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
  svg: 'image', bmp: 'image', tiff: 'image', tif: 'image',
  // Videos
  mp4: 'video', webm: 'video', ogg: 'video', mov: 'video', avi: 'video',
  mkv: 'video', flv: 'video', wmv: 'video', m4v: 'video',
  // Audio
  mp3: 'audio', wav: 'audio', aac: 'audio', flac: 'audio', m4a: 'audio',
  oga: 'audio', opus: 'audio',
  // PDF
  pdf: 'pdf',
  // Documents
  doc: 'document', docx: 'document', ppt: 'document', pptx: 'document',
  xls: 'document', xlsx: 'document', txt: 'document', csv: 'document',
  rtf: 'document', odt: 'document', ods: 'document', odp: 'document',
  // Archives
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive',
  gz: 'archive', bz2: 'archive', xz: 'archive',
};

/** Detect file category from a MIME type string */
export function getFileCategoryFromMime(mimeType: string): FileCategory {
  if (!mimeType) return 'other';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType === 'application/msword' ||
    mimeType.includes('wordprocessingml') ||
    mimeType.includes('presentationml') ||
    mimeType.includes('spreadsheetml') ||
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'text/plain' ||
    mimeType === 'text/csv' ||
    mimeType === 'application/rtf'
  ) return 'document';
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-zip-compressed' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed' ||
    mimeType === 'application/x-tar' ||
    mimeType === 'application/gzip' ||
    mimeType === 'application/x-bzip2'
  ) return 'archive';
  return 'other';
}

/** Detect file category from a filename extension */
export function getFileCategoryFromName(filename: string): FileCategory {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_CATEGORY[ext] ?? 'other';
}

/**
 * Detect file category from a Cloudinary URL + filename.
 * Cloudinary embeds the resource type in the URL path:
 *   /image/upload/ → image, /video/upload/ → video, /raw/upload/ → other (use extension)
 */
export function getFileCategoryFromUrl(url: string, filename: string): FileCategory {
  if (url.includes('/video/upload/')) return 'video';
  if (url.includes('/image/upload/')) return 'image';
  return getFileCategoryFromName(filename);
}

/** Human-readable label for a file category */
export function getCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    pdf: 'PDF',
    document: 'Document',
    archive: 'Archive',
    other: 'Other',
  };
  return labels[category];
}
