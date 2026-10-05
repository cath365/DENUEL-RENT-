import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

const DecisionSchema = z.object({
  applicationId: z.string().cuid(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

function pairKey(propertyId: string, tenantId: string) {
  return propertyId + ':' + tenantId;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'ADMIN']);

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || '').toUpperCase();
    const propertyId = searchParams.get('propertyId');

    const where: any = {
      ...(user.role === 'ADMIN'
        ? {}
        : {
            property: {
              ownerId: user.id,
            },
          }),
    };

    if (['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            isPhoneVerified: true,
            isEmailVerified: true,
            isIdVerified: true,
            trustScore: true,
            isSuspended: true,
            createdAt: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            area: true,
            price: true,
            deposit: true,
            status: true,
            listingType: true,
            ownerId: true,
          },
        },
      },
    });

    const pairs = applications.map((application) => ({
      propertyId: application.propertyId,
      tenantId: application.userId,
    }));

    const leases = pairs.length
      ? await prisma.leaseAgreement.findMany({
          where: {
            OR: pairs,
          },
          select: {
            id: true,
            propertyId: true,
            tenantId: true,
            status: true,
            createdAt: true,
          },
        })
      : [];

    const leaseMap = new Map(
      leases.map((lease) => [
        pairKey(lease.propertyId, lease.tenantId),
        lease,
      ])
    );

    const allForStats = await prisma.application.groupBy({
      by: ['status'],
      where:
        user.role === 'ADMIN'
          ? {}
          : {
              property: {
                ownerId: user.id,
              },
            },
      _count: { _all: true },
    });

    const counts = allForStats.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.status] = row._count._all;
        return acc;
      },
      {}
    );

    return NextResponse.json({
      applications: applications.map((application) => ({
        ...application,
        existingLease:
          leaseMap.get(
            pairKey(application.propertyId, application.userId)
          ) || null,
      })),
      stats: {
        total: allForStats.reduce(
          (sum, row) => sum + row._count._all,
          0
        ),
        pending: counts.PENDING || 0,
        approved: counts.APPROVED || 0,
        rejected: counts.REJECTED || 0,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Landlord applications fetch error:', error);
    return NextResponse.json(
      { error: 'Unable to load property applications' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'ADMIN']);
    requireCsrf(req);

    const parsed = DecisionSchema.parse(await req.json());

    const application = await prisma.application.findUnique({
      where: { id: parsed.applicationId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            status: true,
            listingType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isSuspended: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (
      application.property.ownerId !== user.id &&
      user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (
      parsed.status === 'APPROVED' &&
      (application.property.status !== 'APPROVED' ||
        !['RENT', 'BOTH'].includes(application.property.listingType))
    ) {
      return NextResponse.json(
        {
          error:
            'This application cannot be approved because the property is not an approved rental listing.',
        },
        { status: 409 }
      );
    }

    if (parsed.status === 'APPROVED' && application.user.isSuspended) {
      return NextResponse.json(
        { error: 'A suspended applicant cannot be approved.' },
        { status: 409 }
      );
    }

    const existingLease = await prisma.leaseAgreement.findFirst({
      where: {
        propertyId: application.propertyId,
        tenantId: application.userId,
        status: {
          in: ['DRAFT', 'PENDING_SIGNATURES', 'ACTIVE'],
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (
      existingLease &&
      parsed.status !== 'APPROVED'
    ) {
      return NextResponse.json(
        {
          error:
            'This applicant already has an open lease for the property. Resolve the lease before changing the application decision.',
          lease: existingLease,
        },
        { status: 409 }
      );
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: parsed.status },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: application.userId,
          type: 'PROPERTY_APPLICATION_UPDATED',
          data: {
            applicationId: application.id,
            propertyId: application.propertyId,
            propertyTitle: application.property.title,
            status: parsed.status,
          },
        },
      });
    } catch {
      console.warn('Unable to create application decision notification.');
    }

    return NextResponse.json({
      application: updated,
      existingLease,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 422 }
      );
    }
    console.error('Landlord application decision error:', error);
    return NextResponse.json(
      { error: 'Unable to update application' },
      { status: 500 }
    );
  }
}
