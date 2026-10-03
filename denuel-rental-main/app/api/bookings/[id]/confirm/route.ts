import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';
import hub from '../../../../../lib/transport/realtime';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await requireAuth(req, ['USER','ADMIN']);
  const id = params.id;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return new Response('Booking not found', { status: 404 });
  if (booking.tenantId !== user.id && user.role !== 'ADMIN') return new Response('Forbidden', { status: 403 });

  // mark confirmed (simulate payment flow)
  await prisma.booking.update({ where: { id }, data: { status: 'CONFIRMED', updatedAt: new Date() } as any });

  // Fetch property for dropoff
  const property = await prisma.property.findUnique({ where: { id: booking.propertyId } });

  // Notify tenant client to show transport offer modal with property location and optional pickup suggestions
  hub.sendToUser(booking.tenantId, 'booking_confirmed', {
    bookingId: booking.id,
    propertyId: booking.propertyId,
    dropoffLat: property?.latitude,
    dropoffLng: property?.longitude,
    message: 'Booking confirmed. Offer transport to move in?'
  });

  return new Response(JSON.stringify({ ok: true, bookingId: id }), { headers: { 'Content-Type': 'application/json' } });
}
