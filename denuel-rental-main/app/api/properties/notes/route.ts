import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get user's property notes
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const notes = await prisma.propertyNote.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, city: true, price: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Fetch property notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST - Create or update note
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, note } = body;

    if (!propertyId || !note) {
      return NextResponse.json(
        { error: 'Property ID and note are required' },
        { status: 400 }
      );
    }

    const savedNote = await prisma.propertyNote.upsert({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId,
        },
      },
      update: { note },
      create: {
        userId: user.id,
        propertyId,
        note,
      },
    });

    return NextResponse.json(savedNote);
  } catch (error) {
    console.error('Save property note error:', error);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
}

// DELETE - Delete note
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    await prisma.propertyNote.deleteMany({
      where: {
        userId: user.id,
        propertyId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete property note error:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
