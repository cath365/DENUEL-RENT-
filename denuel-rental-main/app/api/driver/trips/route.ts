import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['DRIVER']);

    const driver = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'all').toLowerCase();

    const where: any = { assignedDriverId: driver.id };
    if (status === 'completed') where.status = 'COMPLETED';
    if (status === 'cancelled' || status === 'canceled') where.status = 'CANCELED';

    const trips = await prisma.transportRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: {
            name: true,
            phone: true,
          },
        },
        Rating: {
          select: {
            stars: true,
            comment: true,
          },
        },
        DriverEarning: {
          select: {
            grossZmw: true,
            platformFeeZmw: true,
            netZmw: true,
          },
        },
      },
      take: 200,
    });

    return NextResponse.json({
      trips: trips.map((trip) => ({
        id: trip.id,
        status: trip.status,
        pickupLocation: trip.pickupAddressText,
        dropoffLocation: trip.dropoffAddressText,
        fare: trip.lockedPriceZmw || trip.priceEstimateZmw || 0,
        distance: trip.distanceKmEstimated || 0,
        duration: trip.durationMinEstimated || 0,
        createdAt: trip.createdAt.toISOString(),
        tenant: {
          name: trip.tenant?.name || 'Customer',
          phone: trip.tenant?.phone || null,
        },
        rating: trip.Rating?.stars || null,
        ratingComment: trip.Rating?.comment || null,
        earning: trip.DriverEarning
          ? {
              grossZmw: trip.DriverEarning.grossZmw,
              platformFeeZmw: trip.DriverEarning.platformFeeZmw,
              netZmw: trip.DriverEarning.netZmw,
            }
          : null,
      })),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to fetch driver trips:', error);
    return NextResponse.json({ error: 'Unable to load driver trips' }, { status: 500 });
  }
}
