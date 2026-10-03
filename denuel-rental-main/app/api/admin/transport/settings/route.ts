import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export async function GET(req: Request) {
  await requireAuth(req, ['ADMIN']);
  const settings = await prisma.transportSettings.findFirst();
  return new Response(JSON.stringify(settings), { headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request) {
  await requireAuth(req, ['ADMIN']);
  const body = await req.json();
  const existing = await prisma.transportSettings.findFirst();
  if (existing) {
    const updated = await prisma.transportSettings.update({ where: { id: existing.id }, data: body as any });
    return new Response(JSON.stringify(updated), { headers: { 'Content-Type': 'application/json' } });
  }
  const created = await prisma.transportSettings.create({ data: body as any });
  return new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
