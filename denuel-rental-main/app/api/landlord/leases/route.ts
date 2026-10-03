import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get lease agreements
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      OR: [
        { landlordId: user.id },
        { tenantId: user.id },
      ],
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    const leases = await prisma.leaseAgreement.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true, addressText: true, city: true },
        },
        landlord: {
          select: { id: true, name: true, email: true },
        },
        tenant: {
          select: { id: true, name: true, email: true },
        },
        rentPayments: {
          orderBy: { dueDate: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(leases);
  } catch (error) {
    console.error('Fetch leases error:', error);
    return NextResponse.json({ error: 'Failed to fetch leases' }, { status: 500 });
  }
}

// POST - Create lease agreement
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      propertyId,
      tenantId,
      templateId,
      content,
      monthlyRent,
      deposit,
      startDate,
      endDate,
      terms,
    } = body;

    if (!propertyId || !tenantId || !monthlyRent || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Property, tenant, rent amount, and dates are required' },
        { status: 400 }
      );
    }

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || (property.ownerId !== user.id && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

    // Get template content if using template
    let leaseContent = content;
    if (templateId && !content) {
      const template = await prisma.leaseTemplate.findUnique({
        where: { id: templateId },
      });
      if (template) {
        leaseContent = template.content;
        // Replace variables
        const variables = template.variables as Record<string, string> | null;
        if (variables) {
          Object.entries(variables).forEach(([key, defaultValue]) => {
            // Simple variable replacement
            leaseContent = leaseContent.replace(new RegExp(`{{${key}}}`, 'g'), defaultValue);
          });
        }
      }
    }

    const lease = await prisma.leaseAgreement.create({
      data: {
        propertyId,
        landlordId: user.id,
        tenantId,
        templateId,
        content: leaseContent || '',
        monthlyRent,
        deposit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        terms,
        status: 'DRAFT',
      },
      include: {
        property: { select: { title: true } },
        tenant: { select: { name: true, email: true } },
      },
    });

    // Notify tenant
    await prisma.notification.create({
      data: {
        userId: tenantId,
        type: 'LEASE_CREATED',
        data: {
          leaseId: lease.id,
          propertyTitle: lease.property.title,
          landlordName: user.name,
          monthlyRent,
        },
      },
    });

    return NextResponse.json(lease, { status: 201 });
  } catch (error) {
    console.error('Create lease error:', error);
    return NextResponse.json({ error: 'Failed to create lease' }, { status: 500 });
  }
}

// PUT - Update lease (sign, update status, etc.)
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { leaseId, action, ...updates } = body;

    if (!leaseId) {
      return NextResponse.json({ error: 'Lease ID is required' }, { status: 400 });
    }

    const lease = await prisma.leaseAgreement.findUnique({
      where: { id: leaseId },
    });

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    // Check authorization
    const isLandlord = lease.landlordId === user.id;
    const isTenant = lease.tenantId === user.id;

    if (!isLandlord && !isTenant && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle signing
    if (action === 'sign') {
      const updateData: Record<string, unknown> = {};
      if (isLandlord) {
        updateData.landlordSigned = true;
        updateData.landlordSignedAt = new Date();
      } else if (isTenant) {
        updateData.tenantSigned = true;
        updateData.tenantSignedAt = new Date();
      }

      // Check if both signed
      const updatedLease = await prisma.leaseAgreement.update({
        where: { id: leaseId },
        data: updateData,
      });

      // If both signed, activate lease
      if (
        (isLandlord && lease.tenantSigned) ||
        (isTenant && lease.landlordSigned)
      ) {
        await prisma.leaseAgreement.update({
          where: { id: leaseId },
          data: { status: 'ACTIVE' },
        });

        // Generate rent payment schedule
        await generateRentSchedule(leaseId);
      }

      return NextResponse.json(updatedLease);
    }

    // Regular update
    const updated = await prisma.leaseAgreement.update({
      where: { id: leaseId },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update lease error:', error);
    return NextResponse.json({ error: 'Failed to update lease' }, { status: 500 });
  }
}

// Helper to generate rent payment schedule
async function generateRentSchedule(leaseId: string) {
  const lease = await prisma.leaseAgreement.findUnique({
    where: { id: leaseId },
  });

  if (!lease) return;

  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const payments = [];

  let currentDate = new Date(startDate);
  while (currentDate < endDate) {
    payments.push({
      leaseId,
      tenantId: lease.tenantId,
      amount: lease.monthlyRent,
      dueDate: new Date(currentDate),
      status: 'PENDING',
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  await prisma.rentPayment.createMany({
    data: payments,
  });
}
