import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCsrf } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
import pricing from '../../../../lib/transport/pricing';
import hub from '../../../../lib/transport/realtime';
import { transportRequestSchema } from '../../../../lib/validation_transport';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

function toRad(value: number) {
  return value * Math.PI / 180;
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['USER', 'DRIVER', 'LANDLORD', 'AGENT', 'ADMIN', 'SERVICE_PROVIDER']);
    requireCsrf(req);

    const parsed = transportRequestSchema.parse(await req.json());

    if (parsed.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: parsed.propertyId },
        select: { id: true },
      });
      if (!property) {
        return NextResponse.json({ error: 'Linked property not found' }, { status: 404 });
      }
    }

    const { distanceKm: estimatedDistance, durationMin } =
      await pricing.estimateDistanceAndDuration(
        parsed.pickupLat,
        parsed.pickupLng,
        parsed.dropoffLat,
        parsed.dropoffLng,
      );

    const estimate = await pricing.calculatePrice({
      vehicleType: parsed.vehicleType,
      distanceKm: estimatedDistance,
      durationMin,
      pickupAt: new Date(),
      badWeather: Boolean(parsed.badWeather),
      pickupLat: parsed.pickupLat,
      pickupLng: parsed.pickupLng,
    });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const transportRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.transportRequest.create({
        data: {
          bookingId: parsed.bookingId || null,
          tenantId: user.id,
          propertyId: parsed.propertyId || null,
          pickupLat: parsed.pickupLat,
          pickupLng: parsed.pickupLng,
          pickupAddressText: parsed.pickupAddressText,
          dropoffLat: parsed.dropoffLat,
          dropoffLng: parsed.dropoffLng,
          dropoffAddressText: parsed.dropoffAddressText,
          vehicleType: parsed.vehicleType,
          distanceKmEstimated: estimatedDistance,
          durationMinEstimated: durationMin,
          priceEstimateZmw: estimate.finalPrice,
          lockedPriceZmw: estimate.finalPrice,
          pricingBreakdown: estimate as any,
          priceLockedAt: new Date(),
          status: 'REQUESTED',
          expiresAt,
        },
      });

      await tx.pricingAudit.create({
        data: {
          transportRequestId: created.id,
          inputs: estimate.inputs as any,
          breakdown: {
            components: estimate.components,
            multipliers: estimate.multipliers,
          } as any,
          rawPrice: estimate.components.rawPrice,
          finalPrice: estimate.finalPrice,
          reason: estimate.multipliers.surge.applied ? 'Surge applied' : undefined,
        },
      });

      return created;
    });

    const drivers = await prisma.driverProfile.findMany({
      where: {
        isApproved: true,
        isOnline: true,
        verificationStatus: 'VERIFIED',
        vehicleType: parsed.vehicleType,
        user: {
          isSuspended: false,
        },
      },
      select: {
        userId: true,
        currentLat: true,
        currentLng: true,
      },
    });

    const nearestDriverIds = drivers
      .filter(
        (driver) =>
          typeof driver.currentLat === 'number' &&
          typeof driver.currentLng === 'number',
      )
      .map((driver) => ({
        userId: driver.userId,
        distance: distanceKm(
          parsed.pickupLat,
          parsed.pickupLng,
          Number(driver.currentLat),
          Number(driver.currentLng),
        ),
      }))
      .filter((driver) => driver.distance <= 20)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20)
      .map((driver) => driver.userId);

    if (nearestDriverIds.length) {
      hub.notifyDrivers(nearestDriverIds, 'transport_request', {
        requestId: transportRequest.id,
        pickupLat: parsed.pickupLat,
        pickupLng: parsed.pickupLng,
        pickupAddressText: parsed.pickupAddressText,
        priceEstimateZmw: transportRequest.lockedPriceZmw,
      });
    }

    return NextResponse.json(
      {
        id: transportRequest.id,
        status: transportRequest.status,
        expiresAt: transportRequest.expiresAt,
        estimate: {
          distanceKm: estimatedDistance,
          durationMin,
          ...estimate,
        },
        notifiedDrivers: nearestDriverIds.length,
      },
      { status: 201 },
    );
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
    console.error('Transport request error:', error);
    return NextResponse.json({ error: 'Unable to create transport request' }, { status: 500 });
  }
}
