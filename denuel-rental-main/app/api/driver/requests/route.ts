import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['DRIVER']);

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: { isSuspended: true },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    if (profile.user.isSuspended || !profile.isApproved || profile.verificationStatus !== 'VERIFIED') {
      return NextResponse.json({ requests: [], available: false, reason: 'approval_required' });
    }

    if (!profile.isOnline) {
      return NextResponse.json({ requests: [], available: false, reason: 'offline' });
    }

    const now = new Date();
    const requests = await prisma.transportRequest.findMany({
      where: {
        status: 'REQUESTED',
        assignedDriverId: null,
        vehicleType: profile.vehicleType,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        property: {
          select: {
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ requests, available: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Driver requests error:', error);
    return NextResponse.json({ error: 'Unable to load transport requests' }, { status: 500 });
  }
}
