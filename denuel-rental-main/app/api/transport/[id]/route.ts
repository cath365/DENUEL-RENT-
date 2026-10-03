import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
import hub from '../../../../lib/transport/realtime';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth(req, ['USER','DRIVER','ADMIN']);
  const id = params.id;
  const tr = await prisma.transportRequest.findUnique({ where: { id } });
  if (!tr) return new Response('Not found', { status: 404 });
  // only tenant, assigned driver or admin can fetch
  if (user.role !== 'ADMIN' && user.id !== tr.tenantId && user.id !== tr.assignedDriverId) return new Response('Forbidden', { status: 403 });
  return new Response(JSON.stringify(tr), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // used for actions like cancel
  const user = await requireAuth(req, ['USER','DRIVER','ADMIN']);
  const id = params.id;
  const body = await req.json();
  const action = body.action;
  if (!action) return new Response('Missing action', { status: 400 });
  const tr = await prisma.transportRequest.findUnique({ where: { id } });
  if (!tr) return new Response('Not found', { status: 404 });

  if (action === 'cancel') {
    if (user.id !== tr.tenantId && user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });
    await prisma.transportRequest.update({ where: { id }, data: { status: 'CANCELED' } });
    hub.sendToUser(tr.assignedDriverId || '', 'transport_canceled', { requestId: id });
    return new Response('Canceled');
  }

  if (action === 'rate') {
    const { stars, comment } = body;
    if (user.id !== tr.tenantId) return new Response('Forbidden', { status: 403 });
    await prisma.rating.create({ data: { transportRequestId: id, tenantId: user.id, driverId: tr.assignedDriverId || '', stars, comment } });
    return new Response('Rated');
  }

  return new Response('Unknown action', { status: 400 });
}
