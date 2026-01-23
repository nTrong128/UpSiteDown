import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, saveImage } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initDatabase();

    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (files.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 files allowed' },
        { status: 400 }
      );
    }

    const uploadedFiles = [];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total
    let totalSize = 0;

    for (const file of files) {
      if (file instanceof File) {
        // Validate file is an image (excluding SVG for security)
        if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
          continue; // Skip non-image files and SVG files
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File ${file.name} exceeds maximum size of 10MB` },
            { status: 400 }
          );
        }

        totalSize += file.size;
        if (totalSize > MAX_TOTAL_SIZE) {
          return NextResponse.json(
            { error: 'Total upload size exceeds maximum of 50MB' },
            { status: 400 }
          );
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const uniqueFilename = `${timestamp}-${randomStr}-${file.name}`;

        // Save to database
        const result = await saveImage(
          uniqueFilename,
          file.name,
          file.size,
          dataUrl
        );

        uploadedFiles.push({
          id: result.id,
          filename: result.filename,
          size: result.size,
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: uploadedFiles.length,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
