import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// PATCH - Update booking status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await params;
    const body = await req.json();
    const { status, finalPrice, notes } = body;

    // Get the booking
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId },
      include: {
        provider: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    // Check if user is the provider
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    const isProvider = provider && provider.id === booking.providerId;
    const isCustomer = booking.customerId === user.id;

    if (!isProvider && !isCustomer) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELED'],
      CONFIRMED: ['COMPLETED', 'CANCELED'],
      COMPLETED: [],
      CANCELED: [],
    };

    if (status && !validTransitions[booking.status]?.includes(status)) {
      return NextResponse.json(
        { message: `Cannot change status from ${booking.status} to ${status}` },
        { status: 400 }
      );
    }

    // Only provider can confirm/complete, customer can only cancel
    if (isCustomer && status && status !== 'CANCELED') {
      return NextResponse.json(
        { message: 'Customers can only cancel bookings' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (finalPrice !== undefined) updateData.finalPrice = finalPrice;
    if (notes !== undefined) updateData.notes = notes;

    const updatedBooking = await prisma.serviceBooking.update({
      where: { id: bookingId },
      data: updateData,
    });

    // If completed, increment provider's completed jobs
    if (status === 'COMPLETED' && booking.providerId) {
      await prisma.serviceProvider.update({
        where: { id: booking.providerId },
        data: {
          completedJobs: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ message: 'Failed to update booking' }, { status: 500 });
  }
}

// DELETE - Cancel booking
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await params;

    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    // Check authorization
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    const isProvider = provider && provider.id === booking.providerId;
    const isCustomer = booking.customerId === user.id;

    if (!isProvider && !isCustomer) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
    }

    // Can only cancel pending or confirmed bookings
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      return NextResponse.json(
        { message: 'Cannot cancel this booking' },
        { status: 400 }
      );
    }

    await prisma.serviceBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELED' },
    });

    return NextResponse.json({ message: 'Booking canceled' });
  } catch (error) {
    console.error('Error canceling booking:', error);
    return NextResponse.json({ message: 'Failed to cancel booking' }, { status: 500 });
  }
}
