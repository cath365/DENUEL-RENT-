import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const props = await prisma.property.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: 'desc' } });
    const items = props.map((p) => ({ id: p.id, title: p.title, viewCount: p.viewCount, saveCount: p.saveCount }));
    return NextResponse.json({ items });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}