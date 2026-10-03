import { z } from 'zod';

export const propertyCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().nonnegative(),
  deposit: z.number().nonnegative().optional(),
  city: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  bedrooms: z.number().int().min(0).optional().default(1),
  bathrooms: z.number().int().min(0).optional().default(1),
});

export const bookingCreateSchema = z.object({
  propertyId: z.string().cuid(),
  startDate: z.string(),
  endDate: z.string(),
  amountZmw: z.number().int().min(0),
  depositZmw: z.number().int().min(0).optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupAddressText: z.string().optional(),
});

const validationRental = { propertyCreateSchema, bookingCreateSchema };
export default validationRental;
