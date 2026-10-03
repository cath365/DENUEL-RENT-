import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const existing = await prisma.savedSearch.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.savedSearch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}