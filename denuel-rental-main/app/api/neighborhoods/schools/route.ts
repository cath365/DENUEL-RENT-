import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get schools in a neighborhood or by coordinates
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const neighborhoodId = searchParams.get('neighborhoodId');
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '5'); // km
    const type = searchParams.get('type'); // PRIMARY, SECONDARY, TERTIARY

    const where: Record<string, unknown> = {};

    if (neighborhoodId) {
      where.neighborhoodId = neighborhoodId;
    }

    if (type) {
      where.type = type;
    }

    const schools = await prisma.school.findMany({
      where,
      orderBy: { rating: 'desc' },
      include: {
        neighborhood: {
          select: { name: true, city: true },
        },
      },
    });

    // If coordinates provided, filter by distance
    if (lat && lng) {
      const filteredSchools = schools.filter((school) => {
        if (!school.latitude || !school.longitude) return false;
        const distance = calculateDistance(lat, lng, school.latitude, school.longitude);
        return distance <= radius;
      }).map((school) => ({
        ...school,
        distance: school.latitude && school.longitude
          ? calculateDistance(lat, lng, school.latitude, school.longitude)
          : null,
      }));

      return NextResponse.json(filteredSchools.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
    }

    return NextResponse.json(schools);
  } catch (error) {
    console.error('Fetch schools error:', error);
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
  }
}

// POST - Add a school
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      neighborhoodId,
      type,
      rating,
      studentCount,
      latitude,
      longitude,
      districtName,
      isPrivate,
    } = body;

    if (!name || !neighborhoodId || !type) {
      return NextResponse.json(
        { error: 'Name, neighborhoodId, and type are required' },
        { status: 400 }
      );
    }

    const school = await prisma.school.create({
      data: {
        name,
        neighborhoodId,
        type,
        rating,
        studentCount,
        latitude,
        longitude,
        districtName,
        isPrivate: isPrivate || false,
      },
    });

    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    console.error('Create school error:', error);
    return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
