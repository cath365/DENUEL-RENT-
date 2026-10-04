import { NextResponse } from 'next/server';
import pricing from '../../../../lib/transport/pricing';
import { publicServerError } from '../../../../lib/publicError';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType, scheduledAt } = body;

    if (
      typeof pickupLat !== 'number' ||
      typeof pickupLng !== 'number' ||
      typeof dropoffLat !== 'number' ||
      typeof dropoffLng !== 'number' ||
      !vehicleType
    ) {
      return NextResponse.json({ error: 'Valid route coordinates and vehicle type are required.' }, { status: 400 });
    }

    const { distanceKm, durationMin } = await pricing.estimateDistanceAndDuration(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng
    );

    const pickupAt = scheduledAt ? new Date(scheduledAt) : new Date();
    const calc = await pricing.calculatePrice({
      vehicleType,
      distanceKm,
      durationMin,
      pickupAt: Number.isNaN(pickupAt.getTime()) ? new Date() : pickupAt,
      badWeather: false,
      pickupLat,
      pickupLng,
    });

    return NextResponse.json({ distanceKm, durationMin, estimate: calc });
  } catch (error) {
    console.error('Transport estimate failed', error);

    const message = error instanceof Error ? error.message : '';
    if (message === 'ROUTING_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Route estimates are not configured yet.' }, { status: 503 });
    }
    if (message === 'ROUTING_UNAVAILABLE' || message === 'ROUTE_NOT_FOUND') {
      return NextResponse.json({ error: 'A route could not be calculated for those locations.' }, { status: 422 });
    }
    if (message.includes('No pricing rule configured')) {
      return NextResponse.json({ error: 'Pricing has not been configured for this vehicle type yet.' }, { status: 409 });
    }

    const safe = publicServerError(error, 'Unable to calculate a transport estimate right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
