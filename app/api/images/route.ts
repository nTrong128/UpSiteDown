import { NextResponse } from 'next/server';
import { getAllImages, initDatabase } from '@/lib/db';

export async function GET() {
  try {
    // Initialize database
    await initDatabase();

    const images = await getAllImages();

    return NextResponse.json({
      success: true,
      count: images.length,
      images,
    });
  } catch (error) {
    console.error('Fetch images error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
