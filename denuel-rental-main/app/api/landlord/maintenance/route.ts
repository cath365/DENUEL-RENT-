import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get maintenance requests
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const role = searchParams.get('role'); // 'landlord' or 'tenant'

    const where: Record<string, unknown> = {};

    if (role === 'landlord' || user.role === 'LANDLORD') {
      where.landlordId = user.id;
    } else {
      where.tenantId = user.id;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, addressText: true },
        },
        tenant: {
          select: { id: true, name: true, email: true, phone: true },
        },
        landlord: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { priority: 'asc' }, // EMERGENCY first
        { createdAt: 'desc' },
      ],
    });

    // Stats
    const stats = {
      open: requests.filter((r) => r.status === 'OPEN').length,
      inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
      scheduled: requests.filter((r) => r.status === 'SCHEDULED').length,
      completed: requests.filter((r) => r.status === 'COMPLETED').length,
      emergency: requests.filter((r) => r.priority === 'EMERGENCY' && r.status !== 'COMPLETED').length,
    };

    return NextResponse.json({ requests, stats });
  } catch (error) {
    console.error('Fetch maintenance requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

// POST - Create maintenance request (tenant)
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      propertyId,
      category,
      priority,
      title,
      description,
      photos,
    } = body;

    if (!propertyId || !category || !title || !description) {
      return NextResponse.json(
        { error: 'Property, category, title, and description are required' },
        { status: 400 }
      );
    }

    // Get property and landlord
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        propertyId,
        tenantId: user.id,
        landlordId: property.ownerId,
        category,
        priority: priority || 'MEDIUM',
        title,
        description,
        photos,
        notes: [],
      },
      include: {
        property: { select: { title: true } },
      },
    });

    // Notify landlord
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        type: 'MAINTENANCE_REQUEST',
        data: {
          requestId: request.id,
          propertyTitle: request.property.title,
          category,
          priority: priority || 'MEDIUM',
          title,
          tenantName: user.name,
        },
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('Create maintenance request error:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}

// PUT - Update maintenance request
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      requestId,
      status,
      assignedTo,
      scheduledAt,
      completedAt,
      cost,
      note,
      tenantRating,
    } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check authorization
    const isLandlord = request.landlordId === user.id;
    const isTenant = request.tenantId === user.id;

    if (!isLandlord && !isTenant && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status && isLandlord) {
      updateData.status = status;
    }

    if (assignedTo && isLandlord) {
      updateData.assignedTo = assignedTo;
    }

    if (scheduledAt && isLandlord) {
      updateData.scheduledAt = new Date(scheduledAt);
    }

    if (completedAt && isLandlord) {
      updateData.completedAt = new Date(completedAt);
      updateData.status = 'COMPLETED';
    }

    if (cost && isLandlord) {
      updateData.cost = cost;
    }

    if (tenantRating && isTenant) {
      updateData.tenantRating = tenantRating;
    }

    // Add note to history
    if (note) {
      const notes = ((request.notes as unknown) as Array<{ note: string; by: string; at: Date }>) || [];
      notes.push({
        note,
        by: user.name || user.email,
        at: new Date(),
      });
      updateData.notes = notes as unknown as object;
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    // Notify tenant of status updates
    if (status && isLandlord) {
      await prisma.notification.create({
        data: {
          userId: request.tenantId,
          type: 'MAINTENANCE_UPDATE',
          data: {
            requestId,
            title: request.title,
            status,
            scheduledAt,
          },
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update maintenance request error:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
