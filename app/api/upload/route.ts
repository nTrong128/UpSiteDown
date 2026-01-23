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

    for (const file of files) {
      if (file instanceof File) {
        // Validate file is an image
        if (!file.type.startsWith('image/')) {
          continue; // Skip non-image files
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        // Save to database
        const result = await saveImage(
          file.name,
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
