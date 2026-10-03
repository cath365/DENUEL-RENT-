import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
import pricing from '../../../../lib/transport/pricing';
import hub from '../../../../lib/transport/realtime';

export async function POST(req: Request) {
  const user = await requireAuth(req, ['USER', 'DRIVER', 'LANDLORD', 'AGENT', 'ADMIN']);
  const body = await req.json();
  const {
    bookingId, propertyId, pickupLat, pickupLng, pickupAddressText,
    dropoffLat, dropoffLng, dropoffAddressText, vehicleType, badWeather
  } = body;

  if (!propertyId || typeof pickupLat !== 'number' || typeof pickupLng !== 'number') {
    return new Response('Invalid payload', { status: 400 });
  }

  const { distanceKm, durationMin } = await pricing.estimateDistanceAndDuration(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const calc = await pricing.calculatePrice({ vehicleType, distanceKm, durationMin, pickupAt: new Date(), badWeather: !!badWeather, pickupLat, pickupLng });

  const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

  const tr = await prisma.transportRequest.create({ data: {
    bookingId: bookingId || null,
    tenantId: user.id,
    propertyId,
    pickupLat,
    pickupLng,
    pickupAddressText: pickupAddressText || '',
    dropoffLat,
    dropoffLng,
    dropoffAddressText: dropoffAddressText || '',
    vehicleType,
    distanceKmEstimated: distanceKm,
    durationMinEstimated: durationMin,
    priceEstimateZmw: calc.finalPrice,
    lockedPriceZmw: calc.finalPrice,
    pricingBreakdown: calc as any,
    priceLockedAt: new Date(),
    status: 'REQUESTED',
    expiresAt
  }});

  // create pricing audit entry for transparency
  await prisma.pricingAudit.create({ data: {
    transportRequestId: tr.id,
    inputs: calc.inputs as any,
    breakdown: { components: calc.components, multipliers: calc.multipliers } as any,
    rawPrice: calc.components.rawPrice,
    finalPrice: calc.finalPrice,
    reason: calc.multipliers.surge.applied ? 'Surge applied' : undefined
  }});

  // find matching drivers
  const drivers = await prisma.driverProfile.findMany({ where: { isApproved: true, isOnline: true, vehicleType } });

  // compute distances and sort
  const driversWithDist = drivers.map(d => {
    if (d.currentLat == null || d.currentLng == null) return { d, dist: Infinity };
    const toRad = (v:number)=>v*Math.PI/180;
    const R=6371; const dLat=toRad(d.currentLat - pickupLat); const dLon=toRad(d.currentLng - pickupLng);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(pickupLat))*Math.cos(toRad(d.currentLat))*Math.sin(dLon/2)**2;
    const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const km = R*c;
    return { d, dist: km };
  }).sort((a,b)=>a.dist-b.dist);

  // notify in batches: 5km, 10km, 20km
  const batches = [5,10,20];
  for (const radius of batches) {
    const batch = driversWithDist.filter(x=>x.dist<=radius).slice(0,20).map(x=>x.d.userId);
    if (batch.length) {
      hub.notifyDrivers(batch, 'transport_request', { requestId: tr.id, pickupLat, pickupLng, pickupAddressText, priceEstimateZmw: tr.lockedPriceZmw });
    }
  }

  return new Response(JSON.stringify({ id: tr.id, estimate: calc }), { status: 201, headers: { 'Content-Type': 'application/json' } });
}
