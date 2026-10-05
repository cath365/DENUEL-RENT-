import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['USER', 'LANDLORD', 'AGENT', 'ADMIN', 'DRIVER', 'SERVICE_PROVIDER'];

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ALLOWED_ROLES);
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || '').toUpperCase();

    await prisma.transportRequest.updateMany({
      where: {
        tenantId: user.id,
        status: 'REQUESTED',
        expiresAt: { lte: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    const where: any = { tenantId: user.id };
    if (
      [
        'REQUESTED',
        'SEARCHING',
        'DRIVER_ASSIGNED',
        'DRIVER_ARRIVING',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELED',
        'EXPIRED',
      ].includes(status)
    ) {
      where.status = status;
    }

    const requests = await prisma.transportRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        assignedDriver: {
          select: {
            id: true,
            vehicleType: true,
            vehiclePlate: true,
            vehicleMake: true,
            vehicleModel: true,
            ratingAvg: true,
            ratingCount: true,
            user: {
              select: {
                name: true,
                phone: true,
                profileImage: true,
              },
            },
          },
        },
        Rating: {
          select: {
            id: true,
            stars: true,
            comment: true,
            createdAt: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Customer transport request list error:', error);
    return NextResponse.json({ error: 'Unable to load transport requests' }, { status: 500 });
  }
}
