import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Get driver profile
    const driver = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Get filter from query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

    // Build where clause
    const whereClause: any = { assignedDriverId: driver.id };
    
    if (status === 'completed') {
      whereClause.status = 'COMPLETED';
    } else if (status === 'cancelled') {
      whereClause.status = 'CANCELED';
    }

    // Fetch trips
    const trips = await prisma.transportRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // Format response
    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      status: trip.status,
      pickupLocation: trip.pickupAddressText,
      dropoffLocation: trip.dropoffAddressText,
      fare: trip.lockedPriceZmw || trip.priceEstimateZmw || 0,
      distance: trip.distanceKmEstimated || 0,
      duration: trip.durationMinEstimated || 0,
      createdAt: trip.createdAt.toISOString(),
      completedAt: undefined,
      tenant: {
        name: trip.tenant?.name || 'Customer',
        phone: trip.tenant?.phone,
      },
      rating: undefined, // Rating fetched separately if needed
    }));

    return NextResponse.json({ trips: formattedTrips });
  } catch (error) {
    console.error('Failed to fetch trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}
