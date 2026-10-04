import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
import pricing from '../../../../lib/transport/pricing';
import hub from '../../../../lib/transport/realtime';
import { publicServerError } from '../../../../lib/publicError';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req, ['USER', 'DRIVER', 'LANDLORD', 'AGENT', 'ADMIN']);
    const body = await req.json();

    const {
      bookingId,
      propertyId,
      pickupLat,
      pickupLng,
      pickupAddressText,
      dropoffLat,
      dropoffLng,
      dropoffAddressText,
      vehicleType,
      scheduledAt,
    } = body;

    if (
      typeof pickupLat !== 'number' ||
      typeof pickupLng !== 'number' ||
      typeof dropoffLat !== 'number' ||
      typeof dropoffLng !== 'number' ||
      !pickupAddressText ||
      !dropoffAddressText ||
      !vehicleType
    ) {
      return NextResponse.json({ error: 'Pickup, drop-off and vehicle type are required.' }, { status: 400 });
    }

    if (propertyId) {
      const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
      if (!property) {
        return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
      }
    }

    const pickupAt = scheduledAt ? new Date(scheduledAt) : new Date();
    if (Number.isNaN(pickupAt.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduled date or time.' }, { status: 400 });
    }

    const { distanceKm, durationMin } = await pricing.estimateDistanceAndDuration(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng
    );

    const calc = await pricing.calculatePrice({
      vehicleType,
      distanceKm,
      durationMin,
      pickupAt,
      badWeather: false,
      pickupLat,
      pickupLng,
    });

    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

    const tr = await prisma.transportRequest.create({
      data: {
        bookingId: bookingId || null,
        tenantId: user.id,
        propertyId: propertyId || null,
        pickupLat,
        pickupLng,
        pickupAddressText,
        dropoffLat,
        dropoffLng,
        dropoffAddressText,
        vehicleType,
        distanceKmEstimated: distanceKm,
        durationMinEstimated: durationMin,
        priceEstimateZmw: calc.finalPrice,
        lockedPriceZmw: calc.finalPrice,
        pricingBreakdown: calc as any,
        priceLockedAt: new Date(),
        scheduledAt,
        status: 'REQUESTED',
        expiresAt,
      },
    });

    await prisma.pricingAudit.create({
      data: {
        transportRequestId: tr.id,
        inputs: calc.inputs as any,
        breakdown: { components: calc.components, multipliers: calc.multipliers } as any,
        rawPrice: calc.components.rawPrice,
        finalPrice: calc.finalPrice,
        reason: calc.multipliers.surge.applied ? 'Surge applied' : undefined,
      },
    });

    const drivers = await prisma.driverProfile.findMany({
      where: { isApproved: true, isOnline: true, vehicleType },
    });

    const toRad = (v: number) => (v * Math.PI) / 180;
    const driversWithDist = drivers
      .map((driver) => {
        if (driver.currentLat == null || driver.currentLng == null) {
          return { driver, dist: Infinity };
        }

        const R = 6371;
        const dLat = toRad(driver.currentLat - pickupLat);
        const dLon = toRad(driver.currentLng - pickupLng);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(pickupLat)) *
            Math.cos(toRad(driver.currentLat)) *
            Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return { driver, dist: R * c };
      })
      .sort((a, b) => a.dist - b.dist);

    for (const radius of [5, 10, 20]) {
      const driverIds = driversWithDist
        .filter((item) => item.dist <= radius)
        .slice(0, 20)
        .map((item) => item.driver.userId);

      if (driverIds.length) {
        hub.notifyDrivers(driverIds, 'transport_request', {
          requestId: tr.id,
          pickupLat,
          pickupLng,
          pickupAddressText,
          priceEstimateZmw: tr.lockedPriceZmw,
          scheduledAt: tr.scheduledAt,
        });
      }
    }

    return NextResponse.json(
      {
        id: tr.id,
        estimate: calc,
        distanceKm,
        durationMin,
        scheduledAt: tr.scheduledAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Transport request failed', error);

    if (error instanceof Response) {
      return NextResponse.json(
        { error: error.status === 401 ? 'Sign in to book transport.' : 'You are not allowed to create this request.' },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : '';
    if (message.includes('No pricing rule configured')) {
      return NextResponse.json({ error: 'Pricing has not been configured for this vehicle type yet.' }, { status: 409 });
    }
    if (message === 'ROUTING_NOT_CONFIGURED') {
      return NextResponse.json({ error: 'Route estimates are not configured yet.' }, { status: 503 });
    }

    const safe = publicServerError(error, 'Unable to create the transport request right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
