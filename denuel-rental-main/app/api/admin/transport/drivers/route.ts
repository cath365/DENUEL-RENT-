import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export async function GET(req: Request) {
  await requireAuth(req, ['ADMIN']);
  const drivers = await prisma.driverProfile.findMany({ include: { user: true } });
  return new Response(JSON.stringify(drivers), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request) {
  await requireAuth(req, ['ADMIN']);
  const body = await req.json();
  const { userId, isApproved } = body;
  const updated = await prisma.driverProfile.update({ where: { userId }, data: { isApproved } as any });
  return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
}
