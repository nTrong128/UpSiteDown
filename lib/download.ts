/**
 * Sanitise a user-provided filename so it is safe to embed in a Cloudinary
 * transformation parameter (the `fl_attachment:FILENAME` segment lives inside
 * a URL path, so characters like `/`, `?`, `#`, and `%` are not allowed).
 *
 * Only alphanumeric characters, dots, hyphens, and underscores are kept;
 * everything else is replaced with underscores.
 */
function sanitizeFilenameForCloudinary(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/, '');
}

/**
 * Insert the `fl_attachment` delivery flag into a Cloudinary URL.
 *
 * Cloudinary supports this flag for images, videos, audio, **and raw files**.
 * When the flag is present Cloudinary adds `Content-Disposition: attachment`
 * to its response, causing the browser to save the file instead of displaying
 * it — without any CORS or authentication issues on our end.
 *
 * Before: https://res.cloudinary.com/demo/raw/upload/v1/folder/file.pdf
 * After:  https://res.cloudinary.com/demo/raw/upload/fl_attachment:file.pdf/v1/folder/file.pdf
 */
function buildAttachmentUrl(cloudinaryUrl: string, filename: string): string {
  // If fl_attachment is already present in the URL, return as-is
  if (cloudinaryUrl.includes('fl_attachment')) {
    return cloudinaryUrl;
  }
  const safeFilename = sanitizeFilenameForCloudinary(filename);
  const flag = safeFilename ? `fl_attachment:${safeFilename}` : 'fl_attachment';
  // Insert the flag immediately after the /upload/ path segment
  return cloudinaryUrl.replace(/(\/(?:image|video|raw)\/upload\/)/, `$1${flag}/`);
}

/**
 * Downloads a file from the given URL.
 *
 * For Cloudinary URLs the `fl_attachment` delivery flag is added so that
 * Cloudinary itself sends `Content-Disposition: attachment`.  The browser
 * navigates directly to Cloudinary — no server-side proxy is involved, which
 * avoids both CORS restrictions and any deployment-level authentication that
 * would block a request routed through our API routes.
 *
 * For same-origin URLs the standard anchor `download` attribute is used.
 * For untrusted URLs the file is opened in a new tab as a fallback.
 */
export function downloadFile(fileUrl: string, fileName: string): void {
  try {
    const urlObj = new URL(fileUrl, window.location.origin);
    const isSameOrigin = urlObj.origin === window.location.origin;

    // Validate that the host is exactly cloudinary.com or a subdomain of it
    const trustedDomains = ['cloudinary.com'];
    const hostnameParts = urlObj.hostname.toLowerCase().split('.');
    const isTrustedHost = trustedDomains.some((domain) => {
      const domainParts = domain.split('.');
      if (hostnameParts.length < domainParts.length) return false;
      const hostSuffix = hostnameParts.slice(-domainParts.length).join('.');
      return hostSuffix === domain;
    });

    if (isSameOrigin) {
      // Same-origin: anchor download attribute is respected by all browsers
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (isTrustedHost) {
      // Cloudinary: add fl_attachment so Cloudinary sets Content-Disposition:
      // attachment in its response.  Navigating to a URL that responds with
      // that header triggers a browser download without leaving the current
      // page — no server proxy hop, no auth issues.
      window.location.href = buildAttachmentUrl(fileUrl, fileName);
    } else {
      // Untrusted URL: open in a new tab instead of downloading
      window.open(fileUrl, '_blank');
    }
  } catch {
    // Last-resort fallback
    window.open(fileUrl, '_blank');
  }
}

/**
 * @deprecated Use downloadFile instead.
 */
export const downloadImage = downloadFile;
