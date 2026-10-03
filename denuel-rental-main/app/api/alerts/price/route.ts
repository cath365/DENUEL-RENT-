import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get user's price alerts
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where: Record<string, unknown> = {
      userId: user.id,
    };

    if (activeOnly) {
      where.isActive = true;
    }

    const alerts = await prisma.priceAlert.findMany({
      where,
      include: {
        property: {
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate price changes for each alert
    const alertsWithChanges = alerts.map((alert) => ({
      ...alert,
      priceChange: alert.property.price - alert.originalPrice,
      priceChangePercent: ((alert.property.price - alert.originalPrice) / alert.originalPrice) * 100,
    }));

    return NextResponse.json(alertsWithChanges);
  } catch (error) {
    console.error('Fetch price alerts error:', error);
    return NextResponse.json({ error: 'Failed to fetch price alerts' }, { status: 500 });
  }
}

// POST - Create a price alert
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, targetPrice, alertOnAnyChange } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Get property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check for existing alert
    const existingAlert = await prisma.priceAlert.findUnique({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId,
        },
      },
    });

    if (existingAlert) {
      // Update existing alert
      const updatedAlert = await prisma.priceAlert.update({
        where: { id: existingAlert.id },
        data: {
          targetPrice,
          alertOnAnyChange: alertOnAnyChange ?? true,
          isActive: true,
        },
      });
      return NextResponse.json(updatedAlert);
    }

    // Create new alert
    const alert = await prisma.priceAlert.create({
      data: {
        userId: user.id,
        propertyId,
        originalPrice: property.price,
        targetPrice,
        alertOnAnyChange: alertOnAnyChange ?? true,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Create price alert error:', error);
    return NextResponse.json({ error: 'Failed to create price alert' }, { status: 500 });
  }
}

// DELETE - Remove a price alert
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    await prisma.priceAlert.deleteMany({
      where: {
        userId: user.id,
        propertyId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete price alert error:', error);
    return NextResponse.json({ error: 'Failed to delete price alert' }, { status: 500 });
  }
}
