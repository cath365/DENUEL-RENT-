import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get conversations for a service provider
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    const conversations = await prisma.serviceConversation.findMany({
      where: { providerId: provider.id },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Get total unread count
    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadProvider, 0);

    return NextResponse.json({
      conversations,
      totalUnread,
    });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Start a new conversation (from customer)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { providerId, customerName, customerPhone, customerEmail, message } = body;

    if (!providerId || !customerName || !customerPhone || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get customer ID if logged in
    let customerId = 'anonymous-' + Date.now();
    try {
      const user = await requireAuth(req);
      if (user) {
        customerId = user.id;
      }
    } catch (e) {
      // Anonymous message
    }

    // Check if conversation exists
    let conversation = await prisma.serviceConversation.findUnique({
      where: {
        providerId_customerId: { providerId, customerId },
      },
    });

    if (!conversation) {
      conversation = await prisma.serviceConversation.create({
        data: {
          providerId,
          customerId,
          customerName,
          customerPhone,
          customerEmail,
          lastMessage: message.substring(0, 100),
          lastMessageAt: new Date(),
          unreadProvider: 1,
        },
      });
    } else {
      conversation = await prisma.serviceConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: message.substring(0, 100),
          lastMessageAt: new Date(),
          unreadProvider: { increment: 1 },
        },
      });
    }

    // Create the message
    const newMessage = await prisma.serviceMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: customerId,
        senderType: 'CUSTOMER',
        senderName: customerName,
        receiverId: providerId,
        content: message,
      },
    });

    return NextResponse.json({
      success: true,
      conversation,
      message: newMessage,
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
