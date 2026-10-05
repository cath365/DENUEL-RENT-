import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCsrf } from '../../../../../../lib/auth';
import prisma from '../../../../../../lib/prisma';
import hub from '../../../../../../lib/transport/realtime';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req, ['DRIVER']);
    requireCsrf(req);

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

    if (
      profile.user.isSuspended ||
      !profile.isApproved ||
      profile.verificationStatus !== 'VERIFIED' ||
      !profile.isOnline
    ) {
      return NextResponse.json(
        { error: 'You must be approved, verified and online before accepting requests.' },
        { status: 403 }
      );
    }

    const requestId = params.id;

    const transportRequest = await prisma.transportRequest.findUnique({
      where: { id: requestId },
    });

    if (!transportRequest) {
      return NextResponse.json({ error: 'Transport request not found' }, { status: 404 });
    }

    if (transportRequest.vehicleType !== profile.vehicleType) {
      return NextResponse.json({ error: 'This request requires a different vehicle type.' }, { status: 409 });
    }

    if (transportRequest.status !== 'REQUESTED' || transportRequest.assignedDriverId) {
      return NextResponse.json({ error: 'This request is no longer available.' }, { status: 409 });
    }

    if (transportRequest.expiresAt && transportRequest.expiresAt <= new Date()) {
      return NextResponse.json({ error: 'This transport request has expired.' }, { status: 409 });
    }

    const assigned = await prisma.transportRequest.updateMany({
      where: {
        id: requestId,
        status: 'REQUESTED',
        assignedDriverId: null,
        vehicleType: profile.vehicleType,
      },
      data: {
        assignedDriverId: profile.id,
        status: 'DRIVER_ASSIGNED',
        lockedPriceZmw: transportRequest.lockedPriceZmw ?? transportRequest.priceEstimateZmw,
        priceLockedAt: transportRequest.priceLockedAt ?? new Date(),
      },
    });

    if (assigned.count !== 1) {
      return NextResponse.json({ error: 'Another driver already accepted this request.' }, { status: 409 });
    }

    hub.sendToUser(transportRequest.tenantId, 'driver_assigned', {
      requestId,
      driverId: profile.userId,
    });

    return NextResponse.json({ ok: true, requestId });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Driver request acceptance error:', error);
    return NextResponse.json({ error: 'Unable to accept transport request' }, { status: 500 });
  }
}
