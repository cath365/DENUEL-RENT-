import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export async function GET(req: Request) {
  await requireAuth(req, ['ADMIN']);
  const trips = await prisma.transportRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return new Response(JSON.stringify(trips), { headers: { 'Content-Type': 'application/json' } });
}
