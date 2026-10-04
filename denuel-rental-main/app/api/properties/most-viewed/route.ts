import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { publicServerError } from '../../../../lib/publicError';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const requestedLimit = Number(url.searchParams.get('limit') || 8);
    const limit = Math.min(Math.max(Math.floor(requestedLimit) || 8, 1), 12);

    // One row per property + privacy-safe visitor signature.
    // This makes viewerCount a real unique-viewer count rather than raw page hits.
    const uniqueViews = await prisma.propertyView.groupBy({
      by: ['propertyId', 'ip'],
      where: {
        ip: { not: '' },
        property: {
          status: 'APPROVED',
        },
      },
    });

    const counts = new Map<string, number>();

    for (const view of uniqueViews) {
      counts.set(
        view.propertyId,
        (counts.get(view.propertyId) || 0) + 1
      );
    }

    const rankedIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([propertyId]) => propertyId);

    if (rankedIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const properties = await prisma.property.findMany({
      where: {
        id: { in: rankedIds },
        status: 'APPROVED',
      },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
        owner: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
    });

    const byId = new Map(
      properties.map((property) => [property.id, property])
    );

    const items = rankedIds
      .map((id) => {
        const property = byId.get(id);
        if (!property) return null;

        return {
          ...property,
          viewerCount: counts.get(id) || 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Most viewed properties failed', error);
    const safe = publicServerError(
      error,
      'Unable to load most viewed properties.'
    );

    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
