import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../../lib/auth';
import { publicServerError } from '../../../../lib/publicError';
import { z } from 'zod';

const ReplySchema = z.object({
  message: z.string().trim().min(1).max(1200),
});

async function loadThreadForUser(threadId: string, userId: string, role: string) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          price: true,
          listingType: true,
          status: true,
          city: true,
          area: true,
          addressText: true,
          ownerId: true,
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
            select: { url: true },
          },
          owner: {
            select: {
              id: true,
              name: true,
              companyName: true,
              profileImage: true,
              phone: true,
              isPhoneVerified: true,
              isIdVerified: true,
              isBusinessVerified: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              companyName: true,
              profileImage: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              companyName: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  if (!thread) return null;

  const isParticipant = thread.messages.some(
    (message) =>
      message.senderId === userId || message.receiverId === userId
  );

  const isAdmin = role === 'ADMIN';

  if (!isParticipant && !isAdmin) {
    return null;
  }

  return thread;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const thread = await loadThreadForUser(params.id, user.id, user.role);

    if (!thread) {
      return NextResponse.json(
        { error: 'Conversation not found.' },
        { status: 404 }
      );
    }

    await prisma.message.updateMany({
      where: {
        threadId: thread.id,
        receiverId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    const counterpartCandidates = thread.messages.flatMap((message) => [
      message.sender,
      message.receiver,
    ]);

    const counterpart =
      counterpartCandidates.find(
        (participant) => participant.id !== user.id
      ) || thread.property.owner;

    return NextResponse.json({
      thread: {
        id: thread.id,
        property: thread.property,
        counterpart,
        messages: thread.messages.map((message) => ({
          id: message.id,
          body: message.body,
          createdAt: message.createdAt,
          senderId: message.senderId,
          receiverId: message.receiverId,
          isRead:
            message.receiverId === user.id ? true : message.isRead,
          sender: message.sender,
        })),
        createdAt: thread.createdAt,
      },
      viewer: {
        id: user.id,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Conversation lookup failed', error);
    const safe = publicServerError(
      error,
      'Unable to load this conversation.'
    );

    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'anon';

    const { checkRate } = await import('../../../../lib/rateLimiter');

    if (!(await checkRate(ip))) {
      return NextResponse.json(
        { error: 'Too many requests.' },
        { status: 429 }
      );
    }

    const user = await requireAuth(req);
    requireCsrf(req);

    const thread = await loadThreadForUser(params.id, user.id, user.role);

    if (!thread) {
      return NextResponse.json(
        { error: 'Conversation not found.' },
        { status: 404 }
      );
    }

    const parsed = ReplySchema.parse(await req.json());

    const otherParticipantIds = Array.from(
      new Set(
        thread.messages.flatMap((message) => [
          message.senderId,
          message.receiverId,
        ])
      )
    ).filter((id) => id !== user.id);

    let receiverId: string | undefined;

    if (user.id === thread.property.ownerId) {
      receiverId = otherParticipantIds.find(
        (id) => id !== thread.property.ownerId
      );
    } else {
      receiverId = thread.property.ownerId;
    }

    if (!receiverId) {
      return NextResponse.json(
        { error: 'The other participant could not be determined.' },
        { status: 409 }
      );
    }

    const message = await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: user.id,
        receiverId,
        body: parsed.message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            companyName: true,
            profileImage: true,
          },
        },
      },
    });

    try {
      const { createNotification } = await import('../../../../lib/notifications');

      await createNotification(receiverId, 'inquiry', {
        message: parsed.message,
        threadId: thread.id,
        propertyId: thread.property.id,
      });
    } catch {
      // The conversation remains valid if notification delivery fails.
    }

    return NextResponse.json(
      {
        message: {
          id: message.id,
          body: message.body,
          createdAt: message.createdAt,
          senderId: message.senderId,
          receiverId: message.receiverId,
          isRead: message.isRead,
          sender: message.sender,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Invalid message.' },
        { status: 422 }
      );
    }

    if (error instanceof Response) return error;

    console.error('Conversation reply failed', error);
    const safe = publicServerError(
      error,
      'Unable to send your message right now.'
    );

    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
