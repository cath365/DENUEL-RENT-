import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { z } from 'zod';

const CreateSchema = z.object({
  propertyId: z.string(),
  reason: z.string().min(3),
  details: z.string().max(2000).optional(),
});

export async function GET(req: Request) {
  try {
    await requireAuth(req, ['ADMIN']);
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;

    const items = await prisma.listingReport.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { property: true, reporter: { select: { id: true, name: true, email: true, phone: true } } },
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anon';
    const { checkRate } = await import('../../../lib/rateLimiter');
    const ok = await checkRate(`report:${ip}`);
    if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const user = await requireAuth(req);
    const { requireCsrf } = await import('../../../lib/auth');
    requireCsrf(req);

    const body = await req.json();
    const parsed = CreateSchema.parse(body);

    const prop = await prisma.property.findUnique({ where: { id: parsed.propertyId } });
    if (!prop) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    const report = await prisma.listingReport.create({
      data: { propertyId: parsed.propertyId, reporterId: user.id, reason: parsed.reason, details: parsed.details },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 422 });
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

