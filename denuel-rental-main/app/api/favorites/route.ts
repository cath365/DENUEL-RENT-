import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { z } from 'zod';

const ToggleSchema = z.object({ propertyId: z.string() });

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { property: { include: { images: { orderBy: { sortOrder: 'asc' } } } } },
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    // CSRF double-submit check
    const { requireCsrf } = await import('../../../lib/auth');
    requireCsrf(req);
    const body = await req.json();
    const parsed = ToggleSchema.parse(body);

    // if exists, delete and decrement saveCount
    const existing = await prisma.favorite.findUnique({ where: { userId_propertyId: { userId: user.id, propertyId: parsed.propertyId } } });
    if (existing) {
      await prisma.$transaction([
        prisma.favorite.delete({ where: { id: existing.id } }),
        prisma.property.update({ where: { id: parsed.propertyId }, data: { saveCount: { decrement: 1 } } }),
      ]);
      return NextResponse.json({ removed: true });
    }

    const fav = await prisma.$transaction(async (tx) => {
      const f = await tx.favorite.create({ data: { userId: user.id, propertyId: parsed.propertyId } });
      await tx.property.update({ where: { id: parsed.propertyId }, data: { saveCount: { increment: 1 } } });
      return f;
    });

    return NextResponse.json({ favorite: fav });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 422 });
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
