import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get virtual tour for a property
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tour = await prisma.virtualTour.findUnique({
      where: { propertyId: params.id },
      include: {
        property: {
          select: { id: true, title: true, ownerId: true },
        },
      },
    });

    if (!tour) {
      return NextResponse.json({ error: 'Virtual tour not found' }, { status: 404 });
    }

    // Increment view count
    await prisma.virtualTour.update({
      where: { id: tour.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(tour);
  } catch (error) {
    console.error('Fetch virtual tour error:', error);
    return NextResponse.json({ error: 'Failed to fetch virtual tour' }, { status: 500 });
  }
}

// POST - Create/update virtual tour
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = params.id;

    // Verify ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || (property.ownerId !== user.id && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const {
      matterportId,
      tourUrl,
      thumbnailUrl,
      floorPlanUrl,
      videoTourUrl,
      droneVideoUrl,
      tourType,
    } = body;

    if (!tourUrl) {
      return NextResponse.json({ error: 'Tour URL is required' }, { status: 400 });
    }

    const tour = await prisma.virtualTour.upsert({
      where: { propertyId },
      update: {
        matterportId,
        tourUrl,
        thumbnailUrl,
        floorPlanUrl,
        videoTourUrl,
        droneVideoUrl,
        tourType: tourType || '3D',
      },
      create: {
        propertyId,
        matterportId,
        tourUrl,
        thumbnailUrl,
        floorPlanUrl,
        videoTourUrl,
        droneVideoUrl,
        tourType: tourType || '3D',
      },
    });

    // Update property's virtualTourUrl for backward compatibility
    await prisma.property.update({
      where: { id: propertyId },
      data: { virtualTourUrl: tourUrl },
    });

    return NextResponse.json(tour);
  } catch (error) {
    console.error('Create virtual tour error:', error);
    return NextResponse.json({ error: 'Failed to create virtual tour' }, { status: 500 });
  }
}

// DELETE - Remove virtual tour
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
    });

    if (!property || (property.ownerId !== user.id && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.virtualTour.deleteMany({
      where: { propertyId: params.id },
    });

    await prisma.property.update({
      where: { id: params.id },
      data: { virtualTourUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete virtual tour error:', error);
    return NextResponse.json({ error: 'Failed to delete virtual tour' }, { status: 500 });
  }
}
