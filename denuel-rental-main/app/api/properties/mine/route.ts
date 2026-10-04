import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';
import { publicServerError } from '../../../../lib/publicError';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'AGENT', 'ADMIN']);

    const items = await prisma.property.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Owner property list failed', error);
    const safe = publicServerError(error, 'Unable to load your properties right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
