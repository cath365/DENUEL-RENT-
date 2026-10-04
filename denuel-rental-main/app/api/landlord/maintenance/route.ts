import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

const MAINTENANCE_STATUSES = new Set([
  'OPEN',
  'IN_PROGRESS',
  'SCHEDULED',
  'COMPLETED',
  'CANCELED',
]);

const PRIORITIES = new Set([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
  'EMERGENCY',
]);

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const role = searchParams.get('role');

    const where: any = {};

    if (role === 'landlord') {
      if (!['LANDLORD', 'AGENT', 'ADMIN'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
      where.landlordId = user.id;
    } else if (role === 'tenant') {
      where.tenantId = user.id;
    } else if (['LANDLORD', 'AGENT'].includes(user.role)) {
      where.landlordId = user.id;
    } else {
      where.tenantId = user.id;
    }

    if (propertyId) where.propertyId = propertyId;
    if (status && MAINTENANCE_STATUSES.has(status)) where.status = status;
    if (priority && PRIORITIES.has(priority)) where.priority = priority;

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            addressText: true,
            city: true,
            area: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        landlord: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const stats = {
      open: requests.filter((r) => r.status === 'OPEN').length,
      inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
      scheduled: requests.filter((r) => r.status === 'SCHEDULED').length,
      completed: requests.filter((r) => r.status === 'COMPLETED').length,
      emergency: requests.filter(
        (r) =>
          r.priority === 'EMERGENCY' &&
          !['COMPLETED', 'CANCELED'].includes(r.status)
      ).length,
    };

    return NextResponse.json({ requests, stats });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch maintenance requests error:', error);
    const safe = publicServerError(
      error,
      'Unable to load maintenance requests.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const propertyId =
      typeof body.propertyId === 'string' ? body.propertyId : '';
    const category =
      typeof body.category === 'string' ? body.category.trim() : '';
    const title =
      typeof body.title === 'string' ? body.title.trim() : '';
    const description =
      typeof body.description === 'string'
        ? body.description.trim().slice(0, 3000)
        : '';
    const priority =
      typeof body.priority === 'string' &&
      PRIORITIES.has(body.priority)
        ? body.priority
        : 'MEDIUM';
    const photos = Array.isArray(body.photos)
      ? body.photos.filter(
          (value: unknown) => typeof value === 'string'
        )
      : [];

    if (!propertyId || !category || !title || !description) {
      return NextResponse.json(
        {
          error:
            'Property, category, title and description are required.',
        },
        { status: 400 }
      );
    }

    const activeLease = await prisma.leaseAgreement.findFirst({
      where: {
        propertyId,
        tenantId: user.id,
        status: 'ACTIVE',
      },
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

    if (!activeLease) {
      return NextResponse.json(
        {
          error:
            'A maintenance request can only be created for a property on your active lease.',
        },
        { status: 403 }
      );
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        propertyId,
        tenantId: user.id,
        landlordId: activeLease.property.ownerId,
        category,
        priority: priority as any,
        title,
        description,
        photos,
        notes: [],
      },
      include: {
        property: {
          select: { title: true },
        },
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: activeLease.property.ownerId,
          type: 'MAINTENANCE_REQUEST',
          data: {
            requestId: request.id,
            propertyTitle: request.property.title,
            category,
            priority,
            title,
            tenantName: user.name,
          },
        },
      });
    } catch {
      // The maintenance request remains valid if notification delivery fails.
    }

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Create maintenance request error:', error);
    const safe = publicServerError(
      error,
      'Unable to create the maintenance request.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const requestId =
      typeof body.requestId === 'string' ? body.requestId : '';

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required.' },
        { status: 400 }
      );
    }

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { error: 'Request not found.' },
        { status: 404 }
      );
    }

    const isLandlord = request.landlordId === user.id;
    const isTenant = request.tenantId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isLandlord && !isTenant && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(body, 'status')) {
      if (!isLandlord && !isAdmin) {
        return NextResponse.json(
          { error: 'Only the property manager can change maintenance status.' },
          { status: 403 }
        );
      }
      if (
        typeof body.status !== 'string' ||
        !MAINTENANCE_STATUSES.has(body.status)
      ) {
        return NextResponse.json(
          { error: 'Invalid maintenance status.' },
          { status: 400 }
        );
      }
      updateData.status = body.status;
      if (body.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'scheduledAt')) {
      if (!isLandlord && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }

      if (body.scheduledAt === null || body.scheduledAt === '') {
        updateData.scheduledAt = null;
      } else {
        const scheduledAt = new Date(body.scheduledAt);
        if (Number.isNaN(scheduledAt.getTime())) {
          return NextResponse.json(
            { error: 'Invalid maintenance schedule date.' },
            { status: 400 }
          );
        }
        updateData.scheduledAt = scheduledAt;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'cost')) {
      if (!isLandlord && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }

      if (body.cost === null || body.cost === '') {
        updateData.cost = null;
      } else {
        const cost = Number(body.cost);
        if (!Number.isFinite(cost) || cost < 0) {
          return NextResponse.json(
            { error: 'Maintenance cost must be a valid non-negative amount.' },
            { status: 400 }
          );
        }
        updateData.cost = cost;
      }
    }

    if (typeof body.assignedTo === 'string' && (isLandlord || isAdmin)) {
      updateData.assignedTo = body.assignedTo.trim() || null;
    }

    if (typeof body.note === 'string' && body.note.trim()) {
      const notes = Array.isArray(request.notes)
        ? [...(request.notes as any[])]
        : [];

      notes.push({
        note: body.note.trim().slice(0, 1500),
        by: user.name || user.email,
        at: new Date().toISOString(),
      });

      updateData.notes = notes;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'tenantRating')) {
      if (!isTenant) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }

      const rating = Number(body.tenantRating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be from 1 to 5.' },
          { status: 400 }
        );
      }
      updateData.tenantRating = rating;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No permitted maintenance update was provided.' },
        { status: 400 }
      );
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    if (
      typeof body.status === 'string' &&
      (isLandlord || isAdmin)
    ) {
      try {
        await prisma.notification.create({
          data: {
            userId: request.tenantId,
            type: 'MAINTENANCE_UPDATE',
            data: {
              requestId,
              title: request.title,
              status: body.status,
              scheduledAt: updateData.scheduledAt || request.scheduledAt,
            },
          },
        });
      } catch {
        // The update remains valid if notification delivery fails.
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Update maintenance request error:', error);
    const safe = publicServerError(
      error,
      'Unable to update this maintenance request.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
