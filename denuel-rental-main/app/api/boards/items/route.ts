import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST - Add property to board
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { boardId, propertyId, note } = body;

    if (!boardId || !propertyId) {
      return NextResponse.json(
        { error: 'Board ID and property ID are required' },
        { status: 400 }
      );
    }

    // Check board access
    const board = await prisma.propertyBoard.findUnique({
      where: { id: boardId },
      include: {
        members: { where: { userId: user.id } },
      },
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const hasAccess = board.ownerId === user.id || board.members.some((m) => m.canEdit);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current max rank
    const maxRank = await prisma.propertyBoardItem.findFirst({
      where: { boardId },
      orderBy: { rank: 'desc' },
      select: { rank: true },
    });

    const item = await prisma.propertyBoardItem.create({
      data: {
        boardId,
        propertyId,
        addedById: user.id,
        note,
        rank: (maxRank?.rank || 0) + 1,
      },
      include: {
        property: {
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Add to board error:', error);
    return NextResponse.json({ error: 'Failed to add to board' }, { status: 500 });
  }
}

// PUT - Update item (note, rank)
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, note, rank } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const item = await prisma.propertyBoardItem.findUnique({
      where: { id: itemId },
      include: {
        board: {
          include: {
            members: { where: { userId: user.id } },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const hasAccess = item.board.ownerId === user.id || item.board.members.some((m) => m.canEdit);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.propertyBoardItem.update({
      where: { id: itemId },
      data: { note, rank },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update board item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE - Remove property from board
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const boardId = searchParams.get('boardId');
    const propertyId = searchParams.get('propertyId');

    if (!itemId && (!boardId || !propertyId)) {
      return NextResponse.json(
        { error: 'Item ID or board/property IDs are required' },
        { status: 400 }
      );
    }

    if (itemId) {
      await prisma.propertyBoardItem.delete({
        where: { id: itemId },
      });
    } else if (boardId && propertyId) {
      await prisma.propertyBoardItem.deleteMany({
        where: { boardId, propertyId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove from board error:', error);
    return NextResponse.json({ error: 'Failed to remove from board' }, { status: 500 });
  }
}
