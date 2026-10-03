import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get agent profiles
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const specialty = searchParams.get('specialty');
    const verified = searchParams.get('verified') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const sortBy = searchParams.get('sortBy') || 'rating';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (verified) {
      where.isVerified = true;
    }

    if (featured) {
      where.isFeatured = true;
    }

    // Filter by areas served
    if (city || area) {
      where.areasServed = {
        path: '$',
        array_contains: area || city,
      };
    }

    // Filter by specialty
    if (specialty) {
      where.specialties = {
        path: '$',
        array_contains: specialty,
      };
    }

    const orderBy: Record<string, string> = {};
    switch (sortBy) {
      case 'rating':
        orderBy.ratingAvg = 'desc';
        break;
      case 'sales':
        orderBy.totalSales = 'desc';
        break;
      case 'volume':
        orderBy.totalVolume = 'desc';
        break;
      case 'experience':
        orderBy.yearsExperience = 'desc';
        break;
      case 'reviews':
        orderBy.ratingCount = 'desc';
        break;
      default:
        orderBy.ratingAvg = 'desc';
    }

    const [agents, total] = await Promise.all([
      prisma.agentProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          reviews: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              reviewer: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, orderBy],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agentProfile.count({ where }),
    ]);

    return NextResponse.json({
      agents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch agents error:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST - Create/update agent profile
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has AGENT role
    if (user.role !== 'AGENT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only agents can create agent profiles' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      bio,
      specialties,
      areasServed,
      licenseNumber,
      yearsExperience,
      languages,
      profilePhotoUrl,
      coverPhotoUrl,
      website,
      facebookUrl,
      linkedinUrl,
      instagramUrl,
    } = body;

    // Upsert agent profile
    const agentProfile = await prisma.agentProfile.upsert({
      where: { userId: user.id },
      update: {
        bio,
        specialties,
        areasServed,
        licenseNumber,
        yearsExperience,
        languages,
        profilePhotoUrl,
        coverPhotoUrl,
        website,
        facebookUrl,
        linkedinUrl,
        instagramUrl,
      },
      create: {
        userId: user.id,
        bio,
        specialties,
        areasServed,
        licenseNumber,
        yearsExperience,
        languages,
        profilePhotoUrl,
        coverPhotoUrl,
        website,
        facebookUrl,
        linkedinUrl,
        instagramUrl,
      },
    });

    return NextResponse.json(agentProfile);
  } catch (error) {
    console.error('Create agent profile error:', error);
    return NextResponse.json({ error: 'Failed to create agent profile' }, { status: 500 });
  }
}
