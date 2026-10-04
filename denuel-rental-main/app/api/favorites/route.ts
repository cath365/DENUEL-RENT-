import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../lib/auth';
import { publicServerError } from '../../../lib/publicError';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ToggleSchema = z.object({ propertyId: z.string().min(1) });

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const items = await prisma.favorite.findMany({
      where: {
        userId: user.id,
        property: { status: 'APPROVED' },
      },
      include: {
        property: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Favorite list failed', error);
    const safe = publicServerError(error, 'Unable to load saved properties.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const parsed = ToggleSchema.parse(await req.json());

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId: parsed.propertyId,
        },
      },
    });

    // A previously saved property can always be removed, even if it is no longer public.
    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.favorite.delete({ where: { id: existing.id } });

        const property = await tx.property.findUnique({
          where: { id: parsed.propertyId },
          select: { saveCount: true },
        });

        if (property && property.saveCount > 0) {
          await tx.property.update({
            where: { id: parsed.propertyId },
            data: { saveCount: { decrement: 1 } },
          });
        }
      });

      return NextResponse.json({ removed: true });
    }

    const property = await prisma.property.findUnique({
      where: { id: parsed.propertyId },
      select: {
        id: true,
        ownerId: true,
        status: true,
      },
    });

    if (!property || property.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'This property is not available to save.' },
        { status: 404 }
      );
    }

    if (property.ownerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot save your own property.' },
        { status: 400 }
      );
    }

    const favorite = await prisma.$transaction(async (tx) => {
      const created = await tx.favorite.create({
        data: {
          userId: user.id,
          propertyId: parsed.propertyId,
        },
      });

      await tx.property.update({
        where: { id: parsed.propertyId },
        data: { saveCount: { increment: 1 } },
      });

      return created;
    });

    return NextResponse.json({ favorite });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid property.' }, { status: 422 });
    }
    if (error instanceof Response) return error;

    console.error('Favorite update failed', error);
    const safe = publicServerError(error, 'Unable to update saved properties.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
