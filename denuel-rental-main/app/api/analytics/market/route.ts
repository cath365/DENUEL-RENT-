import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Market analytics and trends
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const propertyType = searchParams.get('propertyType');
    const listingType = searchParams.get('listingType') || 'RENT';
    const period = searchParams.get('period') || '12'; // months

    const where: Record<string, unknown> = {
      status: 'APPROVED',
      listingType,
    };

    if (city) {
      where.city = city;
    }

    if (area) {
      where.area = area;
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    // Get current listings
    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true,
        price: true,
        bedrooms: true,
        bathrooms: true,
        sizeSqm: true,
        city: true,
        area: true,
        propertyType: true,
        createdAt: true,
        daysOnMarket: true,
      },
    });

    // Calculate statistics
    const prices = properties.map((p) => p.price);
    const sizes = properties.filter((p) => p.sizeSqm).map((p) => p.sizeSqm!);
    const daysOnMarket = properties.map((p) => p.daysOnMarket);

    const stats = {
      totalListings: properties.length,
      medianPrice: calculateMedian(prices),
      averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      medianSize: calculateMedian(sizes),
      averagePricePerSqm: sizes.length > 0
        ? properties.filter((p) => p.sizeSqm).reduce((sum, p) => sum + p.price / p.sizeSqm!, 0) / sizes.length
        : 0,
      averageDaysOnMarket: daysOnMarket.length > 0
        ? daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length
        : 0,
    };

    // Price by bedroom
    const byBedroom = [1, 2, 3, 4, 5].map((beds) => {
      const filtered = properties.filter((p) => p.bedrooms === beds);
      return {
        bedrooms: beds,
        count: filtered.length,
        medianPrice: calculateMedian(filtered.map((p) => p.price)),
        averagePrice: filtered.length > 0
          ? filtered.reduce((sum, p) => sum + p.price, 0) / filtered.length
          : 0,
      };
    });

    // By area (top 10)
    const byArea = properties.reduce((acc, p) => {
      const key = p.area || 'Other';
      if (!acc[key]) {
        acc[key] = { count: 0, totalPrice: 0, prices: [] as number[] };
      }
      acc[key].count++;
      acc[key].totalPrice += p.price;
      acc[key].prices.push(p.price);
      return acc;
    }, {} as Record<string, { count: number; totalPrice: number; prices: number[] }>);

    const areaStats = Object.entries(byArea)
      .map(([area, data]) => ({
        area,
        count: data.count,
        averagePrice: Math.round(data.totalPrice / data.count),
        medianPrice: calculateMedian(data.prices),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Price trends (simulated - would need historical data)
    const monthsAgo = parseInt(period);
    const trends = generateTrends(stats.medianPrice, monthsAgo);

    // Market indicators
    const indicators = {
      marketType: stats.averageDaysOnMarket < 30 ? 'SELLER' : stats.averageDaysOnMarket > 60 ? 'BUYER' : 'BALANCED',
      inventoryLevel: properties.length < 50 ? 'LOW' : properties.length > 200 ? 'HIGH' : 'MODERATE',
      priceDirection: trends.length > 1
        ? trends[trends.length - 1].value > trends[0].value ? 'UP' : 'DOWN'
        : 'STABLE',
      affordability: stats.medianPrice < 5000 ? 'HIGH' : stats.medianPrice > 15000 ? 'LOW' : 'MODERATE',
    };

    return NextResponse.json({
      filters: { city, area, propertyType, listingType },
      stats,
      byBedroom,
      byArea: areaStats,
      trends,
      indicators,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch market analytics' }, { status: 500 });
  }
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function generateTrends(currentMedian: number, months: number) {
  // Generate simulated historical trends
  // In production, this would come from actual historical data
  const trends = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    // Add some random variation (-5% to +5%)
    const variation = 1 + (Math.random() * 0.1 - 0.05);
    const baseValue = currentMedian * (1 - (i * 0.01)); // Slight upward trend
    
    trends.push({
      month: date.toISOString().slice(0, 7),
      value: Math.round(baseValue * variation),
    });
  }
  
  return trends;
}
