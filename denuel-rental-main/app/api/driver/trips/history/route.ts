import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export async function GET(req: Request) {
  const user = await requireAuth(req, ['DRIVER']);
  const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return new Response('Driver profile not found', { status: 404 });
  const trips = await prisma.transportRequest.findMany({ where: { assignedDriverId: profile.id, status: { in: ['COMPLETED','CANCELED'] } }, orderBy: { createdAt: 'desc' } });
  return new Response(JSON.stringify(trips), { headers: { 'Content-Type': 'application/json' } });
}
