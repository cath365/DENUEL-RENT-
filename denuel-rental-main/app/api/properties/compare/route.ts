import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get user's property comparisons
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comparisons = await prisma.propertyComparison.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch property details for each comparison
    const comparisonsWithProperties = await Promise.all(
      comparisons.map(async (comparison) => {
        const propertyIds = comparison.propertyIds as string[];
        const properties = await prisma.property.findMany({
          where: { id: { in: propertyIds } },
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
          },
        });
        return {
          ...comparison,
          properties,
        };
      })
    );

    return NextResponse.json(comparisonsWithProperties);
  } catch (error) {
    console.error('Fetch comparisons error:', error);
    return NextResponse.json({ error: 'Failed to fetch comparisons' }, { status: 500 });
  }
}

// POST - Create a new comparison
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, propertyIds } = body;

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 property IDs are required' },
        { status: 400 }
      );
    }

    if (propertyIds.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 properties can be compared' },
        { status: 400 }
      );
    }

    // Verify all properties exist
    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
    });

    if (properties.length !== propertyIds.length) {
      return NextResponse.json(
        { error: 'One or more properties not found' },
        { status: 404 }
      );
    }

    const comparison = await prisma.propertyComparison.create({
      data: {
        userId: user.id,
        name: name || `Comparison ${new Date().toLocaleDateString()}`,
        propertyIds,
      },
    });

    return NextResponse.json(comparison, { status: 201 });
  } catch (error) {
    console.error('Create comparison error:', error);
    return NextResponse.json({ error: 'Failed to create comparison' }, { status: 500 });
  }
}
