import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export async function GET(req: Request) {
  await requireAuth(req, ['ADMIN']);
  const rules = await prisma.pricingRule.findMany({ orderBy: { vehicleType: 'asc' } });
  return new Response(JSON.stringify(rules), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request) {
  await requireAuth(req, ['ADMIN']);
  const body = await req.json();
  const { id, vehicleType, baseFareZmw, perKmZmw, perMinZmw, minimumFareZmw, surgeMultiplier, nightMultiplier, weatherMultiplier, isActive } = body;
  if (id) {
    const updated = await prisma.pricingRule.update({ where: { id }, data: { vehicleType, baseFareZmw, perKmZmw, perMinZmw, minimumFareZmw, surgeMultiplier, nightMultiplier, weatherMultiplier, isActive } as any });
    return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
  }
  const created = await prisma.pricingRule.create({ data: { vehicleType, baseFareZmw, perKmZmw, perMinZmw, minimumFareZmw, surgeMultiplier, nightMultiplier, weatherMultiplier, isActive } as any });
  return new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
