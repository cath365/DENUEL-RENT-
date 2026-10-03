import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Search service providers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const verified = searchParams.get('verified') === 'true';
    const sortBy = searchParams.get('sortBy') || 'rating';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (city) {
      where.city = city;
    }

    if (area) {
      where.area = area;
    }

    if (verified) {
      where.isVerified = true;
    }

    const orderBy: Record<string, string> = {};
    switch (sortBy) {
      case 'rating':
        orderBy.ratingAvg = 'desc';
        break;
      case 'reviews':
        orderBy.ratingCount = 'desc';
        break;
      case 'name':
        orderBy.businessName = 'asc';
        break;
      default:
        orderBy.ratingAvg = 'desc';
    }

    const [providers, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        where,
        include: {
          reviews: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              reviewer: { select: { name: true } },
            },
          },
        },
        orderBy: [{ isVerified: 'desc' }, orderBy],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceProvider.count({ where }),
    ]);

    // Get categories summary
    const categories = await prisma.serviceProvider.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
    });

    return NextResponse.json({
      providers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      categories: categories.map((c) => ({
        name: c.category,
        count: c._count.category,
      })),
    });
  } catch (error) {
    console.error('Fetch service providers error:', error);
    return NextResponse.json({ error: 'Failed to fetch service providers' }, { status: 500 });
  }
}

// POST - Register as a service provider
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    
    const body = await req.json();
    const {
      businessName,
      category,
      description,
      phone,
      email,
      website,
      address,
      city,
      area,
      latitude,
      longitude,
      logoUrl,
      coverPhotoUrl,
      servicesOffered,
      priceRange,
      yearsInBusiness,
      licenseNumber,
    } = body;

    if (!businessName || !category || !phone || !email || !city) {
      return NextResponse.json(
        { error: 'Business name, category, phone, email, and city are required' },
        { status: 400 }
      );
    }

    const provider = await prisma.serviceProvider.create({
      data: {
        userId: user?.id,
        businessName,
        category,
        description,
        phone,
        email,
        website,
        address,
        city,
        area,
        latitude,
        longitude,
        logoUrl,
        coverPhotoUrl,
        servicesOffered,
        priceRange,
        yearsInBusiness,
        licenseNumber,
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Create service provider error:', error);
    return NextResponse.json({ error: 'Failed to register service provider' }, { status: 500 });
  }
}
