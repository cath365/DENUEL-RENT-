import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get messages for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify conversation belongs to provider
    const conversation = await prisma.serviceConversation.findFirst({
      where: {
        id: params.id,
        providerId: provider.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Get messages
    const messages = await prisma.serviceMessage.findMany({
      where: { conversationId: params.id },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read
    await prisma.serviceMessage.updateMany({
      where: {
        conversationId: params.id,
        receiverId: provider.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Reset unread count for provider
    await prisma.serviceConversation.update({
      where: { id: params.id },
      data: { unreadProvider: 0 },
    });

    return NextResponse.json({
      conversation,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Send a message in a conversation
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    // Verify conversation belongs to provider
    const conversation = await prisma.serviceConversation.findFirst({
      where: {
        id: params.id,
        providerId: provider.id,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Create message
    const message = await prisma.serviceMessage.create({
      data: {
        conversationId: params.id,
        senderId: provider.id,
        senderType: 'PROVIDER',
        senderName: provider.businessName,
        receiverId: conversation.customerId,
        content,
      },
    });

    // Update conversation
    await prisma.serviceConversation.update({
      where: { id: params.id },
      data: {
        lastMessage: content.substring(0, 100),
        lastMessageAt: new Date(),
        unreadCustomer: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
