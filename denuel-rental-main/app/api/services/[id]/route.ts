import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get service provider details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: params.id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { select: { id: true, name: true } },
          },
        },
        user: {
          select: { name: true, email: true },
        },
        documents: {
          where: { isVerified: true },
          select: { type: true, isVerified: true },
        },
        portfolio: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    // Calculate rating distribution
    const ratingDistribution = provider.reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Calculate sub-ratings averages
    const subRatings = {
      price: provider.reviews.reduce((sum, r) => sum + (r.priceRating || 0), 0) / provider.reviews.filter(r => r.priceRating).length || 0,
      quality: provider.reviews.reduce((sum, r) => sum + (r.qualityRating || 0), 0) / provider.reviews.filter(r => r.qualityRating).length || 0,
      timeliness: provider.reviews.reduce((sum, r) => sum + (r.timelinessRating || 0), 0) / provider.reviews.filter(r => r.timelinessRating).length || 0,
    };

    return NextResponse.json({
      ...provider,
      stats: {
        ratingDistribution,
        subRatings,
      },
    });
  } catch (error) {
    console.error('Fetch service provider error:', error);
    return NextResponse.json({ error: 'Failed to fetch service provider' }, { status: 500 });
  }
}

// PUT - Update service provider
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: params.id },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    if (provider.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.serviceProvider.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update service provider error:', error);
    return NextResponse.json({ error: 'Failed to update service provider' }, { status: 500 });
  }
}
