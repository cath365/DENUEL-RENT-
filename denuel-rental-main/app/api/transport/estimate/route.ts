import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import pricing from '../../../../lib/transport/pricing';
import { transportEstimateSchema } from '../../../../lib/validation_transport';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['USER', 'LANDLORD', 'AGENT', 'ADMIN', 'DRIVER', 'SERVICE_PROVIDER']);

    const body = await req.json();
    const parsed = transportEstimateSchema.parse(body);

    const { distanceKm, durationMin } = await pricing.estimateDistanceAndDuration(
      parsed.pickupLat,
      parsed.pickupLng,
      parsed.dropoffLat,
      parsed.dropoffLng,
    );

    const estimate = await pricing.calculatePrice({
      vehicleType: parsed.vehicleType,
      distanceKm,
      durationMin,
      pickupAt: new Date(),
      badWeather: Boolean(parsed.badWeather),
      pickupLat: parsed.pickupLat,
      pickupLng: parsed.pickupLng,
    });

    return NextResponse.json({ distanceKm, durationMin, estimate });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    if (String(error?.message || '').includes('No pricing rule configured')) {
      return NextResponse.json(
        { error: 'Pricing is not configured for this vehicle type yet.' },
        { status: 409 }
      );
    }
    console.error('Transport estimate error:', error);
    return NextResponse.json({ error: 'Unable to calculate transport estimate' }, { status: 500 });
  }
}
