/**
 * Downloads an image from the given URL with proper security validation.
 * For trusted URLs, fetches the blob and triggers a download.
 * For untrusted URLs, opens in a new tab as a fallback.
 */
export async function downloadImage(imageUrl: string, imageName: string): Promise<void> {
  try {
    // Validate URL is from same origin or a trusted source
    const urlObj = new URL(imageUrl, window.location.origin);
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
      window.open(imageUrl, '_blank');
      return;
    }

    const response = await fetch(imageUrl);
    
    // Verify content type is an image
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Invalid content type');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch {
    // Fallback: open in new tab
    window.open(imageUrl, '_blank');
  }
}
