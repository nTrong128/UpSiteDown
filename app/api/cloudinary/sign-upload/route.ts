import { NextResponse } from 'next/server';
import { generateUploadSignature } from '@/lib/cloudinary';

export async function GET() {
  try {
    const params = generateUploadSignature();
    return NextResponse.json(params);
  } catch (error) {
    console.error('Error generating upload signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
