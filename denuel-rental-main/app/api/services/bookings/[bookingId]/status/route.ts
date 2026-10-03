import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const user = await requireAuth(req);
    const { status } = await req.json();
    const bookingId = params.bookingId;
    
    // Get service provider
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id }
    });
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Verify the booking belongs to this provider
    const booking = await prisma.serviceBooking.findFirst({
      where: {
        id: bookingId,
        providerId: provider.id
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update booking status
    const updated = await prisma.serviceBooking.update({
      where: { id: bookingId },
      data: { status }
    });

    // If completed, update provider's completedJobs count
    if (status === 'COMPLETED') {
      await prisma.serviceProvider.update({
        where: { id: provider.id },
        data: {
          completedJobs: { increment: 1 }
        }
      });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Booking status update error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to update booking' }, { status: 500 });
  }
}
