import { NextResponse } from 'next/server';
import { runSavedSearches } from '../../../../lib/savedSearchRunner';

// For each saved search, run the saved query and notify the user when there are new matches
export async function POST() {
  try {
    if (process.env.REDIS_URL) {
      const { enqueue } = await import('../../../../scripts/worker/worker');
      await enqueue('savedsearch.run', {});
      return NextResponse.json({ ok: true, enqueued: true });
    }

    const ranAt = new Date();
    const stats = await runSavedSearches();
    return NextResponse.json({ ok: true, ranAt: ranAt.toISOString(), ...stats });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
