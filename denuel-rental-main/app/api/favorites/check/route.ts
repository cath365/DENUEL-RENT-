import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId: propertyId,
        },
      },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (e: any) {
    // Not authenticated or other error - return false
    if (e instanceof Response) {
      return NextResponse.json({ isFavorited: false });
    }
    return NextResponse.json({ error: e?.message || 'Invalid request', isFavorited: false }, { status: 400 });
  }
}
