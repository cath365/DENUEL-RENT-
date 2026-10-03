import { requireAuth } from '../../../../../../lib/auth';
import prisma from '../../../../../../lib/prisma';
import hub from '../../../../../../lib/transport/realtime';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth(req, ['DRIVER']);
  const body = await req.json();
  const { status } = body;
  const id = params.id;
  const tr = await prisma.transportRequest.findUnique({ where: { id } });
  if (!tr) return new Response('Not found', { status: 404 });
  // only assigned driver
  const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
  if (!profile || tr.assignedDriverId !== profile.id) return new Response('Forbidden', { status: 403 });

  // Update status
  const updated = await prisma.transportRequest.update({ where: { id }, data: { status } as any });

  // If trip completed, calculate earnings and record transactions
  if (status === 'COMPLETED') {
    const platformSettings = await prisma.platformSettings.findFirst();
    const commissionPct = (platformSettings?.transportCommissionPct ?? 15) / 100;
    const gross = Number(updated.lockedPriceZmw || updated.priceEstimateZmw || 0);
    const platformFee = Math.round(gross * commissionPct);
    const net = gross - platformFee;

    // create driver earning
    await prisma.driverEarning.create({ data: {
      transportRequestId: updated.id,
      driverId: profile.id,
      grossZmw: gross,
      platformFeeZmw: platformFee,
      netZmw: net,
    }});

    // record transactions: tenant charged (trip payment) and platform fee
    await prisma.transaction.create({ data: {
      userId: updated.tenantId,
      type: 'TRIP_PAYMENT',
      amount: gross,
      description: `Trip payment for transport request ${updated.id}`,
      metadata: { driverId: profile.userId, transportRequestId: updated.id }
    }});

    await prisma.transaction.create({ data: {
      userId: updated.tenantId, // Charge to the tenant, commission goes to platform
      type: 'PLATFORM_COMMISSION',
      amount: platformFee,
      commission: platformFee,
      description: `Platform commission for transport request ${updated.id}`,
      metadata: { driverId: profile.userId, transportRequestId: updated.id }
    }});
  }

  hub.sendToUser(tr.tenantId, 'trip_status', { requestId: id, status });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
