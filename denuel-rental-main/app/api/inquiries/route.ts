import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { publicServerError } from '../../../lib/publicError';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [
          { clientId: user.id },
          { property: { ownerId: user.id } },
          {
            AND: [
              { clientId: null },
              {
                messages: {
                  some: {
                    OR: [
                      { senderId: user.id },
                      { receiverId: user.id },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
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
      .map((thread) => {
        let visibleMessages = thread.messages;

        if (!thread.clientId) {
          visibleMessages = thread.messages.filter(
            (message) =>
              message.senderId === user.id ||
              message.receiverId === user.id
          );
        }

        if (visibleMessages.length === 0) return null;

        const lastMessage = visibleMessages[0];

        const fallbackCandidates = visibleMessages.flatMap(
          (message) => [message.sender, message.receiver]
        );

        const counterpart =
          user.id === thread.property.ownerId
            ? thread.client ||
              fallbackCandidates.find(
                (participant) =>
                  participant.id !== user.id
              )
            : thread.property.owner;

        const unreadCount = visibleMessages.filter(
          (message) =>
            message.receiverId === user.id &&
            !message.isRead
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
      .filter(Boolean)
      .sort(
        (a: any, b: any) =>
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
