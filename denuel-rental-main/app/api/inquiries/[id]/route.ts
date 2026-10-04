import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../../lib/auth';
import { publicServerError } from '../../../../lib/publicError';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ReplySchema = z.object({
  message: z.string().trim().min(1).max(1200),
});

async function loadThreadForUser(
  threadId: string,
  userId: string,
  role: string
) {
  let thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
          profileImage: true,
        },
      },
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

  const isAdmin = role === 'ADMIN';

  if (!thread.clientId) {
    const possibleClients = Array.from(
      new Set(
        thread.messages
          .flatMap((message) => [
            message.senderId,
            message.receiverId,
          ])
          .filter(
            (participantId) =>
              participantId !== thread!.property.ownerId
          )
      )
    );

    if (possibleClients.length === 1) {
      const clientId = possibleClients[0];

      try {
        await prisma.messageThread.update({
          where: { id: thread.id },
          data: { clientId },
        });

        thread = await prisma.messageThread.findUnique({
          where: { id: threadId },
          include: {
            client: {
              select: {
                id: true,
                name: true,
                companyName: true,
                profileImage: true,
              },
            },
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
      } catch {
        return {
          ambiguous: true as const,
          thread: null,
        };
      }
    } else if (possibleClients.length > 1) {
      return {
        ambiguous: true as const,
        thread: null,
      };
    }
  }

  if (!thread) return null;

  const authorized =
    isAdmin ||
    userId === thread.property.ownerId ||
    userId === thread.clientId;

  if (!authorized) {
    return null;
  }

  return {
    ambiguous: false as const,
    thread,
  };
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    const loaded = await loadThreadForUser(
      params.id,
      user.id,
      user.role
    );

    if (!loaded) {
      return NextResponse.json(
        { error: 'Conversation not found.' },
        { status: 404 }
      );
    }

    if (loaded.ambiguous) {
      return NextResponse.json(
        {
          error:
            'This older conversation contains more than one client and cannot be opened safely. An administrator must separate the records.',
        },
        { status: 409 }
      );
    }

    const thread = loaded.thread;

    await prisma.message.updateMany({
      where: {
        threadId: thread.id,
        receiverId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    const counterpart =
      user.id === thread.property.ownerId
        ? thread.client
        : thread.property.owner;

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
            message.receiverId === user.id
              ? true
              : message.isRead,
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

    const { checkRate } = await import(
      '../../../../lib/rateLimiter'
    );

    if (!(await checkRate(ip))) {
      return NextResponse.json(
        { error: 'Too many requests.' },
        { status: 429 }
      );
    }

    const user = await requireAuth(req);
    requireCsrf(req);

    const loaded = await loadThreadForUser(
      params.id,
      user.id,
      user.role
    );

    if (!loaded) {
      return NextResponse.json(
        { error: 'Conversation not found.' },
        { status: 404 }
      );
    }

    if (loaded.ambiguous) {
      return NextResponse.json(
        {
          error:
            'This older conversation cannot accept replies until its client records are separated.',
        },
        { status: 409 }
      );
    }

    const thread = loaded.thread;
    const parsed = ReplySchema.parse(await req.json());

    let receiverId: string | null = null;

    if (user.id === thread.property.ownerId) {
      receiverId = thread.clientId;
    } else if (user.id === thread.clientId) {
      receiverId = thread.property.ownerId;
    } else if (user.role === 'ADMIN') {
      receiverId =
        thread.clientId || thread.property.ownerId;
    }

    if (!receiverId || receiverId === user.id) {
      return NextResponse.json(
        {
          error:
            'The other participant could not be determined safely.',
        },
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
      const { createNotification } = await import(
        '../../../../lib/notifications'
      );

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
        {
          error:
            error.errors[0]?.message || 'Invalid message.',
        },
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
