import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

const CreateApplicationSchema = z.object({
  propertyId: z.string().cuid(),
});

const APPLICANT_ROLES = [
  'USER',
  'LANDLORD',
  'AGENT',
  'DRIVER',
  'SERVICE_PROVIDER',
];

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, APPLICANT_ROLES);
    requireCsrf(req);

    if (user.isSuspended) {
      return NextResponse.json(
        { error: 'Suspended accounts cannot submit property applications.' },
        { status: 403 }
      );
    }

    const parsed = CreateApplicationSchema.parse(await req.json());

    const property = await prisma.property.findUnique({
      where: { id: parsed.propertyId },
      select: {
        id: true,
        ownerId: true,
        status: true,
        listingType: true,
        title: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Applications are only available for approved listings.' },
        { status: 409 }
      );
    }

    if (!['RENT', 'BOTH'].includes(property.listingType)) {
      return NextResponse.json(
        { error: 'This property is not currently listed for rent.' },
        { status: 409 }
      );
    }

    if (property.ownerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot apply to your own property.' },
        { status: 409 }
      );
    }

    const existing = await prisma.application.findUnique({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId: property.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'You already applied to this property.',
          application: existing,
        },
        { status: 409 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        propertyId: property.id,
        feeAmount: null,
        feePaid: false,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            area: true,
          },
        },
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: property.ownerId,
          type: 'PROPERTY_APPLICATION',
          data: {
            applicationId: application.id,
            propertyId: property.id,
            propertyTitle: property.title,
            applicantId: user.id,
          },
        },
      });
    } catch {
      console.warn('Unable to create property application notification.');
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error('Create property application error:', error);
    return NextResponse.json(
      { error: 'Unable to submit property application' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, APPLICANT_ROLES);
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (propertyId) {
      const application = await prisma.application.findUnique({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId,
          },
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              area: true,
            },
          },
        },
      });

      return NextResponse.json({ application });
    }

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        property: {
          include: {
            images: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch property applications error:', error);
    return NextResponse.json(
      { error: 'Unable to load property applications' },
      { status: 500 }
    );
  }
}
