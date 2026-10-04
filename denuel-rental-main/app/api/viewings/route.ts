import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';

// GET - Get viewing appointments
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const role = searchParams.get('role'); // 'owner' or 'visitor'
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') !== 'false';

    const where: Record<string, unknown> = {};

    if (propertyId) {
      where.propertyId = propertyId;
    } else if (role === 'owner' || user.role === 'LANDLORD' || user.role === 'AGENT') {
      where.property = { ownerId: user.id };
    } else {
      where.visitorId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (upcoming) {
      where.scheduledAt = { gte: new Date() };
    }

    const appointments = await prisma.viewingAppointment.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            addressText: true,
            city: true,
            ownerId: true,
            owner: { select: { id: true, name: true, phone: true } },
          },
        },
        visitor: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Fetch viewing appointments error:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

// POST - Request a viewing
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json();
    const propertyId = typeof body.propertyId === 'string' ? body.propertyId : '';
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 1000) : null;

    if (!propertyId || !scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { error: 'Property and a valid viewing time are required.' },
        { status: 400 }
      );
    }

    if (scheduledAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'Choose a future date and time.' },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
        status: true,
      },
    });

    if (!property || property.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'This property is not available for viewing requests.' },
        { status: 404 }
      );
    }

    if (property.ownerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot request a viewing for your own property.' },
        { status: 400 }
      );
    }

    const existingAppointment = await prisma.viewingAppointment.findFirst({
      where: {
        propertyId,
        visitorId: user.id,
        scheduledAt,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'You already requested this viewing time.' },
        { status: 409 }
      );
    }

    const appointment = await prisma.viewingAppointment.create({
      data: {
        propertyId,
        visitorId: user.id,
        scheduledAt,
        notes,
        status: 'PENDING',
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: property.ownerId,
          type: 'VIEWING_REQUEST',
          data: {
            appointmentId: appointment.id,
            propertyTitle: property.title,
            visitorName: user.name,
            scheduledAt: scheduledAt.toISOString(),
          },
        },
      });
    } catch {
      // The viewing request remains valid even if notification delivery fails.
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Create viewing appointment error:', error);
    return NextResponse.json(
      { error: 'Unable to submit the viewing request right now.' },
      { status: 500 }
    );
  }
}

// PUT - Update appointment status
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { appointmentId, status, feedback, rating, scheduledAt } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const appointment = await prisma.viewingAppointment.findUnique({
      where: { id: appointmentId },
      include: { property: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check authorization
    const isOwner = appointment.property.ownerId === user.id;
    const isVisitor = appointment.visitorId === user.id;

    if (!isOwner && !isVisitor && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    // Owner can confirm, cancel, mark as no-show
    if (isOwner && status) {
      updateData.status = status;
    }

    // Visitor can cancel or add feedback/rating
    if (isVisitor) {
      if (status === 'CANCELED') updateData.status = status;
      if (feedback) updateData.feedback = feedback;
      if (rating) updateData.rating = rating;
    }

    // Reschedule
    if (scheduledAt && (isOwner || isVisitor)) {
      updateData.scheduledAt = new Date(scheduledAt);
      updateData.status = 'PENDING';
    }

    const updated = await prisma.viewingAppointment.update({
      where: { id: appointmentId },
      data: updateData,
    });

    // Notify relevant party
    if (status === 'CONFIRMED') {
      await prisma.notification.create({
        data: {
          userId: appointment.visitorId,
          type: 'VIEWING_CONFIRMED',
          data: {
            appointmentId,
            propertyTitle: appointment.property.title,
            scheduledAt: appointment.scheduledAt,
          },
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update viewing appointment error:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

// DELETE - Cancel appointment
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const appointment = await prisma.viewingAppointment.findUnique({
      where: { id: appointmentId },
      include: { property: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.visitorId !== user.id && appointment.property.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.viewingAppointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete viewing appointment error:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
