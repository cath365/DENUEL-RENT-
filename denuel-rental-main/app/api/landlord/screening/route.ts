import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get screenings for landlord or applicant
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // 'landlord' or 'applicant'

    const where: Record<string, unknown> = {};
    if (role === 'landlord' || user.role === 'LANDLORD') {
      where.landlordId = user.id;
    } else {
      where.applicantId = user.id;
    }

    const screenings = await prisma.tenantScreening.findMany({
      where,
      include: {
        landlord: {
          select: { id: true, name: true },
        },
        applicant: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const propertyIds = [...new Set(screenings.map((screening) => screening.propertyId).filter(Boolean))] as string[];
    const properties = propertyIds.length
      ? await prisma.property.findMany({
          where: { id: { in: propertyIds } },
          select: { id: true, title: true, city: true, area: true },
        })
      : [];
    const propertyMap = new Map(properties.map((property) => [property.id, property]));

    return NextResponse.json(
      screenings.map((screening) => ({
        ...screening,
        property: screening.propertyId ? propertyMap.get(screening.propertyId) || null : null,
      }))
    );
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch tenant screenings error:', error);
    return NextResponse.json({ error: 'Failed to fetch screenings' }, { status: 500 });
  }
}

// POST - Request tenant screening
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'LANDLORD' && user.role !== 'AGENT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only landlords and agents can request screenings' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { applicantId, propertyId } = body;

    if (!applicantId) {
      return NextResponse.json({ error: 'Applicant ID is required' }, { status: 400 });
    }

    if (propertyId) {
      const property = await prisma.property.findUnique({ where: { id: propertyId } });
      if (!property || (property.ownerId !== user.id && user.role !== 'ADMIN')) {
        return NextResponse.json(
          { error: 'Property not found or unauthorized' },
          { status: 404 }
        );
      }
    }

    // Check if applicant exists
    const applicant = await prisma.user.findUnique({
      where: { id: applicantId },
    });

    if (!applicant) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    // Create screening request
    const screening = await prisma.tenantScreening.create({
      data: {
        landlordId: user.id,
        applicantId,
        propertyId,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Notify applicant
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

    return NextResponse.json(screening, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Create tenant screening error:', error);
    return NextResponse.json({ error: 'Failed to create screening request' }, { status: 500 });
  }
}

// PUT - Record verified screening results. Restricted to admins until a trusted screening integration is connected.
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['ADMIN']);

    const body = await req.json();
    const {
      screeningId,
      creditScore,
      creditStatus,
      backgroundCheck,
      backgroundStatus,
      evictionHistory,
      incomeVerified,
      monthlyIncome,
      employerName,
      employmentStatus,
      references,
    } = body;

    if (!screeningId) {
      return NextResponse.json({ error: 'Screening ID is required' }, { status: 400 });
    }

    const screening = await prisma.tenantScreening.findUnique({
      where: { id: screeningId },
    });

    if (!screening) {
      return NextResponse.json({ error: 'Screening not found' }, { status: 404 });
    }

    const updated = await prisma.tenantScreening.update({
      where: { id: screeningId },
      data: {
        creditScore,
        creditStatus,
        backgroundCheck,
        backgroundStatus,
        evictionHistory,
        incomeVerified,
        monthlyIncome,
        employerName,
        employmentStatus,
        references,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Update tenant screening error:', error);
    return NextResponse.json({ error: 'Failed to update screening' }, { status: 500 });
  }
}
