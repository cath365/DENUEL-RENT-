import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { z } from 'zod';

const SendSchema = z.object({ receiverId: z.string().optional(), propertyId: z.string(), message: z.string().min(1) });

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    // return threads that the user participates in
    const threads = await prisma.messageThread.findMany({ where: { OR: [{ messages: { some: { senderId: user.id } } }, { messages: { some: { receiverId: user.id } } }] }, include: { property: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ threads });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon';
    const { checkRate } = await import('../../../lib/rateLimiter');
    const ok = await checkRate(ip);
    if (!ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const user = await requireAuth(req);
    // CSRF double-submit check
    const { requireCsrf } = await import('../../../lib/auth');
    requireCsrf(req);
    const body = await req.json();
    const parsed = SendSchema.parse(body);

    // find or create a thread for this property
    let thread = await prisma.messageThread.findFirst({ where: { propertyId: parsed.propertyId } });
    if (!thread) {
      thread = await prisma.messageThread.create({ data: { propertyId: parsed.propertyId } });
    }

    // determine receiver: if sender is owner, receiver is tenant (if provided) else owner
    const property = await prisma.property.findUnique({ where: { id: parsed.propertyId } });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });

    // choose receiver: if parsed.receiverId provided use it, else pick property.ownerId (unless sender is owner, then receiver must be provided)
    let receiverId = parsed.receiverId || property.ownerId;
    if (receiverId === user.id) {
      return NextResponse.json({ error: 'Invalid receiver' }, { status: 400 });
    }

    const msg = await prisma.message.create({ data: { threadId: thread.id, senderId: user.id, receiverId, body: parsed.message } });

    // create a persistent notification for the receiver and emit event
    try {
      const { createNotification } = await import('../../../lib/notifications');
      await createNotification(receiverId, 'inquiry', { message: parsed.message, threadId: thread.id, propertyId: parsed.propertyId });
    } catch (e) {
      console.error('Notification creation failed', e);
    }

    return NextResponse.json({ message: msg, threadId: thread.id });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 422 });
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}