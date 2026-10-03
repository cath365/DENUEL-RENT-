import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const u = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true, phone: true, notifyEmail: true, notifyWhatsApp: true } });
    return NextResponse.json({ user: u });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { notifyEmail, notifyWhatsApp, phone } = body;
    const updated = await prisma.user.update({ where: { id: user.id }, data: { notifyEmail, notifyWhatsApp, phone } });
    // @ts-ignore
    delete updated.password;
    return NextResponse.json({ user: updated });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}