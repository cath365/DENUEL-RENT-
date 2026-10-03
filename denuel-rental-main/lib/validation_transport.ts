import { z } from 'zod';

export const transportEstimateSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  vehicleType: z.enum(['MOTORBIKE','CAR','VAN','TRUCK_SMALL','TRUCK_MEDIUM','TRUCK_LARGE']),
  badWeather: z.boolean().optional(),
});

export const transportRequestSchema = transportEstimateSchema.extend({
  bookingId: z.string().cuid().optional(),
  propertyId: z.string().cuid(),
  pickupAddressText: z.string().optional(),
  dropoffAddressText: z.string().optional(),
});

const validationTransport = { transportEstimateSchema, transportRequestSchema };
export default validationTransport;
