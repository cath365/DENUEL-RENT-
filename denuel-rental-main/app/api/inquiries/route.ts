import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { publicServerError } from '../../../lib/publicError';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const threads = await prisma.messageThread.findMany({
      where: {
        messages: {
          some: {
            OR: [
              { senderId: user.id },
              { receiverId: user.id },
            ],
          },
        },
      },
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
              },
            },
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

    const items = threads
      .filter((thread) => thread.messages.length > 0)
      .map((thread) => {
        const visibleMessages = thread.messages;
        const lastMessage = visibleMessages[0];

        const participantCandidates = visibleMessages.flatMap((message) => [
          message.sender,
          message.receiver,
        ]);

        const counterpart =
          participantCandidates.find(
            (participant) => participant.id !== user.id
          ) || thread.property.owner;

        const unreadCount = visibleMessages.filter(
          (message) => message.receiverId === user.id && !message.isRead
        ).length;

        return {
          id: thread.id,
          property: thread.property,
          counterpart,
          lastMessage: {
            id: lastMessage.id,
            body: lastMessage.body,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
            isRead: lastMessage.isRead,
          },
          messageCount: visibleMessages.length,
          unreadCount,
          createdAt: thread.createdAt,
          lastMessageAt: lastMessage.createdAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      );

    return NextResponse.json({
      items,
      viewer: {
        id: user.id,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Inquiries list failed', error);
    const safe = publicServerError(
      error,
      'Unable to load your property conversations.'
    );

    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
