import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, saveImage } from '@/lib/db';

interface UploadedFileInfo {
  originalName: string;
  size: number;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initDatabase();

    const body = await request.json();
    const files: UploadedFileInfo[] = body.files;

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

    for (const file of files) {
      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const uniqueFilename = `${timestamp}-${randomStr}-${file.originalName}`;

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
