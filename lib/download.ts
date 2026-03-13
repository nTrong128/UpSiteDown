/**
 * Downloads a file from the given URL with proper security validation.
 * For trusted URLs, fetches the blob and triggers a browser download.
 * For untrusted URLs, opens in a new tab as a fallback.
 */
export async function downloadFile(fileUrl: string, fileName: string): Promise<void> {
  try {
    // Validate URL is from same origin or a trusted source
    const urlObj = new URL(fileUrl, window.location.origin);
    const isSameOrigin = urlObj.origin === window.location.origin;
    
    // Properly validate trusted hosts - must be exact domain or subdomain
    const trustedDomains = ['cloudinary.com'];
    const hostnameParts = urlObj.hostname.toLowerCase().split('.');
    const isTrustedHost = trustedDomains.some(domain => {
      const domainParts = domain.split('.');
      // Check if hostname ends with the exact domain (e.g., 'res.cloudinary.com' or 'cloudinary.com')
      if (hostnameParts.length < domainParts.length) return false;
      const hostSuffix = hostnameParts.slice(-domainParts.length).join('.');
      return hostSuffix === domain;
    });
    
    if (!isSameOrigin && !isTrustedHost) {
      // For untrusted URLs, just open in new tab instead of downloading
      window.open(fileUrl, '_blank');
      return;
    }

    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    // Fallback: open in new tab
    window.open(fileUrl, '_blank');
  }
}

/**
 * @deprecated Use downloadFile instead.
 */
export const downloadImage = downloadFile;
