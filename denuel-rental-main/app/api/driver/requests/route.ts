import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function GET(req: Request) {
  const user = await requireAuth(req, ['DRIVER']);
  const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return new Response('Profile not found', { status: 404 });
  // return nearby open requests
  const requests = await prisma.transportRequest.findMany({ where: { status: 'REQUESTED', vehicleType: profile.vehicleType } });
  return new Response(JSON.stringify(requests), { headers: { 'Content-Type': 'application/json' } });
}
