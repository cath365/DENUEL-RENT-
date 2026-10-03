import { requireAuth } from '../../../../../../lib/auth';
import prisma from '../../../../../../lib/prisma';
import hub from '../../../../../../lib/transport/realtime';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth(req, ['DRIVER']);
  const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return new Response('Driver profile not found', { status: 404 });
  const id = params.id;

  // Transaction to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    const tr = await tx.transportRequest.findUnique({ where: { id } });
    if (!tr) return null;
    if (tr.assignedDriverId) return { status: 'already_assigned' };
    const updated = await tx.transportRequest.update({ where: { id }, data: { assignedDriverId: profile.id, status: 'DRIVER_ASSIGNED' } });
    return updated;
  });

  if (!result) return new Response('Not found', { status: 404 });
  if ((result as any).status === 'already_assigned') return new Response('Already assigned', { status: 409 });

  // notify tenant
  hub.sendToUser((result as any).tenantId, 'driver_assigned', { requestId: id, driverId: profile.userId });

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
