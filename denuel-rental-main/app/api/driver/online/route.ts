import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export async function POST(req: Request) {
  const user = await requireAuth(req, ['DRIVER']);
  const body = await req.json();
  const { online } = body;
  await prisma.driverProfile.updateMany({ where: { userId: user.id }, data: { isOnline: !!online } });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
