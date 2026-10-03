import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get user's market report subscriptions
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reports = await prisma.marketReport.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Fetch market reports error:', error);
    return NextResponse.json({ error: 'Failed to fetch market reports' }, { status: 500 });
  }
}

// POST - Subscribe to market reports
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      city,
      area,
      frequency,
      includeNew,
      includeSold,
      includeTrends,
    } = body;

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    // Check for existing subscription
    const existing = await prisma.marketReport.findFirst({
      where: {
        userId: user.id,
        city,
        area: area || null,
      },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.marketReport.update({
        where: { id: existing.id },
        data: {
          frequency: frequency || 'WEEKLY',
          includeNew: includeNew ?? true,
          includeSold: includeSold ?? true,
          includeTrends: includeTrends ?? true,
          isActive: true,
        },
      });
      return NextResponse.json(updated);
    }

    // Create new subscription
    const report = await prisma.marketReport.create({
      data: {
        userId: user.id,
        city,
        area,
        frequency: frequency || 'WEEKLY',
        includeNew: includeNew ?? true,
        includeSold: includeSold ?? true,
        includeTrends: includeTrends ?? true,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Create market report error:', error);
    return NextResponse.json({ error: 'Failed to create market report subscription' }, { status: 500 });
  }
}

// PUT - Update market report subscription
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    const report = await prisma.marketReport.findFirst({
      where: { id, userId: user.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const updated = await prisma.marketReport.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update market report error:', error);
    return NextResponse.json({ error: 'Failed to update market report' }, { status: 500 });
  }
}

// DELETE - Unsubscribe from market report
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    await prisma.marketReport.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete market report error:', error);
    return NextResponse.json({ error: 'Failed to delete market report' }, { status: 500 });
  }
}
