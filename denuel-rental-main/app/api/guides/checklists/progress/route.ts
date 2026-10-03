import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get user's checklist progress
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const checklistId = searchParams.get('checklistId');
    const propertyId = searchParams.get('propertyId');

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (checklistId) {
      where.checklistId = checklistId;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const userChecklists = await prisma.userChecklist.findMany({
      where,
      include: {
        checklist: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate progress for each
    const withProgress = userChecklists.map((uc) => {
      const items = uc.checklist.items as Array<{ id: string; text: string }>;
      const progress = uc.progress as Record<string, boolean>;
      const completed = Object.values(progress).filter(Boolean).length;
      return {
        ...uc,
        completedCount: completed,
        totalCount: items.length,
        progressPercent: items.length > 0 ? Math.round((completed / items.length) * 100) : 0,
      };
    });

    return NextResponse.json(withProgress);
  } catch (error) {
    console.error('Fetch user checklists error:', error);
    return NextResponse.json({ error: 'Failed to fetch checklists' }, { status: 500 });
  }
}

// POST - Start a checklist
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { checklistId, propertyId } = body;

    if (!checklistId) {
      return NextResponse.json({ error: 'Checklist ID is required' }, { status: 400 });
    }

    const checklist = await prisma.checklist.findUnique({
      where: { id: checklistId },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    // Initialize progress with all items unchecked
    const items = checklist.items as Array<{ id: string }>;
    const initialProgress = items.reduce((acc, item) => {
      acc[item.id] = false;
      return acc;
    }, {} as Record<string, boolean>);

    const userChecklist = await prisma.userChecklist.upsert({
      where: {
        userId_checklistId_propertyId: {
          userId: user.id,
          checklistId,
          propertyId: propertyId || 'default',
        },
      },
      update: {},
      create: {
        userId: user.id,
        checklistId,
        propertyId,
        progress: initialProgress,
      },
      include: {
        checklist: true,
      },
    });

    return NextResponse.json(userChecklist, { status: 201 });
  } catch (error) {
    console.error('Start checklist error:', error);
    return NextResponse.json({ error: 'Failed to start checklist' }, { status: 500 });
  }
}

// PUT - Update checklist progress
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userChecklistId, itemId, completed, progress } = body;

    if (!userChecklistId) {
      return NextResponse.json({ error: 'User checklist ID is required' }, { status: 400 });
    }

    const userChecklist = await prisma.userChecklist.findFirst({
      where: { id: userChecklistId, userId: user.id },
    });

    if (!userChecklist) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    let newProgress = userChecklist.progress as Record<string, boolean>;

    // Update single item
    if (itemId !== undefined) {
      newProgress[itemId] = completed;
    }

    // Or replace entire progress
    if (progress) {
      newProgress = progress;
    }

    const updated = await prisma.userChecklist.update({
      where: { id: userChecklistId },
      data: { progress: newProgress },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update checklist progress error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
