import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Fetch all ads (admin sees all, public sees only active)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get('active') === 'true';
    const placement = url.searchParams.get('placement');

    const where: any = {};
    
    if (activeOnly) {
      where.isActive = true;
      where.OR = [
        { startDate: null },
        { startDate: { lte: new Date() } }
      ];
      where.AND = [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        }
      ];
    }

    if (placement) {
      where.placement = placement;
    }

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ ads });
  } catch (error: any) {
    console.error('Error fetching ads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new ad (admin only)
export async function POST(req: Request) {
  try {
    let user;
    try {
      user = await requireAuth(req, ['ADMIN']);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, imageUrl, linkUrl, placement, isActive, startDate, endDate } = body;

    if (!name || !linkUrl || !placement) {
      return NextResponse.json({ error: 'Name, link URL, and placement are required' }, { status: 400 });
    }

    const ad = await prisma.advertisement.create({
      data: {
        name,
        imageUrl,
        linkUrl,
        placement,
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      }
    });

    return NextResponse.json({ ad, message: 'Ad created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ad:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
