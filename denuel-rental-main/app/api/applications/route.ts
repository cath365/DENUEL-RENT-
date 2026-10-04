import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../lib/auth';
import { publicServerError } from '../../../lib/publicError';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json();
    const propertyId = typeof body.propertyId === 'string' ? body.propertyId : '';

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required.' }, { status: 400 });
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
      return NextResponse.json({ error: 'This property is not available for applications.' }, { status: 404 });
    }

    if (property.listingType !== 'RENT') {
      return NextResponse.json({ error: 'Applications are only available for rental listings.' }, { status: 400 });
    }

    if (property.ownerId === user.id) {
      return NextResponse.json({ error: 'You cannot apply to your own property.' }, { status: 400 });
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
    const safe = publicServerError(error, 'Unable to submit this application right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        property: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Application list failed', error);
    const safe = publicServerError(error, 'Unable to load your applications right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
