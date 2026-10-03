import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth(req, ['USER']);
  const id = params.id;
  const body = await req.json();
  const { stars, comment } = body;
  if (typeof stars !== 'number' || stars < 1 || stars > 5) return new Response('Invalid stars', { status: 400 });
  const tr = await prisma.transportRequest.findUnique({ where: { id } });
  if (!tr) return new Response('Not found', { status: 404 });
  if (tr.tenantId !== user.id) return new Response('Forbidden', { status: 403 });

  const rating = await prisma.rating.create({ data: { transportRequestId: id, tenantId: user.id, driverId: tr.assignedDriverId || '', stars, comment } as any });

  // update driver avg
  if (tr.assignedDriverId) {
    const drv = await prisma.driverProfile.findUnique({ where: { id: tr.assignedDriverId } });
    if (drv) {
      const newCount = drv.ratingCount + 1;
      const newAvg = ((drv.ratingAvg * drv.ratingCount) + stars) / newCount;
      await prisma.driverProfile.update({ where: { id: drv.id }, data: { ratingAvg: newAvg, ratingCount: newCount } as any });
    }
  }

  return new Response(JSON.stringify({ ok: true, rating }));
}
