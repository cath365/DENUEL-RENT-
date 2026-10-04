import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get viewing appointments
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') !== 'false';

    const where: Record<string, unknown> = {};

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { ownerId: true },
      });

      if (!property) {
        return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
      }

      const canViewAllForProperty =
        property.ownerId === user.id || user.role === 'ADMIN';

      where.propertyId = propertyId;

      if (!canViewAllForProperty) {
        where.visitorId = user.id;
      }
    } else if (
      role === 'owner' &&
      (user.role === 'LANDLORD' || user.role === 'AGENT' || user.role === 'ADMIN')
    ) {
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
            area: true,
            ownerId: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { url: true },
            },
            owner: {
              select: {
                id: true,
                name: true,
                phone: true,
                companyName: true,
              },
            },
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch viewing appointments error:', error);
    return NextResponse.json(
      { error: 'Unable to load viewing requests right now.' },
      { status: 500 }
    );
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
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const appointmentId =
      typeof body.appointmentId === 'string' ? body.appointmentId : '';
    const requestedStatus =
      typeof body.status === 'string' ? body.status : '';
    const feedback =
      typeof body.feedback === 'string'
        ? body.feedback.trim().slice(0, 1500)
        : '';
    const rating =
      body.rating === undefined || body.rating === null || body.rating === ''
        ? null
        : Number(body.rating);
    const rescheduledAt =
      body.scheduledAt ? new Date(body.scheduledAt) : null;

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required.' },
        { status: 400 }
      );
    }

    const appointment = await prisma.viewingAppointment.findUnique({
      where: { id: appointmentId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            ownerId: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found.' },
        { status: 404 }
      );
    }

    const isOwner = appointment.property.ownerId === user.id;
    const isVisitor = appointment.visitorId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isVisitor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden.' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    let notificationType = '';
    let notificationMessage = '';

    if (rescheduledAt) {
      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: 'Only the property manager can reschedule a viewing.' },
          { status: 403 }
        );
      }

      if (
        Number.isNaN(rescheduledAt.getTime()) ||
        rescheduledAt.getTime() <= Date.now()
      ) {
        return NextResponse.json(
          { error: 'Choose a valid future viewing time.' },
          { status: 400 }
        );
      }

      updateData.scheduledAt = rescheduledAt;
      updateData.status = 'PENDING';
      notificationType = 'VIEWING_RESCHEDULED';
      notificationMessage =
        `The viewing for "${appointment.property.title}" was rescheduled. Please review the new requested time.`;
    }

    if (requestedStatus) {
      if (isVisitor && !isAdmin) {
        if (requestedStatus !== 'CANCELED') {
          return NextResponse.json(
            { error: 'Visitors can only cancel their own viewing request.' },
            { status: 403 }
          );
        }
      }

      if (
        (isOwner || isAdmin) &&
        ![
          'PENDING',
          'CONFIRMED',
          'COMPLETED',
          'CANCELED',
          'NO_SHOW',
        ].includes(requestedStatus)
      ) {
        return NextResponse.json(
          { error: 'Invalid viewing status.' },
          { status: 400 }
        );
      }

      updateData.status = requestedStatus;

      if (requestedStatus === 'CONFIRMED') {
        notificationType = 'VIEWING_CONFIRMED';
        notificationMessage =
          `Your viewing for "${appointment.property.title}" was confirmed.`;
      } else if (requestedStatus === 'CANCELED') {
        notificationType = 'VIEWING_CANCELED';
        notificationMessage =
          `The viewing for "${appointment.property.title}" was canceled.`;
      } else if (requestedStatus === 'COMPLETED') {
        notificationType = 'VIEWING_COMPLETED';
        notificationMessage =
          `The viewing for "${appointment.property.title}" was marked completed.`;
      } else if (requestedStatus === 'NO_SHOW') {
        notificationType = 'VIEWING_NO_SHOW';
        notificationMessage =
          `The viewing for "${appointment.property.title}" was marked as no-show.`;
      }
    }

    if (isVisitor) {
      if (feedback) {
        updateData.feedback = feedback;
      }

      if (rating !== null) {
        if (
          !Number.isFinite(rating) ||
          rating < 1 ||
          rating > 5
        ) {
          return NextResponse.json(
            { error: 'Rating must be from 1 to 5.' },
            { status: 400 }
          );
        }

        updateData.rating = Math.round(rating);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No permitted viewing update was provided.' },
        { status: 400 }
      );
    }

    const updated = await prisma.viewingAppointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            area: true,
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (notificationType) {
      try {
        const targetUserId =
          isVisitor && requestedStatus === 'CANCELED'
            ? appointment.property.ownerId
            : appointment.visitorId;

        if (targetUserId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: targetUserId,
              type: notificationType,
              data: {
                appointmentId,
                propertyId: appointment.property.id,
                propertyTitle: appointment.property.title,
                scheduledAt: updated.scheduledAt,
                message: notificationMessage,
              },
            },
          });
        }
      } catch {
        // The viewing update remains valid if notification delivery fails.
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Update viewing appointment error:', error);
    return NextResponse.json(
      { error: 'Unable to update the viewing request right now.' },
      { status: 500 }
    );
  }
}

// DELETE - Permanently remove a viewing record (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['ADMIN']);
    requireCsrf(req);

    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required.' },
        { status: 400 }
      );
    }

    const appointment = await prisma.viewingAppointment.findUnique({
      where: { id: appointmentId },
      select: { id: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }

    await prisma.viewingAppointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Delete viewing appointment error:', error);
    return NextResponse.json(
      { error: 'Unable to delete the viewing record.' },
      { status: 500 }
    );
  }
}
