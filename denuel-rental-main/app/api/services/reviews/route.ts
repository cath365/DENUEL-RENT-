import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get reviews for a service provider
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const [reviews, total] = await Promise.all([
      prisma.serviceReview.findMany({
        where: { providerId },
        include: {
          reviewer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceReview.count({ where: { providerId } }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch service reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - Create a service review
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      providerId,
      rating,
      review,
      serviceDate,
      priceRating,
      qualityRating,
      timelinessRating,
      photos,
    } = body;

    if (!providerId || !rating) {
      return NextResponse.json(
        { error: 'Provider ID and rating are required' },
        { status: 400 }
      );
    }

    const newReview = await prisma.serviceReview.create({
      data: {
        providerId,
        reviewerId: user.id,
        rating,
        review,
        serviceDate: serviceDate ? new Date(serviceDate) : null,
        priceRating,
        qualityRating,
        timelinessRating,
        photos,
      },
    });

    // Update provider's average rating
    const stats = await prisma.serviceReview.aggregate({
      where: { providerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        ratingAvg: stats._avg.rating || 0,
        ratingCount: stats._count.rating || 0,
      },
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error('Create service review error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
