import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get neighborhood data
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const name = searchParams.get('name');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (name) {
      // Get specific neighborhood
      const neighborhood = await prisma.neighborhood.findFirst({
        where: {
          name: { contains: name },
          city: city || undefined,
        },
        include: {
          schools: { take: 10 },
          amenities: { take: 20 },
          marketTrends: {
            orderBy: { month: 'desc' },
            take: 12,
          },
        },
      });

      if (!neighborhood) {
        return NextResponse.json({ error: 'Neighborhood not found' }, { status: 404 });
      }

      return NextResponse.json(neighborhood);
    }

    if (city) {
      // Get all neighborhoods in a city
      const neighborhoods = await prisma.neighborhood.findMany({
        where: { city },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json(neighborhoods);
    }

    // If coordinates provided, find nearest neighborhood
    if (lat && lng) {
      // Get all neighborhoods and filter by proximity (simplified)
      const neighborhoods = await prisma.neighborhood.findMany({
        take: 50,
      });

      // For a proper implementation, you'd use PostGIS or similar
      // This is a simplified version
      return NextResponse.json(neighborhoods);
    }

    // Return all neighborhoods
    const neighborhoods = await prisma.neighborhood.findMany({
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(neighborhoods);
  } catch (error) {
    console.error('Fetch neighborhood error:', error);
    return NextResponse.json({ error: 'Failed to fetch neighborhood data' }, { status: 500 });
  }
}

// POST - Create neighborhood (admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      city,
      country,
      boundaryGeoJson,
      walkScore,
      transitScore,
      bikeScore,
      safetyScore,
      description,
      medianPrice,
      medianRent,
      population,
      medianIncome,
      averageAge,
      crimeIndex,
      schoolsCount,
      amenitiesJson,
    } = body;

    if (!name || !city) {
      return NextResponse.json({ error: 'Name and city are required' }, { status: 400 });
    }

    const neighborhood = await prisma.neighborhood.create({
      data: {
        name,
        city,
        country: country || 'Zambia',
        boundaryGeoJson,
        walkScore,
        transitScore,
        bikeScore,
        safetyScore,
        description,
        medianPrice,
        medianRent,
        population,
        medianIncome,
        averageAge,
        crimeIndex,
        schoolsCount,
        amenitiesJson,
      },
    });

    return NextResponse.json(neighborhood, { status: 201 });
  } catch (error) {
    console.error('Create neighborhood error:', error);
    return NextResponse.json({ error: 'Failed to create neighborhood' }, { status: 500 });
  }
}
