import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirect-based download helper for Cloudinary files.
 *
 * The primary download path uses the `fl_attachment` flag directly in the
 * Cloudinary URL (built client-side in lib/download.ts), so no server proxy
 * is required and no authentication / CORS issues arise.
 *
 * This route is kept as a convenience endpoint: it validates that the target
 * URL is a Cloudinary URL, injects the `fl_attachment` flag, and issues a
 * 302 redirect so the browser fetches the file directly from Cloudinary with
 * `Content-Disposition: attachment`.
 *
 * Query params:
 *   url      – the Cloudinary file URL
 *   filename – the filename to suggest for the download
 */

/**
 * Sanitise a filename so it is safe to embed in a Cloudinary transformation
 * parameter (`fl_attachment:FILENAME` lives inside a URL path segment).
 */
function sanitizeFilenameForCloudinary(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/, '');
}

function buildAttachmentUrl(cloudinaryUrl: string, filename: string): string {
  if (cloudinaryUrl.includes('fl_attachment')) {
    return cloudinaryUrl;
  }
  const safeFilename = sanitizeFilenameForCloudinary(filename);
  const flag = safeFilename ? `fl_attachment:${safeFilename}` : 'fl_attachment';
  return cloudinaryUrl.replace(/(\/(?:image|video|raw)\/upload\/)/, `$1${flag}/`);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const url = searchParams.get('url');
  const filename = searchParams.get('filename') ?? 'download';

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Security: only allow Cloudinary URLs
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const hostname = urlObj.hostname.toLowerCase();
  const isCloudinary =
    hostname === 'cloudinary.com' || hostname.endsWith('.cloudinary.com');

  if (!isCloudinary) {
    return NextResponse.json(
      { error: 'Only Cloudinary URLs are supported' },
      { status: 403 }
    );
  }

  // Redirect the browser to the Cloudinary URL with fl_attachment so Cloudinary
  // sets Content-Disposition: attachment — no server-side content proxying.
  const attachmentUrl = buildAttachmentUrl(url, filename);
  return NextResponse.redirect(attachmentUrl, { status: 302 });
}
