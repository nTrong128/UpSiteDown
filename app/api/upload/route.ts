import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, saveImage } from '@/lib/db';
import { randomUUID } from 'crypto';

interface UploadedFileInfo {
  originalName: string;
  size: number;
  url: string;
}

function isValidFileInfo(file: unknown): file is UploadedFileInfo {
  return (
    typeof file === 'object' &&
    file !== null &&
    typeof (file as UploadedFileInfo).originalName === 'string' &&
    typeof (file as UploadedFileInfo).size === 'number' &&
    typeof (file as UploadedFileInfo).url === 'string'
  );
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initDatabase();

    const body = await request.json();
    
    // Validate request body structure
    if (!body || typeof body !== 'object' || !Array.isArray(body.files)) {
      return NextResponse.json(
        { error: 'Invalid request body: expected { files: [...] }' },
        { status: 400 }
      );
    }

    const files = body.files;

    if (files.length === 0) {
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

    // Validate each file info
    for (const file of files) {
      if (!isValidFileInfo(file)) {
        return NextResponse.json(
          { error: 'Invalid file info: each file must have originalName, size, and url' },
          { status: 400 }
        );
      }
    }

    const uploadedFiles = [];

    for (const file of files as UploadedFileInfo[]) {
      // Generate unique filename using crypto.randomUUID for better uniqueness
      const uniqueFilename = `${randomUUID()}-${file.originalName}`;

      // Save metadata and URL to database
      const result = await saveImage(
        uniqueFilename,
        file.originalName,
        file.size,
        file.url
      );

      uploadedFiles.push({
        id: result.id,
        filename: result.filename,
        size: result.size,
      });
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
