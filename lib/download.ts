/**
 * Downloads a file from the given URL with proper security validation.
 *
 * Trusted Cloudinary URLs are proxied through /api/download so that the
 * server fetches the file (avoiding browser CORS restrictions on raw
 * resources that would otherwise produce a 0-byte download).
 * For untrusted URLs, the file is opened in a new tab as a fallback.
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

    if (!isSameOrigin && !isTrustedHost) {
      // Untrusted URL: open in a new tab instead of downloading
      window.open(fileUrl, '_blank');
      return;
    }

    // Route through the server-side proxy so the browser receives a proper
    // Content-Disposition: attachment response regardless of CORS settings on
    // the origin. This fixes 0-byte downloads for Cloudinary raw resources
    // (documents, archives, etc.).
    const proxyUrl =
      `/api/download?url=${encodeURIComponent(fileUrl)}` +
      `&filename=${encodeURIComponent(fileName)}`;

    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // Fallback: open in a new tab
    window.open(fileUrl, '_blank');
  }
}

/**
 * @deprecated Use downloadFile instead.
 */
export const downloadImage = downloadFile;
