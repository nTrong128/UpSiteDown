import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, getImageById, deleteImage } from '@/lib/db';
import { getEdgeStoreBackendClient } from '@/lib/edgestore';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Initialize database
    await initDatabase();

    const { id } = await params;
    const imageId = parseInt(id, 10);

    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    // Get the image to retrieve the URL for EdgeStore deletion
    const image = await getImageById(imageId);

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete from EdgeStore first
    try {
      const backendClient = getEdgeStoreBackendClient();
      await backendClient.publicFiles.deleteFile({
        url: image.url,
      });
    } catch (edgeStoreError) {
      console.error('EdgeStore delete error:', edgeStoreError);
      // Continue with database deletion even if EdgeStore fails
      // (the file might have been manually deleted or expired)
    }

    // Delete from database
    const deleted = await deleteImage(imageId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete image from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
