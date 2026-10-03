import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get reviews for an agent
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'recent';

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const orderBy: Record<string, string> = {};
    switch (sortBy) {
      case 'recent':
        orderBy.createdAt = 'desc';
        break;
      case 'highest':
        orderBy.rating = 'desc';
        break;
      case 'lowest':
        orderBy.rating = 'asc';
        break;
      case 'helpful':
        orderBy.helpfulness = 'desc';
        break;
    }

    const [reviews, total, stats] = await Promise.all([
      prisma.agentReview.findMany({
        where: { agentId },
        include: {
          reviewer: {
            select: { id: true, name: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agentReview.count({ where: { agentId } }),
      prisma.agentReview.aggregate({
        where: { agentId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Calculate rating distribution
    const ratingDistribution = await prisma.agentReview.groupBy({
      by: ['rating'],
      where: { agentId },
      _count: { rating: true },
    });

    const distribution = [1, 2, 3, 4, 5].reduce((acc, rating) => {
      const found = ratingDistribution.find((r) => r.rating === rating);
      acc[rating] = found?._count.rating || 0;
      return acc;
    }, {} as Record<number, number>);

    // Calculate recommendation percentage
    const wouldRecommendCount = await prisma.agentReview.count({
      where: { agentId, wouldRecommend: true },
    });
    const recommendationRate = total > 0 ? (wouldRecommendCount / total) * 100 : 0;

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating || 0,
        distribution,
        recommendationRate: Math.round(recommendationRate),
      },
    });
  } catch (error) {
    console.error('Fetch agent reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - Create a review for an agent
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      agentId,
      propertyId,
      rating,
      title,
      review,
      wouldRecommend,
    } = body;

    if (!agentId || !rating || !review) {
      return NextResponse.json(
        { error: 'Agent ID, rating, and review are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if agent exists
    const agent = await prisma.agentProfile.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if user already reviewed this agent
    const existingReview = await prisma.agentReview.findFirst({
      where: {
        agentId,
        reviewerId: user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this agent' },
        { status: 400 }
      );
    }

    // Create review
    const newReview = await prisma.agentReview.create({
      data: {
        agentId,
        reviewerId: user.id,
        propertyId,
        rating,
        title,
        review,
        wouldRecommend: wouldRecommend ?? true,
      },
      include: {
        reviewer: {
          select: { id: true, name: true },
        },
      },
    });

    // Update agent's average rating
    const stats = await prisma.agentReview.aggregate({
      where: { agentId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.agentProfile.update({
      where: { id: agentId },
      data: {
        ratingAvg: stats._avg.rating || 0,
        ratingCount: stats._count.rating || 0,
      },
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error('Create agent review error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
