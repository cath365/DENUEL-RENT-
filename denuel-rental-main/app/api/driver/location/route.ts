import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
import hub from '../../../../lib/transport/realtime';

export async function POST(req: Request) {
  await requireAuth(req, ['DRIVER']);
  const body = await req.json();
  const { lat, lng } = body;
  if (typeof lat !== 'number' || typeof lng !== 'number') return new Response('Invalid coords', { status: 400 });
  await prisma.driverProfile.updateMany({ where: { userId: (body.userId ?? null) }, data: { currentLat: lat, currentLng: lng } });
  // broadcast driver location to anyone listening (tenants tracking)
  hub.broadcastToRole('USER', 'driver_location_update', { lat, lng });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
