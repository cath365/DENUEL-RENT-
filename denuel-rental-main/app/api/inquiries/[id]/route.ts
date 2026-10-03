import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const thread = await prisma.messageThread.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } }, property: true } });
    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // ensure ownership or participant
    const owns = thread.property.ownerId === user.id || user.role === 'ADMIN';
    if (!owns && !thread.messages.some((m) => m.senderId === user.id || m.receiverId === user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json({ thread });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    // CSRF double-submit check
    const { requireCsrf } = await import('../../../../lib/auth');
    requireCsrf(req);
    const { id } = params;
    const thread = await prisma.messageThread.findUnique({ where: { id }, include: { property: true } });
    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // only property owner or any participant can reply
    const body = await req.json();
    const { message } = body;
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    // determine receiver: if user is owner, receiver is the last sender in thread; else receiver is owner
    let receiverId: string | null = null;
    if (thread.property.ownerId === user.id) {
      // find last message where sender != owner
      const lastNonOwner = await prisma.message.findFirst({ where: { threadId: id, senderId: { not: user.id } }, orderBy: { createdAt: 'desc' } });
      if (lastNonOwner) receiverId = lastNonOwner.senderId; else return NextResponse.json({ error: 'No tenant to reply to' }, { status: 400 });
    } else {
      receiverId = thread.property.ownerId;
    }

    const msg = await prisma.message.create({ data: { threadId: id, senderId: user.id, receiverId, body: message } });
    return NextResponse.json({ message: msg });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    // CSRF double-submit check
    const { requireCsrf } = await import('../../../../lib/auth');
    requireCsrf(req);
    const { id } = params;
    const body = await req.json();
    const { action } = body;
    if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

    if (action === 'mark-read') {
      // mark all messages for this thread where receiver is user as read
      await prisma.message.updateMany({ where: { threadId: id, receiverId: user.id }, data: { isRead: true } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}