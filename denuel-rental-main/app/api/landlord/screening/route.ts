import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    const where: any = {};

    if (role === 'landlord') {
      if (!['LANDLORD', 'AGENT', 'ADMIN'].includes(user.role)) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
      where.landlordId = user.id;
    } else if (role === 'applicant') {
      where.applicantId = user.id;
    } else if (['LANDLORD', 'AGENT'].includes(user.role)) {
      where.landlordId = user.id;
    } else {
      where.applicantId = user.id;
    }

    const screenings = await prisma.tenantScreening.findMany({
      where,
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
          },
        },
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            isIdVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(screenings);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch tenant screenings error:', error);
    const safe = publicServerError(
      error,
      'Unable to load tenant screening records.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, [
      'LANDLORD',
      'AGENT',
      'ADMIN',
    ]);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const applicantId =
      typeof body.applicantId === 'string' ? body.applicantId : '';
    const propertyId =
      typeof body.propertyId === 'string' && body.propertyId
        ? body.propertyId
        : null;

    if (!applicantId) {
      return NextResponse.json(
        { error: 'Applicant ID is required.' },
        { status: 400 }
      );
    }

    const applicant = await prisma.user.findUnique({
      where: { id: applicantId },
      select: { id: true },
    });

    if (!applicant || applicant.id === user.id) {
      return NextResponse.json(
        { error: 'Select a valid applicant.' },
        { status: 400 }
      );
    }

    if (propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { ownerId: true },
      });

      if (
        !property ||
        (property.ownerId !== user.id && user.role !== 'ADMIN')
      ) {
        return NextResponse.json(
          { error: 'Property not found or you do not manage it.' },
          { status: 404 }
        );
      }
    }

    const existing = await prisma.tenantScreening.findFirst({
      where: {
        landlordId: user.id,
        applicantId,
        propertyId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:
            'A pending screening request already exists for this applicant and property.',
          screening: existing,
        },
        { status: 409 }
      );
    }

    const screening = await prisma.tenantScreening.create({
      data: {
        landlordId: user.id,
        applicantId,
        propertyId,
        status: 'PENDING',
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: applicantId,
          type: 'SCREENING_REQUEST',
          data: {
            screeningId: screening.id,
            landlordName: user.name,
            propertyId,
          },
        },
      });
    } catch {
      // The request remains valid if notification delivery fails.
    }

    return NextResponse.json(screening, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Create tenant screening error:', error);
    const safe = publicServerError(
      error,
      'Unable to create the screening request.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

// Screening results must come from a real verified provider integration.
// Manual/simulated credit, background or income results are deliberately disabled.
export async function PUT() {
  return NextResponse.json(
    {
      error:
        'Tenant screening result updates are unavailable until a verified screening provider is connected.',
    },
    { status: 405 }
  );
}
