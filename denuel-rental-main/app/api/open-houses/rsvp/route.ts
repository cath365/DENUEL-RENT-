import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST - RSVP to an open house
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { openHouseId, attendees, notes } = body;

    if (!openHouseId) {
      return NextResponse.json({ error: 'Open house ID is required' }, { status: 400 });
    }

    const openHouse = await prisma.openHouse.findUnique({
      where: { id: openHouseId },
      include: {
        property: true,
        rsvps: true,
      },
    });

    if (!openHouse) {
      return NextResponse.json({ error: 'Open house not found' }, { status: 404 });
    }

    // Check if event is in the past
    if (new Date(openHouse.startTime) < new Date()) {
      return NextResponse.json({ error: 'This open house has already passed' }, { status: 400 });
    }

    // Check capacity
    if (openHouse.maxAttendees) {
      const currentAttendees = openHouse.rsvps.reduce((sum, r) => sum + r.attendees, 0);
      if (currentAttendees + (attendees || 1) > openHouse.maxAttendees) {
        return NextResponse.json({ error: 'Open house is at full capacity' }, { status: 400 });
      }
    }

    const rsvp = await prisma.openHouseRSVP.upsert({
      where: {
        openHouseId_userId: {
          openHouseId,
          userId: user.id,
        },
      },
      update: {
        attendees: attendees || 1,
        notes,
        status: 'CONFIRMED',
      },
      create: {
        openHouseId,
        userId: user.id,
        attendees: attendees || 1,
        notes,
      },
    });

    // Notify property owner
    await prisma.notification.create({
      data: {
        userId: openHouse.property.ownerId,
        type: 'OPEN_HOUSE_RSVP',
        data: {
          openHouseId,
          propertyTitle: openHouse.property.title,
          visitorName: user.name,
          attendees: attendees || 1,
          scheduledTime: openHouse.startTime,
        },
      },
    });

    return NextResponse.json(rsvp, { status: 201 });
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 });
  }
}

// DELETE - Cancel RSVP
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const openHouseId = searchParams.get('openHouseId');

    if (!openHouseId) {
      return NextResponse.json({ error: 'Open house ID is required' }, { status: 400 });
    }

    await prisma.openHouseRSVP.deleteMany({
      where: {
        openHouseId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    return NextResponse.json({ error: 'Failed to cancel RSVP' }, { status: 500 });
  }
}

// GET - Get user's RSVPs
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rsvps = await prisma.openHouseRSVP.findMany({
      where: { userId: user.id },
      include: {
        openHouse: {
          include: {
            property: {
              include: {
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
      orderBy: { openHouse: { startTime: 'asc' } },
    });

    return NextResponse.json(rsvps);
  } catch (error) {
    console.error('Fetch RSVPs error:', error);
    return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 });
  }
}
