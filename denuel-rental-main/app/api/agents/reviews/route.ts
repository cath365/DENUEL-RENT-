import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

const ReviewSchema = z.object({
  agentId: z.string().min(1),
  propertyId: z.string().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().nullable(),
  review: z.string().trim().min(5).max(2500),
  wouldRecommend: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const page = Math.max(1, Number(searchParams.get('page') || 1) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 10) || 10));
    const sortBy = searchParams.get('sortBy') || 'recent';

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required.' },
        { status: 400 }
      );
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'highest') orderBy = { rating: 'desc' };
    else if (sortBy === 'lowest') orderBy = { rating: 'asc' };
    else if (sortBy === 'helpful') orderBy = { helpfulness: 'desc' };

    const [reviews, total, stats, recommendationCount] = await Promise.all([
      prisma.agentReview.findMany({
        where: { agentId },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
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
      prisma.agentReview.count({
        where: { agentId, wouldRecommend: true },
      }),
    ]);

    const ratingDistribution = await prisma.agentReview.groupBy({
      by: ['rating'],
      where: { agentId },
      _count: { rating: true },
    });

    const distribution = [1, 2, 3, 4, 5].reduce(
      (acc, rating) => {
        const found = ratingDistribution.find(
          (row) => row.rating === rating
        );
        acc[rating] = found?._count.rating || 0;
        return acc;
      },
      {} as Record<number, number>
    );

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
        recommendationRate:
          total > 0
            ? Math.round((recommendationCount / total) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error('Fetch agent reviews error:', error);
    const safe = publicServerError(error, 'Unable to load agent reviews.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const parsed = ReviewSchema.parse(await req.json());

    const agent = await prisma.agentProfile.findUnique({
      where: { id: parsed.agentId },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found.' },
        { status: 404 }
      );
    }

    if (agent.userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot review your own agent profile.' },
        { status: 400 }
      );
    }

    const existingReview = await prisma.agentReview.findFirst({
      where: {
        agentId: parsed.agentId,
        reviewerId: user.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this agent.' },
        { status: 409 }
      );
    }

    if (parsed.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: parsed.propertyId },
        select: {
          id: true,
          ownerId: true,
        },
      });

      if (!property || property.ownerId !== agent.userId) {
        return NextResponse.json(
          { error: 'The selected property is not managed by this agent.' },
          { status: 400 }
        );
      }
    }

    const [completedViewing, tenantLease] = await Promise.all([
      prisma.viewingAppointment.findFirst({
        where: {
          visitorId: user.id,
          status: 'COMPLETED',
          property: {
            ownerId: agent.userId,
            ...(parsed.propertyId
              ? { id: parsed.propertyId }
              : {}),
          },
        },
        select: { id: true },
      }),
      prisma.leaseAgreement.findFirst({
        where: {
          tenantId: user.id,
          property: {
            ownerId: agent.userId,
            ...(parsed.propertyId
              ? { id: parsed.propertyId }
              : {}),
          },
          status: {
            in: ['ACTIVE', 'EXPIRED', 'TERMINATED'],
          },
        },
        select: { id: true },
      }),
    ]);

    const verifiedInteraction = Boolean(
      completedViewing || tenantLease
    );

    const newReview = await prisma.agentReview.create({
      data: {
        agentId: parsed.agentId,
        reviewerId: user.id,
        propertyId: parsed.propertyId || null,
        rating: parsed.rating,
        title: parsed.title || null,
        review: parsed.review,
        wouldRecommend: parsed.wouldRecommend ?? true,
        isVerified: verifiedInteraction,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    const stats = await prisma.agentReview.aggregate({
      where: { agentId: parsed.agentId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.agentProfile.update({
      where: { id: parsed.agentId },
      data: {
        ratingAvg: stats._avg.rating || 0,
        ratingCount: stats._count.rating || 0,
      },
    });

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Check the review details.' },
        { status: 422 }
      );
    }
    if (error instanceof Response) return error;

    console.error('Create agent review error:', error);
    const safe = publicServerError(error, 'Unable to submit this review.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
