import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import pricing from '../../../../lib/transport/pricing';

export async function POST(req: Request) {
  await requireAuth(req, ['USER', 'LANDLORD', 'AGENT', 'ADMIN', 'DRIVER']);
  const body = await req.json();
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, vehicleType } = body;
  if (typeof pickupLat !== 'number' || typeof pickupLng !== 'number' || typeof dropoffLat !== 'number' || typeof dropoffLng !== 'number') {
    return new Response('Invalid coordinates', { status: 400 });
  }
  const { distanceKm, durationMin } = await pricing.estimateDistanceAndDuration(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const calc = await pricing.calculatePrice({ vehicleType, distanceKm, durationMin, pickupAt: new Date(), badWeather: !!body.badWeather, pickupLat, pickupLng });

  return NextResponse.json({ distanceKm, durationMin, estimate: calc });
}
