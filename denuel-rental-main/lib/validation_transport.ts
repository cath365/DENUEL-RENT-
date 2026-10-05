import { z } from 'zod';

export const transportEstimateSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  vehicleType: z.enum(['MOTORBIKE', 'CAR', 'SUV', 'VAN', 'TRUCK_SMALL', 'TRUCK_MEDIUM', 'TRUCK_LARGE']),
  badWeather: z.boolean().optional(),
});

export const transportRequestSchema = transportEstimateSchema.extend({
  bookingId: z.string().cuid().optional(),
  propertyId: z.string().cuid().optional(),
  pickupAddressText: z.string().trim().min(2).max(500),
  dropoffAddressText: z.string().trim().min(2).max(500),
});

const validationTransport = { transportEstimateSchema, transportRequestSchema };
export default validationTransport;
