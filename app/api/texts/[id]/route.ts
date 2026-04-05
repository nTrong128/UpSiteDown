import { NextRequest, NextResponse } from 'next/server';
import { initTextsDatabase, deleteText } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await initTextsDatabase();

    const { id } = await params;
    const textId = parseInt(id, 10);

    if (isNaN(textId)) {
      return NextResponse.json({ error: 'Invalid text ID' }, { status: 400 });
    }

    const deleted = await deleteText(textId);

    if (!deleted) {
      return NextResponse.json({ error: 'Text not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Text deleted successfully' });
  } catch (error) {
    console.error('Delete text error:', error);
    return NextResponse.json(
      { error: 'Failed to delete text', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
