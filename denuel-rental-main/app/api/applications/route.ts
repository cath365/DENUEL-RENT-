import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../lib/auth';
import { publicServerError } from '../../../lib/publicError';

const APPLICATION_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED']);

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json();
    const propertyId =
      typeof body.propertyId === 'string' ? body.propertyId : '';

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID required.' },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        status: true,
        listingType: true,
        title: true,
      },
    });

    if (!property || property.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'This property is not available for applications.' },
        { status: 404 }
      );
    }

    if (property.listingType !== 'RENT') {
      return NextResponse.json(
        { error: 'Applications are only available for rental listings.' },
        { status: 400 }
      );
    }

    if (property.ownerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot apply to your own property.' },
        { status: 400 }
      );
    }

    const existing = await prisma.application.findUnique({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'You already applied for this property.',
          application: existing,
        },
        { status: 409 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        propertyId,
        feeAmount: null,
        feePaid: false,
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: property.ownerId,
          type: 'APPLICATION_SUBMITTED',
          data: {
            title: 'New rental application',
            message: `A renter applied for "${property.title}".`,
            propertyId: property.id,
            applicationId: application.id,
          },
        },
      });
    } catch {
      // Application creation must not fail if notification delivery is unavailable.
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Rental application failed', error);
    const safe = publicServerError(
      error,
      'Unable to submit this application right now.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    if (
      role === 'landlord' &&
      !['LANDLORD', 'AGENT', 'ADMIN'].includes(user.role)
    ) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const where: any =
      role === 'landlord'
        ? { property: { ownerId: user.id } }
        : { userId: user.id };

    if (status && APPLICATION_STATUSES.has(status)) {
      where.status = status;
    }

    const applications = await prisma.application.findMany({
      where,
      include:
        role === 'landlord'
          ? {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  profileImage: true,
                  isEmailVerified: true,
                  isPhoneVerified: true,
                  isIdVerified: true,
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
                  listingType: true,
                  status: true,
                  images: {
                    orderBy: { sortOrder: 'asc' as const },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            }
          : {
              property: {
                include: {
                  images: {
                    orderBy: { sortOrder: 'asc' as const },
                  },
                },
              },
            },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Application list failed', error);
    const safe = publicServerError(
      error,
      'Unable to load applications right now.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req, [
      'LANDLORD',
      'AGENT',
      'ADMIN',
    ]);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const applicationId =
      typeof body.applicationId === 'string'
        ? body.applicationId
        : '';
    const status =
      typeof body.status === 'string' ? body.status : '';

    if (!applicationId || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Application and a valid decision are required.' },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
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

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found.' },
        { status: 404 }
      );
    }

    if (
      application.property.ownerId !== user.id &&
      user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'You cannot manage this application.' },
        { status: 403 }
      );
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This application has already been decided.' },
        { status: 409 }
      );
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status: status as 'APPROVED' | 'REJECTED' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            isIdVerified: true,
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
            listingType: true,
            status: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: application.userId,
          type:
            status === 'APPROVED'
              ? 'APPLICATION_APPROVED'
              : 'APPLICATION_REJECTED',
          data: {
            title:
              status === 'APPROVED'
                ? 'Rental application approved'
                : 'Rental application update',
            message:
              status === 'APPROVED'
                ? `Your application for "${application.property.title}" was approved. A lease is not created automatically; the landlord will contact you about next steps.`
                : `Your application for "${application.property.title}" was not approved.`,
            propertyId: application.property.id,
            applicationId: application.id,
          },
        },
      });
    } catch {
      // The decision remains valid if notification delivery fails.
    }

    return NextResponse.json({ application: updated });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Application decision failed', error);
    const safe = publicServerError(
      error,
      'Unable to update this application right now.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
