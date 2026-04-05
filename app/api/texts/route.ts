import { NextRequest, NextResponse } from 'next/server';
import { initTextsDatabase, getAllTexts, saveText } from '@/lib/db';

export async function GET() {
  try {
    await initTextsDatabase();
    const texts = await getAllTexts();
    return NextResponse.json({ success: true, texts });
  } catch (error) {
    console.error('Fetch texts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch texts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await initTextsDatabase();

    const body = await request.json();
    const content: string = body?.content;

    if (typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const text = await saveText(content);
    return NextResponse.json({ success: true, text }, { status: 201 });
  } catch (error) {
    console.error('Save text error:', error);
    return NextResponse.json(
      { error: 'Failed to save text', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
