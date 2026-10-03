import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUser } from '@/lib/auth';

// GET - Get open houses
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const city = searchParams.get('city');
    const upcoming = searchParams.get('upcoming') !== 'false';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (upcoming) {
      where.startTime = { gte: new Date() };
    }

    if (city) {
      where.property = { city };
    }

    const [openHouses, total] = await Promise.all([
      prisma.openHouse.findMany({
        where,
        include: {
          property: {
            include: {
              images: { take: 1, orderBy: { sortOrder: 'asc' } },
              owner: { select: { id: true, name: true } },
            },
          },
          rsvps: {
            select: { id: true },
          },
        },
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.openHouse.count({ where }),
    ]);

    // Add RSVP count
    const result = openHouses.map((oh) => ({
      ...oh,
      rsvpCount: oh.rsvps.length,
      rsvps: undefined,
    }));

    return NextResponse.json({
      openHouses: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch open houses error:', error);
    return NextResponse.json({ error: 'Failed to fetch open houses' }, { status: 500 });
  }
}

// POST - Create open house
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      propertyId,
      startTime,
      endTime,
      isVirtual,
      virtualLink,
      notes,
      maxAttendees,
    } = body;

    if (!propertyId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Property ID, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || (property.ownerId !== user.id && user.role !== 'ADMIN' && user.role !== 'AGENT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const openHouse = await prisma.openHouse.create({
      data: {
        propertyId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isVirtual: isVirtual || false,
        virtualLink,
        notes,
        maxAttendees,
      },
    });

    return NextResponse.json(openHouse, { status: 201 });
  } catch (error) {
    console.error('Create open house error:', error);
    return NextResponse.json({ error: 'Failed to create open house' }, { status: 500 });
  }
}

// PUT - Update open house
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { openHouseId, ...updates } = body;

    if (!openHouseId) {
      return NextResponse.json({ error: 'Open house ID is required' }, { status: 400 });
    }

    const openHouse = await prisma.openHouse.findUnique({
      where: { id: openHouseId },
      include: { property: true },
    });

    if (!openHouse || (openHouse.property.ownerId !== user.id && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (updates.startTime) updates.startTime = new Date(updates.startTime);
    if (updates.endTime) updates.endTime = new Date(updates.endTime);

    const updated = await prisma.openHouse.update({
      where: { id: openHouseId },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update open house error:', error);
    return NextResponse.json({ error: 'Failed to update open house' }, { status: 500 });
  }
}

// DELETE - Cancel open house
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const openHouseId = searchParams.get('id');

    if (!openHouseId) {
      return NextResponse.json({ error: 'Open house ID is required' }, { status: 400 });
    }

    const openHouse = await prisma.openHouse.findUnique({
      where: { id: openHouseId },
      include: { property: true, rsvps: { include: { user: true } } },
    });

    if (!openHouse || (openHouse.property.ownerId !== user.id && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Notify RSVPs of cancellation
    for (const rsvp of openHouse.rsvps) {
      await prisma.notification.create({
        data: {
          userId: rsvp.userId,
          type: 'OPEN_HOUSE_CANCELED',
          data: {
            propertyId: openHouse.propertyId,
            scheduledTime: openHouse.startTime,
          },
        },
      });
    }

    // Delete RSVPs and open house
    await prisma.openHouseRSVP.deleteMany({ where: { openHouseId } });
    await prisma.openHouse.delete({ where: { id: openHouseId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete open house error:', error);
    return NextResponse.json({ error: 'Failed to delete open house' }, { status: 500 });
  }
}
