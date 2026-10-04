import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../lib/auth';
import { publicServerError } from '../../../lib/publicError';
import { z } from 'zod';

const SendSchema = z.object({
  receiverId: z.string().optional(),
  propertyId: z.string().min(1),
  message: z.string().trim().min(1).max(1200),
});

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [
          { messages: { some: { senderId: user.id } } },
          { messages: { some: { receiverId: user.id } } },
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            area: true,
            ownerId: true,
          },
        },
        messages: {
          where: {
            OR: [
              { senderId: user.id },
              { receiverId: user.id },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ threads });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Message thread list failed', error);
    const safe = publicServerError(error, 'Unable to load your enquiries.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anon';
    const { checkRate } = await import('../../../lib/rateLimiter');

    if (!(await checkRate(ip))) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const user = await requireAuth(req);
    requireCsrf(req);

    const parsed = SendSchema.parse(await req.json());

    const property = await prisma.property.findUnique({
      where: { id: parsed.propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        status: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    const senderIsOwner = property.ownerId === user.id;

    if (!senderIsOwner && property.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'This property is not available for new enquiries.' },
        { status: 404 }
      );
    }

    let receiverId: string;

    if (senderIsOwner) {
      if (!parsed.receiverId || parsed.receiverId === user.id) {
        return NextResponse.json(
          { error: 'Select the client you are replying to.' },
          { status: 400 }
        );
      }
      receiverId = parsed.receiverId;
    } else {
      if (parsed.receiverId && parsed.receiverId !== property.ownerId) {
        return NextResponse.json({ error: 'Invalid receiver.' }, { status: 400 });
      }
      receiverId = property.ownerId;
    }

    const clientUserId = senderIsOwner ? receiverId : user.id;

    let thread = await prisma.messageThread.findFirst({
      where: {
        propertyId: property.id,
        messages: {
          some: {
            OR: [
              { senderId: clientUserId },
              { receiverId: clientUserId },
            ],
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!thread) {
      thread = await prisma.messageThread.create({
        data: { propertyId: property.id },
      });
    }

    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: user.id,
        receiverId,
        body: parsed.message,
      },
    });

    try {
      const { createNotification } = await import('../../../lib/notifications');
      await createNotification(receiverId, 'inquiry', {
        message: parsed.message,
        threadId: thread.id,
        propertyId: property.id,
      });
    } catch {
      // Message delivery must not fail if a notification cannot be created.
    }

    return NextResponse.json({
      message,
      threadId: thread.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid message.' },
        { status: 422 }
      );
    }
    if (error instanceof Response) return error;

    console.error('Property enquiry failed', error);
    const safe = publicServerError(error, 'Unable to send your enquiry right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
