import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCsrf } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';
import hub from '../../../../../lib/transport/realtime';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['USER', 'LANDLORD', 'AGENT', 'ADMIN', 'DRIVER', 'SERVICE_PROVIDER'];

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req, ALLOWED_ROLES);
    requireCsrf(req);

    const id = params.id;
    const transportRequest = await prisma.transportRequest.findUnique({
      where: { id },
      include: {
        assignedDriver: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!transportRequest) {
      return NextResponse.json({ error: 'Transport request not found' }, { status: 404 });
    }

    if (user.id !== transportRequest.tenantId && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cancelableStatuses = new Set([
      'REQUESTED',
      'SEARCHING',
      'DRIVER_ASSIGNED',
      'DRIVER_ARRIVING',
    ]);

    if (!cancelableStatuses.has(transportRequest.status)) {
      return NextResponse.json(
        { error: 'This transport request can no longer be canceled.' },
        { status: 409 },
      );
    }

    const canceled = await prisma.transportRequest.updateMany({
      where: {
        id,
        status: {
          in: ['REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING'],
        },
      },
      data: { status: 'CANCELED' },
    });

    if (canceled.count !== 1) {
      return NextResponse.json(
        { error: 'The trip status changed before cancellation could be completed. Refresh and try again.' },
        { status: 409 },
      );
    }

    if (transportRequest.assignedDriver?.userId) {
      hub.sendToUser(
        transportRequest.assignedDriver.userId,
        'transport_canceled',
        { requestId: id },
      );
    }

    return NextResponse.json({ ok: true, request: { id, status: 'CANCELED' } });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Transport cancellation error:', error);
    return NextResponse.json({ error: 'Unable to cancel transport request' }, { status: 500 });
  }
}
