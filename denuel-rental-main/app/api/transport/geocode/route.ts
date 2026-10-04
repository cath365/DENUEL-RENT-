import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['USER', 'LANDLORD', 'AGENT', 'ADMIN', 'DRIVER', 'SERVICE_PROVIDER'];

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ALLOWED_ROLES);

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();

    if (query.length < 3 || query.length > 256 || query.includes(';')) {
      return NextResponse.json({ error: 'Enter a valid Zambia address or place.' }, { status: 400 });
    }

    const token = process.env.MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Location search is not configured.' },
        { status: 503 }
      );
    }

    const url = new URL('https://api.mapbox.com/search/geocode/v6/forward');
    url.searchParams.set('q', query);
    url.searchParams.set('country', 'zm');
    url.searchParams.set('limit', '5');
    url.searchParams.set('autocomplete', 'true');
    url.searchParams.set('language', 'en');
    url.searchParams.set('access_token', token);

    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Unable to search for this location right now.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    const results = features
      .map((feature: any) => {
        const coordinates = feature?.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

        const longitude = Number(coordinates[0]);
        const latitude = Number(coordinates[1]);
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

        const properties = feature?.properties || {};
        const primary =
          properties.full_address ||
          [properties.name, properties.place_formatted].filter(Boolean).join(', ') ||
          feature?.place_name ||
          properties.name ||
          query;

        return {
          id: String(feature.id || properties.mapbox_id || primary),
          label: String(primary),
          latitude,
          longitude,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Transport geocoding error:', error);
    return NextResponse.json({ error: 'Unable to search for this location.' }, { status: 500 });
  }
}
