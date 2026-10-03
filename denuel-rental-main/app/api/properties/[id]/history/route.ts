import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get property price history
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id;

    const [property, priceHistory, taxHistory, ownershipHistory] = await Promise.all([
      prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          title: true,
          price: true,
          createdAt: true,
        },
      }),
      prisma.propertyPriceHistory.findMany({
        where: { propertyId },
        orderBy: { date: 'desc' },
      }),
      prisma.propertyTaxHistory.findMany({
        where: { propertyId },
        orderBy: { year: 'desc' },
      }),
      prisma.propertyOwnershipHistory.findMany({
        where: { propertyId },
        orderBy: { purchaseDate: 'desc' },
      }),
    ]);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Calculate price trends
    const priceChanges = priceHistory.length > 1
      ? priceHistory.slice(0, -1).map((entry, index) => ({
          from: priceHistory[index + 1].price,
          to: entry.price,
          change: entry.price - priceHistory[index + 1].price,
          changePercent: ((entry.price - priceHistory[index + 1].price) / priceHistory[index + 1].price) * 100,
          date: entry.date,
          eventType: entry.eventType,
        }))
      : [];

    // Calculate appreciation
    const oldestPrice = priceHistory.length > 0
      ? priceHistory[priceHistory.length - 1].price
      : property.price;
    const appreciation = priceHistory.length > 0
      ? ((property.price - oldestPrice) / oldestPrice) * 100
      : 0;

    return NextResponse.json({
      property,
      priceHistory,
      taxHistory,
      ownershipHistory,
      analysis: {
        currentPrice: property.price,
        priceChanges,
        totalPriceChanges: priceHistory.filter((p) => p.eventType === 'PRICE_CHANGE').length,
        totalAppreciation: appreciation,
        daysListed: Math.floor((Date.now() - property.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        lastPriceChange: priceHistory[0]?.date || null,
      },
    });
  } catch (error) {
    console.error('Fetch property history error:', error);
    return NextResponse.json({ error: 'Failed to fetch property history' }, { status: 500 });
  }
}

// POST - Record a price change
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = params.id;
    const body = await req.json();
    const { price, eventType, source, date } = body;

    // Verify ownership or admin
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Record the price history
    const historyEntry = await prisma.propertyPriceHistory.create({
      data: {
        propertyId,
        price: price || property.price,
        eventType: eventType || 'PRICE_CHANGE',
        source,
        date: date ? new Date(date) : new Date(),
      },
    });

    // If it's a price change, check for price alerts
    if (eventType === 'PRICE_CHANGE' && price < property.price) {
      const priceAlerts = await prisma.priceAlert.findMany({
        where: {
          propertyId,
          isActive: true,
          OR: [
            { alertOnAnyChange: true },
            { targetPrice: { gte: price } },
          ],
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });

      // Create notifications for price drop alerts
      for (const alert of priceAlerts) {
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'PRICE_DROP',
            data: {
              propertyId,
              propertyTitle: property.title,
              oldPrice: property.price,
              newPrice: price,
              savings: property.price - price,
            },
          },
        });

        // Update last alerted
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { lastAlertedAt: new Date() },
        });
      }
    }

    return NextResponse.json(historyEntry, { status: 201 });
  } catch (error) {
    console.error('Record price history error:', error);
    return NextResponse.json({ error: 'Failed to record price history' }, { status: 500 });
  }
}
