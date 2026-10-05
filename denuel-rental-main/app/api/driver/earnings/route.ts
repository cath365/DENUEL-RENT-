import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

function summarize(rows: Array<{ grossZmw: number; platformFeeZmw: number; netZmw: number }>) {
  return rows.reduce(
    (totals, row) => ({
      gross: totals.gross + Number(row.grossZmw || 0),
      platformFees: totals.platformFees + Number(row.platformFeeZmw || 0),
      net: totals.net + Number(row.netZmw || 0),
      trips: totals.trips + 1,
    }),
    { gross: 0, platformFees: 0, net: 0, trips: 0 },
  );
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req, ['DRIVER']);

    const driver = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const rows = await prisma.driverEarning.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
      include: {
        transportRequest: {
          select: {
            pickupAddressText: true,
            dropoffAddressText: true,
            distanceKmEstimated: true,
            status: true,
            tenant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const todayRows = rows.filter((row) => row.createdAt >= todayStart);
    const weekRows = rows.filter((row) => row.createdAt >= weekStart);
    const monthRows = rows.filter((row) => row.createdAt >= monthStart);

    return NextResponse.json({
      summaries: {
        today: summarize(todayRows),
        week: summarize(weekRows),
        month: summarize(monthRows),
        all: summarize(rows),
      },
      earnings: rows.slice(0, 100).map((earning) => ({
        id: earning.id,
        tripId: earning.transportRequestId,
        grossZmw: earning.grossZmw,
        platformFeeZmw: earning.platformFeeZmw,
        netZmw: earning.netZmw,
        date: earning.createdAt.toISOString(),
        pickup: earning.transportRequest.pickupAddressText,
        dropoff: earning.transportRequest.dropoffAddressText,
        distanceKm: earning.transportRequest.distanceKmEstimated || 0,
        customerName: earning.transportRequest.tenant?.name || 'Customer',
      })),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Driver earnings error:', error);
    return NextResponse.json({ error: 'Unable to load driver earnings' }, { status: 500 });
  }
}
