import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, deleteImage, deleteImages, deleteAllImages } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    await initDatabase();

    const body = await request.json();
    const { id, ids, all } = body;

    // Delete all images
    if (all === true) {
      const deletedCount = await deleteAllImages();
      return NextResponse.json({
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} image(s)`,
      });
    }

    // Delete multiple images by IDs
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const validIds = ids.filter((id): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0);
      if (validIds.length === 0) {
        return NextResponse.json(
          { error: 'No valid image IDs provided' },
          { status: 400 }
        );
      }
      const deletedCount = await deleteImages(validIds);
      return NextResponse.json({
        success: true,
        deletedCount,
        message: `Deleted ${deletedCount} image(s)`,
      });
    }

    // Delete single image by ID
    if (id !== undefined) {
      if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
        return NextResponse.json(
          { error: 'Invalid image ID' },
          { status: 400 }
        );
      }
      const deleted = await deleteImage(id);
      if (deleted) {
        return NextResponse.json({
          success: true,
          deletedCount: 1,
          message: 'Image deleted successfully',
        });
      } else {
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'No image ID(s) provided. Use "id" for single delete, "ids" for bulk delete, or "all: true" to delete all.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image(s)', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
