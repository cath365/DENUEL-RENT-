import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

// POST /api/properties/boost - Boost a property listing
export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    
    const { propertyId, boostType, days = 7 } = body;

    if (!propertyId || !boostType) {
      return NextResponse.json({ error: 'Property ID and boost type required' }, { status: 400 });
    }

    // Check if user owns the property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Define boost prices
    const boostPrices: Record<string, number> = {
      FEATURED: 50,
      URGENT: 30,
      HOMEPAGE: 100,
      TOP_DAILY: 40,
    };

    const price = boostPrices[boostType] || 50;
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Create boost
    const boost = await prisma.propertyBoost.create({
      data: {
        propertyId,
        type: boostType,
        startDate: now,
        endDate,
        price,
        currency: 'ZMW',
        isActive: true,
      },
    });

    // Update property if featured
    if (boostType === 'FEATURED') {
      await prisma.property.update({
        where: { id: propertyId },
        data: { isFeatured: true },
      });
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: price,
        currency: 'ZMW',
        paymentMethod: 'AIRTEL_MONEY',
        description: `Property boost: ${boostType} for ${days} days`,
        status: 'PENDING',
        transactionRef: `BOOST-${Date.now()}`,
      },
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        propertyId,
        type: 'BOOST_LISTING',
        amount: price,
        currency: 'ZMW',
        commission: 0,
        description: `${boostType} boost for ${days} days`,
      },
    });

    return NextResponse.json({ 
      boost,
      message: `Property boosted! Payment of K${price} required.`,
    });
  } catch (error: any) {
    console.error('Boost error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/properties/boost - Get active boosts for user's properties
export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    
    const boosts = await prisma.propertyBoost.findMany({
      where: {
        property: {
          ownerId: user.id,
        },
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ boosts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
