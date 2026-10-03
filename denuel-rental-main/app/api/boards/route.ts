import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { randomBytes } from 'crypto';

// GET - Get user's property boards
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const boards = await prisma.propertyBoard.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        items: {
          include: {
            property: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
          orderBy: { rank: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error('Fetch property boards error:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

// POST - Create a new board
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isPublic } = body;

    if (!name) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    const board = await prisma.propertyBoard.create({
      data: {
        ownerId: user.id,
        name,
        description,
        isPublic: isPublic || false,
        shareCode: randomBytes(6).toString('hex'),
      },
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error('Create property board error:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}

// PUT - Update board
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { boardId, name, description, isPublic } = body;

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });
    }

    const board = await prisma.propertyBoard.findUnique({
      where: { id: boardId },
    });

    if (!board || board.ownerId !== user.id) {
      return NextResponse.json({ error: 'Board not found or unauthorized' }, { status: 404 });
    }

    const updated = await prisma.propertyBoard.update({
      where: { id: boardId },
      data: { name, description, isPublic },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update property board error:', error);
    return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
  }
}

// DELETE - Delete board
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });
    }

    const board = await prisma.propertyBoard.findUnique({
      where: { id: boardId },
    });

    if (!board || board.ownerId !== user.id) {
      return NextResponse.json({ error: 'Board not found or unauthorized' }, { status: 404 });
    }

    // Delete items and members first
    await prisma.propertyBoardItem.deleteMany({ where: { boardId } });
    await prisma.propertyBoardMember.deleteMany({ where: { boardId } });
    await prisma.propertyBoard.delete({ where: { id: boardId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete property board error:', error);
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}
