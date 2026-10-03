import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export async function GET(req: Request) {
  await requireAuth(req, ['ADMIN']);
  const q = new URL(req.url).searchParams;
  const take = Number(q.get('take') || 200);
  const transactions = await prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take });
  return new Response(JSON.stringify(transactions), { headers: { 'Content-Type': 'application/json' } });
}
