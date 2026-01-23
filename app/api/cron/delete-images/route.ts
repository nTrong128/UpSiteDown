import { NextRequest, NextResponse } from 'next/server';
import { initDatabase, deleteAllImages } from '@/lib/db';

// This endpoint is designed to be called by a cron job scheduler
// It deletes all images from the database
// For Vercel Cron, configure in vercel.json with schedule: "*/5 * * * *" (every 5 minutes)
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a valid cron job source
    // Check for cron secret in authorization header if configured
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await initDatabase();
    
    const deletedCount = await deleteAllImages();
    
    console.log(`[Cron Job] Deleted ${deletedCount} image(s) at ${new Date().toISOString()}`);
    
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} image(s)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron Job] Delete all images error:', error);
    return NextResponse.json(
      { error: 'Failed to delete images', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
