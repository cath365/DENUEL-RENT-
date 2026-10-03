import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUser } from '@/lib/auth';

// GET - Get user's recently viewed properties
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId: user.id },
      include: {
        property: {
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(recentlyViewed.map((rv) => ({
      ...rv.property,
      viewedAt: rv.viewedAt,
    })));
  } catch (error) {
    console.error('Fetch recently viewed error:', error);
    return NextResponse.json({ error: 'Failed to fetch recently viewed' }, { status: 500 });
  }
}

// POST - Track property view
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      // Silent fail for non-authenticated users
      return NextResponse.json({ success: true });
    }

    const body = await req.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Upsert to update viewedAt if already viewed
    await prisma.recentlyViewed.upsert({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: user.id,
        propertyId,
      },
    });

    // Keep only last 50 viewed properties
    const count = await prisma.recentlyViewed.count({
      where: { userId: user.id },
    });

    if (count > 50) {
      const oldest = await prisma.recentlyViewed.findMany({
        where: { userId: user.id },
        orderBy: { viewedAt: 'asc' },
        take: count - 50,
        select: { id: true },
      });

      await prisma.recentlyViewed.deleteMany({
        where: { id: { in: oldest.map((o) => o.id) } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track recently viewed error:', error);
    return NextResponse.json({ success: true }); // Silent fail
  }
}

// DELETE - Clear recently viewed
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.recentlyViewed.deleteMany({
      where: { userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear recently viewed error:', error);
    return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
  }
}
