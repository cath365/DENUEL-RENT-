import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ComparableSale {
  id: string;
  title: string;
  price: number;
  soldDate?: Date;
  bedrooms: number;
  bathrooms: number;
  sizeSqm?: number;
  distance?: number;
  similarity: number;
}

// Zestimate-style valuation algorithm
async function calculatePropertyValue(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      priceHistory: { orderBy: { date: 'desc' }, take: 1 },
    },
  });

  if (!property) {
    throw new Error('Property not found');
  }

  // Find comparable properties (same city, similar specs, recent)
  const comparables = await prisma.property.findMany({
    where: {
      id: { not: propertyId },
      city: property.city,
      status: 'APPROVED',
      bedrooms: {
        gte: Math.max(0, property.bedrooms - 1),
        lte: property.bedrooms + 1,
      },
      bathrooms: {
        gte: Math.max(1, property.bathrooms - 1),
        lte: property.bathrooms + 1,
      },
    },
    include: {
      priceHistory: { orderBy: { date: 'desc' }, take: 1 },
    },
    take: 20,
  });

  if (comparables.length === 0) {
    // No comparables - use listing price as estimate
    return {
      estimatedValue: property.price,
      rentEstimate: property.listingType === 'RENT' ? property.price : property.price * 0.004, // 0.4% of value for monthly rent
      lowEstimate: property.price * 0.9,
      highEstimate: property.price * 1.1,
      confidenceScore: 0.3,
      comparables: [],
      factors: {
        note: 'Limited comparable data available',
      },
    };
  }

  // Calculate similarity scores and weighted average
  const scoredComparables: ComparableSale[] = comparables.map((comp) => {
    let similarity = 1.0;

    // Bedroom match
    if (comp.bedrooms === property.bedrooms) similarity += 0.2;
    else similarity -= Math.abs(comp.bedrooms - property.bedrooms) * 0.1;

    // Bathroom match
    if (comp.bathrooms === property.bathrooms) similarity += 0.15;
    else similarity -= Math.abs(comp.bathrooms - property.bathrooms) * 0.08;

    // Size match (if available)
    if (property.sizeSqm && comp.sizeSqm) {
      const sizeDiff = Math.abs(comp.sizeSqm - property.sizeSqm) / property.sizeSqm;
      similarity -= sizeDiff * 0.3;
    }

    // Area match
    if (comp.area === property.area) similarity += 0.25;

    // Furnished match
    if (comp.furnished === property.furnished) similarity += 0.1;

    // Recency bonus (newer listings more relevant)
    const ageMonths = (Date.now() - comp.updatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (ageMonths < 3) similarity += 0.1;
    else if (ageMonths > 12) similarity -= 0.15;

    // Calculate distance if coordinates available
    let distance: number | undefined;
    if (property.latitude && property.longitude && comp.latitude && comp.longitude) {
      distance = calculateDistance(
        property.latitude,
        property.longitude,
        comp.latitude,
        comp.longitude
      );
      // Closer properties are more relevant
      if (distance < 1) similarity += 0.2;
      else if (distance < 3) similarity += 0.1;
      else if (distance > 10) similarity -= 0.2;
    }

    return {
      id: comp.id,
      title: comp.title,
      price: comp.price,
      bedrooms: comp.bedrooms,
      bathrooms: comp.bathrooms,
      sizeSqm: comp.sizeSqm || undefined,
      distance,
      similarity: Math.max(0, Math.min(1, similarity)),
    };
  });

  // Sort by similarity and take top 5
  const topComparables = scoredComparables
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

  // Calculate weighted average price
  const totalWeight = topComparables.reduce((sum, c) => sum + c.similarity, 0);
  const weightedPrice = topComparables.reduce(
    (sum, c) => sum + c.price * c.similarity,
    0
  ) / totalWeight;

  // Adjust based on property-specific factors
  let adjustedValue = weightedPrice;
  const factors: Record<string, number> = {};

  // Size adjustment
  if (property.sizeSqm) {
    const avgSize = topComparables.reduce((sum, c) => sum + (c.sizeSqm || 0), 0) /
      topComparables.filter((c) => c.sizeSqm).length;
    if (avgSize > 0) {
      const sizeMultiplier = property.sizeSqm / avgSize;
      adjustedValue *= sizeMultiplier;
      factors.sizeAdjustment = (sizeMultiplier - 1) * 100;
    }
  }

  // Feature adjustments
  if (property.furnished) {
    adjustedValue *= 1.05;
    factors.furnished = 5;
  }
  if (property.parkingSpaces > 0) {
    adjustedValue *= 1 + property.parkingSpaces * 0.02;
    factors.parking = property.parkingSpaces * 2;
  }
  if (property.internetAvailable) {
    adjustedValue *= 1.02;
    factors.internet = 2;
  }
  if (property.powerBackup !== 'NONE') {
    adjustedValue *= 1.03;
    factors.powerBackup = 3;
  }
  if (property.petsAllowed) {
    adjustedValue *= 1.01;
    factors.petFriendly = 1;
  }

  // Calculate confidence score
  const confidenceScore = Math.min(
    0.95,
    0.4 + topComparables.length * 0.1 + (topComparables[0]?.similarity || 0) * 0.2
  );

  // Calculate range
  const variance = topComparables.length > 2
    ? standardDeviation(topComparables.map((c) => c.price)) / weightedPrice
    : 0.15;
  const lowEstimate = adjustedValue * (1 - variance);
  const highEstimate = adjustedValue * (1 + variance);

  // Rent estimate (if sale property, estimate rent; if rental, estimate value)
  let rentEstimate: number | null = null;
  if (property.listingType === 'SALE') {
    rentEstimate = adjustedValue * 0.004; // ~0.4% monthly rent to value ratio
  } else {
    rentEstimate = property.price;
  }

  return {
    estimatedValue: Math.round(adjustedValue),
    rentEstimate: rentEstimate ? Math.round(rentEstimate) : null,
    lowEstimate: Math.round(lowEstimate),
    highEstimate: Math.round(highEstimate),
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    comparables: topComparables,
    factors,
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function standardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

// GET - Get valuation for a property
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id;

    // Check for cached valuation (less than 7 days old)
    const cachedValuation = await prisma.propertyValuation.findFirst({
      where: {
        propertyId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (cachedValuation) {
      return NextResponse.json({
        ...cachedValuation,
        cached: true,
      });
    }

    // Calculate new valuation
    const valuation = await calculatePropertyValue(propertyId);

    // Save valuation
    const savedValuation = await prisma.propertyValuation.create({
      data: {
        propertyId,
        estimatedValue: valuation.estimatedValue,
        rentEstimate: valuation.rentEstimate,
        lowEstimate: valuation.lowEstimate,
        highEstimate: valuation.highEstimate,
        confidenceScore: valuation.confidenceScore,
        comparables: valuation.comparables as unknown as object[],
        factors: valuation.factors as unknown as object,
      },
    });

    return NextResponse.json({
      ...savedValuation,
      cached: false,
    });
  } catch (error) {
    console.error('Valuation error:', error);
    return NextResponse.json({ error: 'Failed to calculate valuation' }, { status: 500 });
  }
}

// POST - Request fresh valuation
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const propertyId = params.id;

    // Force recalculate
    const valuation = await calculatePropertyValue(propertyId);

    // Save new valuation
    const savedValuation = await prisma.propertyValuation.create({
      data: {
        propertyId,
        estimatedValue: valuation.estimatedValue,
        rentEstimate: valuation.rentEstimate,
        lowEstimate: valuation.lowEstimate,
        highEstimate: valuation.highEstimate,
        confidenceScore: valuation.confidenceScore,
        comparables: valuation.comparables as unknown as object[],
        factors: valuation.factors as unknown as object,
      },
    });

    return NextResponse.json(savedValuation);
  } catch (error) {
    console.error('Valuation error:', error);
    return NextResponse.json({ error: 'Failed to calculate valuation' }, { status: 500 });
  }
}
