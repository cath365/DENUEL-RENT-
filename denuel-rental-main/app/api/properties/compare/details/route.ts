import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Compare properties side by side
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'Property IDs are required' }, { status: 400 });
    }

    const propertyIds = ids.split(',').slice(0, 4); // Max 4 properties

    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        valuations: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        priceHistory: {
          take: 5,
          orderBy: { date: 'desc' },
        },
      },
    });

    // Build comparison data
    const comparisonFields = [
      { key: 'price', label: 'Price', type: 'currency' },
      { key: 'deposit', label: 'Deposit', type: 'currency' },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
      { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
      { key: 'sizeSqm', label: 'Size (sqm)', type: 'number' },
      { key: 'yearBuilt', label: 'Year Built', type: 'number' },
      { key: 'propertyType', label: 'Property Type', type: 'text' },
      { key: 'furnished', label: 'Furnished', type: 'boolean' },
      { key: 'parkingSpaces', label: 'Parking Spaces', type: 'number' },
      { key: 'petsAllowed', label: 'Pets Allowed', type: 'boolean' },
      { key: 'internetAvailable', label: 'Internet', type: 'boolean' },
      { key: 'waterSource', label: 'Water Source', type: 'text' },
      { key: 'powerBackup', label: 'Power Backup', type: 'text' },
      { key: 'isShortStay', label: 'Short Stay', type: 'boolean' },
      { key: 'isStudentFriendly', label: 'Student Friendly', type: 'boolean' },
      { key: 'hoaFees', label: 'HOA Fees', type: 'currency' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'area', label: 'Area', type: 'text' },
    ];

    // Calculate score for each property (higher is better)
    const scoredProperties = properties.map((property) => {
      let score = 0;
      const avgPrice = properties.reduce((sum, p) => sum + p.price, 0) / properties.length;
      
      // Price score (lower is better for same specs)
      if (property.price < avgPrice) score += 10;
      
      // Feature scores
      if (property.furnished) score += 5;
      if (property.parkingSpaces > 0) score += property.parkingSpaces * 2;
      if (property.internetAvailable) score += 3;
      if (property.petsAllowed) score += 2;
      if (property.powerBackup !== 'NONE') score += 5;
      if (property.sizeSqm) score += Math.min(10, property.sizeSqm / 20);
      
      return {
        ...property,
        comparisonScore: score,
      };
    });

    // Rank properties
    const rankedProperties = scoredProperties
      .sort((a, b) => b.comparisonScore - a.comparisonScore)
      .map((p, index) => ({ ...p, rank: index + 1 }));

    return NextResponse.json({
      properties: rankedProperties,
      comparisonFields,
      summary: {
        lowestPrice: Math.min(...properties.map((p) => p.price)),
        highestPrice: Math.max(...properties.map((p) => p.price)),
        avgPrice: Math.round(properties.reduce((sum, p) => sum + p.price, 0) / properties.length),
        bestValue: rankedProperties[0]?.id,
      },
    });
  } catch (error) {
    console.error('Compare properties error:', error);
    return NextResponse.json({ error: 'Failed to compare properties' }, { status: 500 });
  }
}
