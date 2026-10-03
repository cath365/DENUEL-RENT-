import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';
import hub from '../../../../../lib/transport/realtime';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth(req, ['USER','ADMIN']);
  const id = params.id;
  const tr = await prisma.transportRequest.findUnique({ where: { id } });
  if (!tr) return new Response('Not found', { status: 404 });
  if (user.id !== tr.tenantId && user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });
  await prisma.transportRequest.update({ where: { id }, data: { status: 'CANCELED' } });
  if (tr.assignedDriverId) hub.sendToUser(tr.assignedDriverId, 'transport_canceled', { requestId: id });
  return new Response(JSON.stringify({ ok: true }));
}
