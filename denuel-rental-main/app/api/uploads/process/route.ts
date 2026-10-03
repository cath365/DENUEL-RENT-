import { NextResponse } from 'next/server';
import { processImageKey } from '../../../../lib/imageProcessor';
import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

// If Redis/worker available, enqueue processing job; otherwise fallback to inline processing
export async function POST(req: Request) {
  try {
    await requireAuth(req);
    const body = await req.json();
    const { key, propertyId } = body;
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    if (process.env.REDIS_URL) {
      // enqueue job
      const { enqueue } = await import('../../../../scripts/worker/worker');
      await enqueue('image.process', { key, propertyId });
      return NextResponse.json({ ok: true, enqueued: true });
    }

    // fallback: inline processing
    const variants = await processImageKey(key);

    if (propertyId) {
      // insert variants as PropertyImage records (append sortOrder)
      let lastOrder = await prisma.propertyImage.findFirst({ where: { propertyId }, orderBy: { sortOrder: 'desc' } });
      let base = lastOrder ? lastOrder.sortOrder + 1 : 0;
      for (const v of variants) {
        await prisma.propertyImage.create({ data: { propertyId, url: v.publicUrl, sortOrder: base++ } });
      }
    }

    return NextResponse.json({ ok: true, variants });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Failed to process' }, { status: 500 });
  }
}