import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST - Invite member to board
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { boardId, email, canEdit } = body;

    if (!boardId || !email) {
      return NextResponse.json(
        { error: 'Board ID and email are required' },
        { status: 400 }
      );
    }

    // Verify board ownership
    const board = await prisma.propertyBoard.findUnique({
      where: { id: boardId },
    });

    if (!board || board.ownerId !== user.id) {
      return NextResponse.json({ error: 'Board not found or unauthorized' }, { status: 404 });
    }

    // Find user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (invitedUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    // Add member
    const member = await prisma.propertyBoardMember.upsert({
      where: {
        boardId_userId: {
          boardId,
          userId: invitedUser.id,
        },
      },
      update: { canEdit: canEdit || false },
      create: {
        boardId,
        userId: invitedUser.id,
        canEdit: canEdit || false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify invited user
    await prisma.notification.create({
      data: {
        userId: invitedUser.id,
        type: 'BOARD_INVITE',
        data: {
          boardId,
          boardName: board.name,
          inviterName: user.name,
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Invite board member error:', error);
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 });
  }
}

// DELETE - Remove member from board
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');
    const memberId = searchParams.get('memberId');

    if (!boardId || !memberId) {
      return NextResponse.json(
        { error: 'Board ID and member ID are required' },
        { status: 400 }
      );
    }

    const board = await prisma.propertyBoard.findUnique({
      where: { id: boardId },
    });

    if (!board || board.ownerId !== user.id) {
      return NextResponse.json({ error: 'Board not found or unauthorized' }, { status: 404 });
    }

    await prisma.propertyBoardMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove board member error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
