import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCsrf } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['USER', 'LANDLORD', 'AGENT', 'SERVICE_PROVIDER'];
const RatingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req, ALLOWED_ROLES);
    requireCsrf(req);

    const parsed = RatingSchema.parse(await req.json());
    const id = params.id;

    const transportRequest = await prisma.transportRequest.findUnique({
      where: { id },
      include: {
        Rating: {
          select: { id: true },
        },
      },
    });

    if (!transportRequest) {
      return NextResponse.json({ error: 'Transport request not found' }, { status: 404 });
    }

    if (transportRequest.tenantId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (transportRequest.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'A trip can only be rated after it is completed.' },
        { status: 409 },
      );
    }

    if (!transportRequest.assignedDriverId) {
      return NextResponse.json(
        { error: 'This completed trip has no assigned driver to rate.' },
        { status: 409 },
      );
    }

    if (transportRequest.Rating) {
      return NextResponse.json(
        { error: 'This trip has already been rated.' },
        { status: 409 },
      );
    }

    const rating = await prisma.$transaction(async (tx) => {
      const created = await tx.rating.create({
        data: {
          transportRequestId: id,
          tenantId: user.id,
          driverId: transportRequest.assignedDriverId as string,
          stars: parsed.stars,
          comment: parsed.comment || null,
        },
      });

      const aggregate = await tx.rating.aggregate({
        where: { driverId: transportRequest.assignedDriverId as string },
        _avg: { stars: true },
        _count: { stars: true },
      });

      await tx.driverProfile.update({
        where: { id: transportRequest.assignedDriverId as string },
        data: {
          ratingAvg: aggregate._avg.stars || 0,
          ratingCount: aggregate._count.stars || 0,
        },
      });

      return created;
    });

    return NextResponse.json({
      ok: true,
      rating: {
        id: rating.id,
        stars: rating.stars,
        comment: rating.comment,
        createdAt: rating.createdAt,
      },
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error('Transport rating error:', error);
    return NextResponse.json({ error: 'Unable to save trip rating' }, { status: 500 });
  }
}
