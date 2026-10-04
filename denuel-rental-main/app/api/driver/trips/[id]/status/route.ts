import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCsrf } from '../../../../../../lib/auth';
import prisma from '../../../../../../lib/prisma';
import hub from '../../../../../../lib/transport/realtime';

export const dynamic = 'force-dynamic';

const transitions: Record<string, string[]> = {
  DRIVER_ASSIGNED: ['DRIVER_ARRIVING'],
  DRIVER_ARRIVING: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req, ['DRIVER']);
    requireCsrf(req);

    const body = await req.json();
    const nextStatus = String(body.status || '');
    const requestId = params.id;

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const transportRequest = await prisma.transportRequest.findUnique({
      where: { id: requestId },
    });

    if (!transportRequest) {
      return NextResponse.json({ error: 'Transport request not found' }, { status: 404 });
    }

    if (transportRequest.assignedDriverId !== profile.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowed = transitions[transportRequest.status] || [];
    if (!allowed.includes(nextStatus)) {
      return NextResponse.json(
        { error: 'Invalid trip status transition from ' + transportRequest.status + ' to ' + nextStatus },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const trip = await tx.transportRequest.update({
        where: { id: requestId },
        data: { status: nextStatus as any },
      });

      if (nextStatus === 'COMPLETED') {
        const platformSettings = await tx.platformSettings.findFirst();
        const commissionPct = (platformSettings?.transportCommissionPct ?? 15) / 100;
        const gross = Number(trip.lockedPriceZmw || trip.priceEstimateZmw || 0);
        const platformFee = Math.round(gross * commissionPct);
        const net = gross - platformFee;

        await tx.driverEarning.upsert({
          where: { transportRequestId: trip.id },
          create: {
            transportRequestId: trip.id,
            driverId: profile.id,
            grossZmw: gross,
            platformFeeZmw: platformFee,
            netZmw: net,
          },
          update: {},
        });

        await tx.transaction.create({
          data: {
            userId: trip.tenantId,
            type: 'TRIP_PAYMENT',
            amount: gross,
            currency: 'ZMW',
            description: 'Trip payment for transport request ' + trip.id,
            metadata: {
              driverId: profile.userId,
              transportRequestId: trip.id,
            },
          },
        });

        if (platformFee > 0) {
          await tx.transaction.create({
            data: {
              userId: trip.tenantId,
              type: 'PLATFORM_COMMISSION',
              amount: platformFee,
              currency: 'ZMW',
              commission: platformFee,
              description: 'Platform commission for transport request ' + trip.id,
              metadata: {
                driverId: profile.userId,
                transportRequestId: trip.id,
              },
            },
          });
        }
      }

      return trip;
    });

    hub.sendToUser(updated.tenantId, 'trip_status', {
      requestId,
      status: nextStatus,
    });

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Driver trip status error:', error);
    return NextResponse.json({ error: 'Unable to update trip status' }, { status: 500 });
  }
}
