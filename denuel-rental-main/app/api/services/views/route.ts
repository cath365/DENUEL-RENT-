import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get profile views for a service provider
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the service provider profile
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get profile views
    const views = await prisma.serviceProfileView.findMany({
      where: {
        providerId: provider.id,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Get view statistics
    const totalViews = await prisma.serviceProfileView.count({
      where: {
        providerId: provider.id,
        createdAt: { gte: startDate },
      },
    });

    const uniqueViewers = await prisma.serviceProfileView.groupBy({
      by: ['viewerId'],
      where: {
        providerId: provider.id,
        viewerId: { not: null },
        createdAt: { gte: startDate },
      },
    });

    // Get views by day for chart
    const viewsByDay = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as count 
      FROM ServiceProfileView 
      WHERE providerId = ${provider.id} 
      AND createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;

    // Get top search queries that led to profile
    const searchQueries = await prisma.serviceProfileView.groupBy({
      by: ['searchQuery'],
      where: {
        providerId: provider.id,
        searchQuery: { not: null },
        createdAt: { gte: startDate },
      },
      _count: { searchQuery: true },
      orderBy: { _count: { searchQuery: 'desc' } },
      take: 10,
    });

    return NextResponse.json({
      views,
      stats: {
        totalViews,
        uniqueViewers: uniqueViewers.length,
        viewsByDay,
        searchQueries: searchQueries.map(q => ({
          query: q.searchQuery,
          count: q._count.searchQuery,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching views:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Record a profile view
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { providerId, source, searchQuery } = body;

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    // Get viewer info if logged in
    let viewerData: any = {
      providerId,
      source,
      searchQuery,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent'),
    };

    try {
      const user = await requireAuth(req);
      if (user) {
        viewerData.viewerId = user.id;
        viewerData.viewerName = user.name;
        viewerData.viewerEmail = user.email;
        viewerData.viewerPhone = user.phone;
      }
    } catch (e) {
      // Anonymous view
    }

    const view = await prisma.serviceProfileView.create({
      data: viewerData,
    });

    return NextResponse.json({ success: true, view });
  } catch (error: any) {
    console.error('Error recording view:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
