import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side download proxy for Cloudinary files.
 *
 * Fetching Cloudinary `raw` resources (documents, archives, etc.) directly
 * from the browser is blocked by CORS, producing a 0-byte downloaded file.
 * This route fetches the file on the server (no CORS restriction) and streams
 * it back to the client with a `Content-Disposition: attachment` header so the
 * browser always saves it as a file instead of opening it.
 *
 * Query params:
 *   url      – the Cloudinary file URL to proxy
 *   filename – the filename to suggest for the download
 */
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

  // Fetch from Cloudinary on the server side — no CORS limitations here
  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: upstream.status >= 400 ? upstream.status : 502 }
    );
  }

  const contentType =
    upstream.headers.get('content-type') ?? 'application/octet-stream';
  const contentLength = upstream.headers.get('content-length');

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    // RFC 5987 encoding for non-ASCII filenames
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'Cache-Control': 'no-store',
  };

  if (contentLength) {
    headers['Content-Length'] = contentLength;
  }

  return new NextResponse(upstream.body, { headers });
}
