import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set([
  'REQUESTED',
  'SEARCHING',
  'DRIVER_ASSIGNED',
  'DRIVER_ARRIVING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
  'EXPIRED',
]);

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);

    const now = new Date();
    await prisma.transportRequest.updateMany({
      where: {
        status: 'REQUESTED',
        expiresAt: { lte: now },
      },
      data: { status: 'EXPIRED' },
    });

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || '').toUpperCase();

    const where: any = {};
    if (status && ALLOWED_STATUSES.has(status)) {
      where.status = status;
    }

    const [trips, grouped] = await Promise.all([
      prisma.transportRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          tenant: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          assignedDriver: {
            select: {
              id: true,
              vehicleType: true,
              vehiclePlate: true,
              user: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          property: {
            select: {
              id: true,
              title: true,
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
      }),
      prisma.transportRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const statusCounts = grouped.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

    return NextResponse.json({
      trips,
      stats: {
        total: grouped.reduce((sum, row) => sum + row._count._all, 0),
        requested: statusCounts.REQUESTED || 0,
        assigned:
          (statusCounts.DRIVER_ASSIGNED || 0) +
          (statusCounts.DRIVER_ARRIVING || 0),
        inProgress: statusCounts.IN_PROGRESS || 0,
        completed: statusCounts.COMPLETED || 0,
        canceled: statusCounts.CANCELED || 0,
        expired: statusCounts.EXPIRED || 0,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin transport trips error:', error);
    return NextResponse.json({ error: 'Unable to load transport trips' }, { status: 500 });
  }
}
