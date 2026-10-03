import { requireAuth } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { bookingCreateSchema } from '../../../lib/validation_rental';

export async function POST(req: Request) {
  const user = await requireAuth(req, ['USER','LANDLORD','AGENT','ADMIN']);
  const body = await req.json();
  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) return new Response('Invalid input', { status: 400 });
  const data = parsed.data;
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const booking = await prisma.booking.create({ data: {
    propertyId: data.propertyId,
    tenantId: user.id,
    startDate: start,
    endDate: end,
    status: 'PENDING',
    amountZmw: data.amountZmw,
    depositZmw: data.depositZmw || 0,
    createdAt: new Date()
  } as any });
  return new Response(JSON.stringify({ ok: true, bookingId: booking.id }), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
