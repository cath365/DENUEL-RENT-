import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { z } from 'zod';

const BoolSchema = z.preprocess((v) => {
  if (v === undefined) return undefined;
  if (typeof v === 'string') {
    const lower = v.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  return v;
}, z.boolean().optional());

const QuerySchema = z.object({
  q: z.string().optional(),
  listingType: z.enum(['RENT', 'SALE', 'BOTH']).optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  minLat: z.coerce.number().optional(),
  minLng: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  propertyType: z.string().optional(),
  amenities: z.string().optional(), // comma-separated
  furnished: BoolSchema,
  petsAllowed: BoolSchema,
  petFriendly: BoolSchema,
  hasParking: BoolSchema,
  internetAvailable: BoolSchema,
  isShortStay: BoolSchema,
  isStudentFriendly: BoolSchema,
  waterSource: z.enum(['MUNICIPAL', 'BOREHOLE', 'WELL', 'TANK', 'OTHER']).optional(),
  powerBackup: z.enum(['NONE', 'SOLAR', 'INVERTER', 'GENERATOR', 'OTHER']).optional(),
  parkingMin: z.coerce.number().optional(),
  sort: z.enum(['relevance', 'newest', 'price-asc', 'price-desc']).default('relevance'),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(20),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.parse(Object.fromEntries(url.searchParams));

    const where: any = { status: 'APPROVED' };

    // Filter by listing type (RENT, SALE, or BOTH)
    if (parsed.listingType) {
      where.OR = [
        { listingType: parsed.listingType },
        { listingType: 'BOTH' }
      ];
    }

    if (parsed.q) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { title: { contains: parsed.q, mode: 'insensitive' } },
          { description: { contains: parsed.q, mode: 'insensitive' } },
          { city: { contains: parsed.q, mode: 'insensitive' } },
          { area: { contains: parsed.q, mode: 'insensitive' } },
        ]
      });
    }

    if (parsed.city) where.city = { contains: parsed.city, mode: 'insensitive' };
    if (parsed.area) where.area = { contains: parsed.area, mode: 'insensitive' };

    if (parsed.priceMin || parsed.priceMax) {
      where.price = {};
      if (parsed.priceMin) where.price.gte = parsed.priceMin;
      if (parsed.priceMax) where.price.lte = parsed.priceMax;
    }

    if (parsed.bedrooms !== undefined) where.bedrooms = { gte: parsed.bedrooms };
    if (parsed.bathrooms !== undefined) where.bathrooms = { gte: parsed.bathrooms };
    if (parsed.propertyType) where.propertyType = parsed.propertyType.toUpperCase();

    if (parsed.furnished !== undefined) where.furnished = parsed.furnished;
    if (parsed.petsAllowed !== undefined) where.petsAllowed = parsed.petsAllowed;
    if (parsed.petFriendly !== undefined) where.petsAllowed = parsed.petFriendly;
    if (parsed.hasParking) where.parkingSpaces = { gt: 0 };
    if (parsed.internetAvailable !== undefined) where.internetAvailable = parsed.internetAvailable;
    if (parsed.isShortStay !== undefined) where.isShortStay = parsed.isShortStay;
    if (parsed.isStudentFriendly !== undefined) where.isStudentFriendly = parsed.isStudentFriendly;
    if (parsed.waterSource) where.waterSource = parsed.waterSource;
    if (parsed.powerBackup) where.powerBackup = parsed.powerBackup;
    if (parsed.parkingMin !== undefined) where.parkingSpaces = { gte: parsed.parkingMin };

    if (parsed.amenities) {
      const am = parsed.amenities.split(',').map((s) => s.trim()).filter(Boolean);
      where.AND = am.map((a) => ({ amenities: { has: a } }));
    }

    if (parsed.minLat !== undefined && parsed.maxLat !== undefined && parsed.minLng !== undefined && parsed.maxLng !== undefined) {
      where.latitude = { gte: parsed.minLat, lte: parsed.maxLat };
      where.longitude = { gte: parsed.minLng, lte: parsed.maxLng };
    }

    const skip = (parsed.page - 1) * parsed.pageSize;

    const orderBy: any = [];
    if (parsed.sort === 'newest') orderBy.push({ createdAt: 'desc' });
    else if (parsed.sort === 'price-asc') orderBy.push({ price: 'asc' });
    else if (parsed.sort === 'price-desc') orderBy.push({ price: 'desc' });
    else orderBy.push({ isFeatured: 'desc' }, { createdAt: 'desc' });

    const [total, items] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where, skip, take: parsed.pageSize, orderBy,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          owner: { select: { id: true, name: true, phone: true, isIdVerified: true, isBusinessVerified: true } },
        },
      }),
    ]);

    return NextResponse.json({ total, page: parsed.page, pageSize: parsed.pageSize, items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

