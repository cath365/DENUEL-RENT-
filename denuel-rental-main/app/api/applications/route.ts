import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export const POST = async (req: NextRequest) => {
  try {
    const user = await requireAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { propertyId, feePaid } = await req.json();
    if (!propertyId) return NextResponse.json({ error: 'Property ID required' }, { status: 400 });

    // Check if already applied
    const existing = await prisma.application.findUnique({
      where: { userId_propertyId: { userId: user.id, propertyId } }
    });
    if (existing) return NextResponse.json({ error: 'Already applied' }, { status: 400 });

    const application = await prisma.application.create({
      data: { userId: user.id, propertyId, feePaid: feePaid || false }
    });

    return NextResponse.json(application);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
};

export const GET = async (req: NextRequest) => {
  try {
    const user = await requireAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: { property: { include: { images: { orderBy: { sortOrder: 'asc' } } } } },
      orderBy: { appliedAt: 'desc' }
    });

    return NextResponse.json(applications);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
};