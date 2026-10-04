import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CreateLeaseSchema = z.object({
  propertyId: z.string().cuid(),
  tenantId: z.string().cuid(),
  templateId: z.string().cuid().nullable().optional(),
  content: z.string().max(200000).optional(),
  monthlyRent: z.number().positive(),
  deposit: z.number().nonnegative().nullable().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  terms: z.any().optional(),
});

const LeaseActionSchema = z.object({
  leaseId: z.string().cuid(),
  action: z.enum([
    'sign',
    'submit_for_signatures',
    'update_draft',
    'terminate',
  ]),
  content: z.string().max(200000).optional(),
  monthlyRent: z.number().positive().optional(),
  deposit: z.number().nonnegative().nullable().optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().min(1).optional(),
  terms: z.any().optional(),
});

function parseDate(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('INVALID_' + label.toUpperCase() + '_DATE');
  }
  return date;
}

function buildRentSchedule(lease: {
  id: string;
  tenantId: string;
  monthlyRent: number;
  startDate: Date;
  endDate: Date;
}) {
  const payments: Array<{
    leaseId: string;
    tenantId: string;
    amount: number;
    dueDate: Date;
    status: string;
  }> = [];

  const current = new Date(lease.startDate);
  const end = new Date(lease.endDate);

  while (current < end) {
    payments.push({
      leaseId: lease.id,
      tenantId: lease.tenantId,
      amount: lease.monthlyRent,
      dueDate: new Date(current),
      status: 'PENDING',
    });
    current.setMonth(current.getMonth() + 1);
  }

  return payments;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    await prisma.leaseAgreement.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    const where: Record<string, unknown> = {};

    if (role === 'landlord') {
      where.landlordId = user.id;
    } else if (role === 'tenant') {
      where.tenantId = user.id;
    } else if (user.role === 'ADMIN') {
      // Admin may inspect the full lease set when no role is requested.
    } else {
      where.OR = [
        { landlordId: user.id },
        { tenantId: user.id },
      ];
    }

    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;

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
          },
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
    return NextResponse.json(
      { error: 'Failed to fetch leases' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'ADMIN']);
    requireCsrf(req);

    const parsed = CreateLeaseSchema.parse(await req.json());
    const startDate = parseDate(parsed.startDate, 'start');
    const endDate = parseDate(parsed.endDate, 'end');

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'Lease end date must be after the start date.' },
        { status: 422 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: parsed.propertyId },
      select: {
        id: true,
        title: true,
        ownerId: true,
      },
    });

    if (
      !property ||
      (property.ownerId !== user.id && user.role !== 'ADMIN')
    ) {
      return NextResponse.json(
        { error: 'Property not found or unauthorized' },
        { status: 404 }
      );
    }

    if (property.ownerId === parsed.tenantId) {
      return NextResponse.json(
        { error: 'The property owner cannot also be the tenant.' },
        { status: 409 }
      );
    }

    const tenant = await prisma.user.findUnique({
      where: { id: parsed.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        isSuspended: true,
      },
    });

    if (!tenant || tenant.isSuspended) {
      return NextResponse.json(
        { error: 'Tenant account is unavailable.' },
        { status: 409 }
      );
    }

    let leaseContent = parsed.content || '';

    if (parsed.templateId && !leaseContent) {
      const template = await prisma.leaseTemplate.findFirst({
        where: {
          id: parsed.templateId,
          landlordId: property.ownerId,
        },
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Lease template not found for this landlord.' },
          { status: 404 }
        );
      }

      leaseContent = template.content;
    }

    const lease = await prisma.leaseAgreement.create({
      data: {
        propertyId: property.id,
        landlordId: property.ownerId,
        tenantId: tenant.id,
        templateId: parsed.templateId || null,
        content: leaseContent,
        monthlyRent: parsed.monthlyRent,
        deposit: parsed.deposit ?? null,
        startDate,
        endDate,
        terms: parsed.terms,
        status: 'DRAFT',
      },
      include: {
        property: { select: { id: true, title: true } },
        tenant: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ lease }, { status: 201 });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    if (String(error?.message || '').startsWith('INVALID_')) {
      return NextResponse.json(
        { error: 'Enter valid lease start and end dates.' },
        { status: 422 }
      );
    }
    console.error('Create lease error:', error);
    return NextResponse.json(
      { error: 'Failed to create lease' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const parsed = LeaseActionSchema.parse(await req.json());

    const lease = await prisma.leaseAgreement.findUnique({
      where: { id: parsed.leaseId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 });
    }

    const isLandlord = lease.landlordId === user.id;
    const isTenant = lease.tenantId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isLandlord && !isTenant && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (parsed.action === 'sign') {
      if (!isLandlord && !isTenant) {
        return NextResponse.json(
          { error: 'Administrators cannot sign a lease on behalf of a party.' },
          { status: 403 }
        );
      }

      const canSign =
        (isLandlord && ['DRAFT', 'PENDING_SIGNATURES'].includes(lease.status)) ||
        (isTenant && lease.status === 'PENDING_SIGNATURES');

      if (!canSign) {
        return NextResponse.json(
          {
            error: isTenant
              ? 'The landlord must send this lease for signatures before the tenant can sign.'
              : 'This lease is not awaiting signatures.',
          },
          { status: 409 }
        );
      }

      if (
        (isLandlord && lease.landlordSigned) ||
        (isTenant && lease.tenantSigned)
      ) {
        return NextResponse.json(
          { error: 'This party has already signed the lease.' },
          { status: 409 }
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        await tx.leaseAgreement.update({
          where: { id: lease.id },
          data: {
            ...(isLandlord
              ? {
                  landlordSigned: true,
                  landlordSignedAt: new Date(),
                }
              : {
                  tenantSigned: true,
                  tenantSignedAt: new Date(),
                }),
            ...(lease.status === 'DRAFT'
              ? { status: 'PENDING_SIGNATURES' }
              : {}),
          },
        });

        const activated = await tx.leaseAgreement.updateMany({
          where: {
            id: lease.id,
            landlordSigned: true,
            tenantSigned: true,
            status: { in: ['DRAFT', 'PENDING_SIGNATURES'] },
          },
          data: { status: 'ACTIVE' },
        });

        if (activated.count === 1) {
          const activatedLease = await tx.leaseAgreement.findUnique({
            where: { id: lease.id },
            select: {
              id: true,
              tenantId: true,
              monthlyRent: true,
              startDate: true,
              endDate: true,
            },
          });

          if (activatedLease) {
            const existingPayments = await tx.rentPayment.count({
              where: { leaseId: lease.id },
            });

            if (existingPayments === 0) {
              const schedule = buildRentSchedule(activatedLease);
              if (schedule.length) {
                await tx.rentPayment.createMany({ data: schedule });
              }
            }
          }
        }

        return tx.leaseAgreement.findUnique({
          where: { id: lease.id },
          include: {
            property: {
              select: { id: true, title: true },
            },
            tenant: {
              select: { id: true, name: true, email: true },
            },
            landlord: {
              select: { id: true, name: true, email: true },
            },
          },
        });
      });

      try {
        await prisma.notification.create({
          data: {
            userId: isLandlord ? lease.tenantId : lease.landlordId,
            type: result?.status === 'ACTIVE' ? 'LEASE_ACTIVATED' : 'LEASE_SIGNED',
            data: {
              leaseId: lease.id,
              propertyId: lease.propertyId,
              propertyTitle: lease.property.title,
              signedBy: isLandlord ? 'LANDLORD' : 'TENANT',
              status: result?.status,
            },
          },
        });
      } catch {
        console.warn('Unable to create lease signing notification.');
      }

      return NextResponse.json({ lease: result });
    }

    if (!isLandlord && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the landlord or an administrator can change lease terms.' },
        { status: 403 }
      );
    }

    if (parsed.action === 'submit_for_signatures') {
      if (lease.status !== 'DRAFT') {
        return NextResponse.json(
          { error: 'Only a draft lease can be sent for signatures.' },
          { status: 409 }
        );
      }

      const updated = await prisma.leaseAgreement.update({
        where: { id: lease.id },
        data: { status: 'PENDING_SIGNATURES' },
      });

      try {
        await prisma.notification.create({
          data: {
            userId: lease.tenantId,
            type: 'LEASE_SIGNATURE_REQUIRED',
            data: {
              leaseId: lease.id,
              propertyId: lease.propertyId,
              propertyTitle: lease.property.title,
            },
          },
        });
      } catch {
        console.warn('Unable to create lease signature notification.');
      }

      return NextResponse.json({ lease: updated });
    }

    if (parsed.action === 'terminate') {
      if (!['PENDING_SIGNATURES', 'ACTIVE'].includes(lease.status)) {
        return NextResponse.json(
          { error: 'Only a pending-signature or active lease can be terminated.' },
          { status: 409 }
        );
      }

      const updated = await prisma.leaseAgreement.update({
        where: { id: lease.id },
        data: { status: 'TERMINATED' },
      });

      return NextResponse.json({ lease: updated });
    }

    if (lease.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Lease terms can only be edited while the lease is a draft.' },
        { status: 409 }
      );
    }

    const nextStartDate = parsed.startDate
      ? parseDate(parsed.startDate, 'start')
      : lease.startDate;
    const nextEndDate = parsed.endDate
      ? parseDate(parsed.endDate, 'end')
      : lease.endDate;

    if (nextEndDate <= nextStartDate) {
      return NextResponse.json(
        { error: 'Lease end date must be after the start date.' },
        { status: 422 }
      );
    }

    const updated = await prisma.leaseAgreement.update({
      where: { id: lease.id },
      data: {
        ...(parsed.content !== undefined
          ? { content: parsed.content }
          : {}),
        ...(parsed.monthlyRent !== undefined
          ? { monthlyRent: parsed.monthlyRent }
          : {}),
        ...(parsed.deposit !== undefined
          ? { deposit: parsed.deposit }
          : {}),
        ...(parsed.startDate !== undefined
          ? { startDate: nextStartDate }
          : {}),
        ...(parsed.endDate !== undefined
          ? { endDate: nextEndDate }
          : {}),
        ...(parsed.terms !== undefined ? { terms: parsed.terms } : {}),
      },
    });

    return NextResponse.json({ lease: updated });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    if (String(error?.message || '').startsWith('INVALID_')) {
      return NextResponse.json(
        { error: 'Enter valid lease start and end dates.' },
        { status: 422 }
      );
    }
    console.error('Update lease error:', error);
    return NextResponse.json(
      { error: 'Failed to update lease' },
      { status: 500 }
    );
  }
}
