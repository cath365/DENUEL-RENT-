import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get bookings for a service provider or customer
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // 'provider' or 'customer'
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (role === 'provider') {
      // Get provider's bookings
      const provider = await prisma.serviceProvider.findFirst({
        where: { userId: user.id },
      });
      if (!provider) {
        return NextResponse.json({ error: 'Not a service provider' }, { status: 403 });
      }
      where.providerId = provider.id;
    } else {
      where.customerId = user.id;
    }

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.serviceBooking.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
              category: true,
              phone: true,
              logoUrl: true,
            },
          },
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceBooking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch service bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST - Book a service
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      providerId,
      propertyId,
      serviceType,
      scheduledAt,
      notes,
      estimatedPrice,
    } = body;

    if (!providerId || !serviceType || !scheduledAt) {
      return NextResponse.json(
        { error: 'Provider ID, service type, and scheduled date are required' },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider || !provider.isActive) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        providerId,
        customerId: user.id,
        propertyId,
        serviceType,
        scheduledAt: new Date(scheduledAt),
        notes,
        estimatedPrice,
      },
      include: {
        provider: {
          select: { businessName: true, phone: true },
        },
      },
    });

    // Create notification for provider
    if (provider.userId) {
      await prisma.notification.create({
        data: {
          userId: provider.userId,
          type: 'SERVICE_BOOKING',
          data: {
            bookingId: booking.id,
            customerName: user.name,
            serviceType,
            scheduledAt,
          },
        },
      });
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Create service booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

// PUT - Update booking status
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, status, finalPrice, notes } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }

    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId },
      include: {
        provider: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check authorization
    const isProvider = booking.provider.userId === user.id;
    const isCustomer = booking.customerId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isProvider && !isCustomer && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.serviceBooking.update({
      where: { id: bookingId },
      data: {
        status,
        finalPrice,
        notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update service booking error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
