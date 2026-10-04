import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

const LEASE_STATUSES = new Set([
  'DRAFT',
  'PENDING_SIGNATURES',
  'ACTIVE',
  'EXPIRED',
  'TERMINATED',
]);

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');

    const where: any = {
      OR: [
        { landlordId: user.id },
        { tenantId: user.id },
      ],
    };

    if (propertyId) where.propertyId = propertyId;
    if (status && LEASE_STATUSES.has(status)) where.status = status;

    const leases = await prisma.leaseAgreement.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            addressText: true,
            city: true,
            area: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { url: true },
            },
          },
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
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
    if (error instanceof Response) return error;
    console.error('Fetch leases error:', error);
    const safe = publicServerError(error, 'Unable to load lease records right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'AGENT', 'ADMIN']);
    requireCsrf(req);

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

    const rentAmount = Number(monthlyRent);
    const depositAmount =
      deposit === null || deposit === undefined || deposit === ''
        ? null
        : Number(deposit);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (
      !propertyId ||
      !tenantId ||
      !Number.isFinite(rentAmount) ||
      rentAmount <= 0 ||
      !start ||
      !end ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start >= end
    ) {
      return NextResponse.json(
        { error: 'Property, tenant, monthly rent, and valid lease dates are required.' },
        { status: 400 }
      );
    }

    if (
      depositAmount !== null &&
      (!Number.isFinite(depositAmount) || depositAmount < 0)
    ) {
      return NextResponse.json({ error: 'Deposit must be a valid amount.' }, { status: 400 });
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

    if (
      !property ||
      property.ownerId !== user.id &&
      user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Property not found or you do not manage it.' },
        { status: 404 }
      );
    }

    const tenant = await prisma.user.findUnique({
      where: { id: tenantId },
      select: { id: true },
    });

    if (!tenant || tenant.id === user.id) {
      return NextResponse.json({ error: 'Select a valid tenant.' }, { status: 400 });
    }

    let leaseContent =
      typeof content === 'string' ? content : '';

    if (templateId && !leaseContent) {
      const template = await prisma.leaseTemplate.findUnique({
        where: { id: templateId },
      });

      if (template) {
        leaseContent = template.content;

        const variables = template.variables as Record<string, string> | null;
        if (variables) {
          Object.entries(variables).forEach(([key, defaultValue]) => {
            leaseContent = leaseContent.replace(
              new RegExp(`{{${key}}}`, 'g'),
              defaultValue
            );
          });
        }
      }
    }

    const lease = await prisma.leaseAgreement.create({
      data: {
        propertyId,
        landlordId: property.ownerId,
        tenantId,
        templateId: templateId || null,
        content: leaseContent,
        monthlyRent: rentAmount,
        deposit: depositAmount,
        startDate: start,
        endDate: end,
        terms: terms ?? undefined,
        status: 'PENDING_SIGNATURES',
      },
      include: {
        property: { select: { title: true } },
        tenant: { select: { name: true, email: true } },
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: tenantId,
          type: 'LEASE_CREATED',
          data: {
            leaseId: lease.id,
            propertyTitle: lease.property.title,
            landlordName: user.name,
            monthlyRent: rentAmount,
          },
        },
      });
    } catch {
      // Lease creation remains valid if notification delivery fails.
    }

    return NextResponse.json(lease, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Create lease error:', error);
    const safe = publicServerError(error, 'Unable to create the lease right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json();
    const leaseId = typeof body.leaseId === 'string' ? body.leaseId : '';
    const action = typeof body.action === 'string' ? body.action : '';

    if (!leaseId) {
      return NextResponse.json({ error: 'Lease ID is required.' }, { status: 400 });
    }

    const lease = await prisma.leaseAgreement.findUnique({
      where: { id: leaseId },
    });

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found.' }, { status: 404 });
    }

    const isLandlord = lease.landlordId === user.id;
    const isTenant = lease.tenantId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isLandlord && !isTenant && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (action === 'sign') {
      if (!['DRAFT', 'PENDING_SIGNATURES'].includes(lease.status)) {
        return NextResponse.json(
          { error: 'This lease is not waiting for signatures.' },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {};

      if (isLandlord || isAdmin) {
        updateData.landlordSigned = true;
        updateData.landlordSignedAt = new Date();
      }

      if (isTenant) {
        updateData.tenantSigned = true;
        updateData.tenantSignedAt = new Date();
      }

      const updatedLease = await prisma.leaseAgreement.update({
        where: { id: leaseId },
        data: updateData,
      });

      const bothSigned =
        (isLandlord || isAdmin ? true : lease.landlordSigned) &&
        (isTenant ? true : lease.tenantSigned);

      if (bothSigned) {
        const activeLease = await prisma.leaseAgreement.update({
          where: { id: leaseId },
          data: { status: 'ACTIVE' },
        });

        const existingPayments = await prisma.rentPayment.count({
          where: { leaseId },
        });

        if (existingPayments === 0) {
          await generateRentSchedule(leaseId);
        }

        return NextResponse.json(activeLease);
      }

      return NextResponse.json(updatedLease);
    }

    if (!isLandlord && !isAdmin) {
      return NextResponse.json(
        { error: 'Tenants can only sign their own lease.' },
        { status: 403 }
      );
    }

    const requestedStatus =
      typeof body.status === 'string' && LEASE_STATUSES.has(body.status)
        ? body.status
        : null;

    if (!requestedStatus) {
      return NextResponse.json(
        { error: 'No permitted lease update was provided.' },
        { status: 400 }
      );
    }

    const updated = await prisma.leaseAgreement.update({
      where: { id: leaseId },
      data: { status: requestedStatus },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Update lease error:', error);
    const safe = publicServerError(error, 'Unable to update the lease right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

async function generateRentSchedule(leaseId: string) {
  const lease = await prisma.leaseAgreement.findUnique({
    where: { id: leaseId },
  });

  if (!lease) return;

  const startDate = new Date(lease.startDate);
  const endDate = new Date(lease.endDate);
  const payments = [];

  const currentDate = new Date(startDate);

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

  if (payments.length) {
    await prisma.rentPayment.createMany({ data: payments });
  }
}
