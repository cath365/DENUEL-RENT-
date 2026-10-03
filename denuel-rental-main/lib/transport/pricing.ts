import prisma from "../prisma";

export type PricingCalculation = {
  inputs: {
    vehicleType: string;
    distanceKm: number;
    durationMin: number;
    pickupAt?: string | null;
    badWeather?: boolean;
  };
  components: {
    base: number;
    distanceCost: number;
    timeCost: number;
    rawPrice: number;
  };
  multipliers: {
    surge: { value: number; applied: boolean; reason?: string };
    night: { value: number; applied: boolean; reason?: string };
    weather: { value: number; applied: boolean; reason?: string };
    totalMultiplier: number;
  };
  finalPrice: number;
};

function toRad(v: number) { return v * Math.PI / 180; }

function isNightHour(date: Date, nightStart: number, nightEnd: number) {
  const h = date.getHours();
  if (nightStart <= nightEnd) return h >= nightStart && h < nightEnd;
  // overnight window (e.g., 21 -> 5)
  return h >= nightStart || h < nightEnd;
}

async function getSettings() {
  const s = await prisma.transportSettings.findFirst();
  if (s) return s;
  // defaults if not configured
  return {
    surgeEnabled: true,
    maxSurgeMultiplier: 1.3,
    maxNightMultiplier: 1.15,
    maxWeatherMultiplier: 1.1,
    nightStartHour: 21,
    nightEndHour: 5,
    surgeWindowMinutes: 5,
    surgeMinDelta: 1,
  } as any;
}

export async function estimateDistanceAndDuration(pickupLat: number, pickupLng: number, dropLat: number, dropLng: number) {
  const R = 6371; // km
  const dLat = toRad(dropLat - pickupLat);
  const dLon = toRad(dropLng - pickupLng);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(pickupLat)) * Math.cos(toRad(dropLat)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceKm = R * c;
  const speedKmh = 40;
  const durationMin = Math.max(1, Math.round((distanceKm / speedKmh) * 60));
  return { distanceKm, durationMin };
}

export async function calculatePrice(params: {
  vehicleType: string;
  distanceKm: number;
  durationMin: number;
  pickupLat?: number;
  pickupLng?: number;
  pickupAt?: Date;
  badWeather?: boolean;
}) : Promise<PricingCalculation> {
  const { vehicleType, distanceKm, durationMin, pickupAt, badWeather, pickupLat, pickupLng } = params;
  const rule = await prisma.pricingRule.findFirst({ where: { vehicleType: vehicleType as any, isActive: true } });
  if (!rule) throw new Error('No pricing rule configured for vehicle type');

  const settings = await getSettings();

  const base = rule.baseFareZmw;
  const distanceCost = Math.round(distanceKm * rule.perKmZmw);
  const timeCost = Math.round(durationMin * rule.perMinZmw);
  const rawPrice = base + distanceCost + timeCost;

  // Surge decision: only if enabled and nearby demand exceeds supply for configured window
  let surgeValue = 1;
  let surgeApplied = false;
  let surgeReason: string | undefined;
  if (settings.surgeEnabled && pickupLat != null && pickupLng != null) {
    // determine nearby drivers and recent requests
    const drivers = await prisma.driverProfile.findMany({ where: { isApproved: true, isOnline: true } });
    const nearbyDrivers = drivers.filter(d => d.currentLat != null && d.currentLng != null).filter(d => {
      const dLat = toRad((d.currentLat as number) - pickupLat);
      const dLon = toRad((d.currentLng as number) - pickupLng);
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(pickupLat as number))*Math.cos(toRad(d.currentLat as number))*Math.sin(dLon/2)**2;
      const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const km = 6371 * c;
      return km <= 5; // initial local radius
    });

    const windowAgo = new Date(Date.now() - (settings.surgeWindowMinutes || 5) * 60 * 1000);
    const recentRequests = await prisma.transportRequest.findMany({ where: { createdAt: { gte: windowAgo } } });
    const nearbyRequests = recentRequests.filter(r => {
      const dLat = toRad(r.pickupLat - (pickupLat as number));
      const dLon = toRad(r.pickupLng - (pickupLng as number));
      const a = Math.sin(dLat/2)**2 + Math.cos(toRad(pickupLat as number))*Math.cos(toRad(r.pickupLat))*Math.sin(dLon/2)**2;
      const c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const km = 6371 * c;
      return km <= 5;
    });

    if (nearbyRequests.length > nearbyDrivers.length && (nearbyRequests.length - nearbyDrivers.length) >= (settings.surgeMinDelta || 1)) {
      surgeValue = Math.min(Number(rule.surgeMultiplier ?? 1), Number(settings.maxSurgeMultiplier || 1.3));
      surgeApplied = surgeValue > 1;
      surgeReason = 'High local demand';
    }
  }

  // Night multiplier
  let nightValue = 1;
  let nightApplied = false;
  let nightReason: string | undefined;
  if (pickupAt) {
    if (isNaN(pickupAt.getTime()) === false) {
      const nightStart = settings.nightStartHour ?? 21;
      const nightEnd = settings.nightEndHour ?? 5;
      if (isNightHour(pickupAt, nightStart, nightEnd)) {
        nightValue = Math.min(Number(rule.nightMultiplier ?? 1), Number(settings.maxNightMultiplier || 1.15));
        nightApplied = nightValue > 1;
        nightReason = 'Night service rate';
      }
    }
  }

  // Weather multiplier
  let weatherValue = 1;
  let weatherApplied = false;
  let weatherReason: string | undefined;
  if (badWeather) {
    weatherValue = Math.min(Number(rule.weatherMultiplier ?? 1), Number(settings.maxWeatherMultiplier || 1.1));
    weatherApplied = weatherValue > 1;
    weatherReason = 'Severe weather';
  }

  const totalMultiplier = surgeValue * nightValue * weatherValue;
  let finalPriceRaw = Math.round(rawPrice * totalMultiplier);
  const minFare = Number(rule.minimumFareZmw ?? 0);
  if (finalPriceRaw < minFare) finalPriceRaw = minFare;

  const calc: PricingCalculation = {
    inputs: { vehicleType, distanceKm, durationMin, pickupAt: pickupAt ? pickupAt.toISOString() : null, badWeather: !!badWeather },
    components: { base, distanceCost, timeCost, rawPrice },
    multipliers: {
      surge: { value: surgeValue, applied: surgeApplied, reason: surgeApplied ? surgeReason : undefined },
      night: { value: nightValue, applied: nightApplied, reason: nightApplied ? nightReason : undefined },
      weather: { value: weatherValue, applied: weatherApplied, reason: weatherApplied ? weatherReason : undefined },
      totalMultiplier
    },
    finalPrice: finalPriceRaw,
  };

  return calc;
}

const transportPricing = { calculatePrice, estimateDistanceAndDuration };
export default transportPricing;
