import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get neighborhood details with schools and amenities
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: params.id },
      include: {
        schools: {
          orderBy: { rating: 'desc' },
        },
        amenities: {
          orderBy: { category: 'asc' },
        },
        marketTrends: {
          orderBy: { month: 'desc' },
          take: 24, // 2 years of data
        },
      },
    });

    if (!neighborhood) {
      return NextResponse.json({ error: 'Neighborhood not found' }, { status: 404 });
    }

    // Calculate some derived stats
    const amenitiesByCategory = neighborhood.amenities.reduce((acc, amenity) => {
      acc[amenity.category] = (acc[amenity.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const schoolsByType = neighborhood.schools.reduce((acc, school) => {
      acc[school.type] = (acc[school.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      ...neighborhood,
      stats: {
        amenitiesByCategory,
        schoolsByType,
        totalSchools: neighborhood.schools.length,
        totalAmenities: neighborhood.amenities.length,
        avgSchoolRating: neighborhood.schools.length > 0
          ? neighborhood.schools.reduce((sum, s) => sum + (s.rating || 0), 0) / neighborhood.schools.length
          : null,
      },
    });
  } catch (error) {
    console.error('Fetch neighborhood error:', error);
    return NextResponse.json({ error: 'Failed to fetch neighborhood' }, { status: 500 });
  }
}

// PUT - Update neighborhood
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const neighborhood = await prisma.neighborhood.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(neighborhood);
  } catch (error) {
    console.error('Update neighborhood error:', error);
    return NextResponse.json({ error: 'Failed to update neighborhood' }, { status: 500 });
  }
}
