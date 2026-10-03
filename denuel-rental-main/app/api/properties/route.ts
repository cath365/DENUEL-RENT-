import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { requireAuth } from '../../../lib/auth';

const QuerySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
  ownerId: z.string().optional(),
  listingType: z.enum(['RENT', 'SALE', 'BOTH']).optional(),
  propertyType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minBedrooms: z.coerce.number().optional(),
  maxBedrooms: z.coerce.number().optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(12),
});

const UrlSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().url().optional(),
);

const ImageSchema = z.union([
  z.string().url(), // Legacy: just URL string
  z.object({
    url: z.string().url(),
    is360: z.boolean().optional().default(false),
    roomName: z.string().optional(),
  }),
]);

const CreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  deposit: z.number().nonnegative().optional(),
  listingType: z.enum(['RENT', 'SALE', 'BOTH']).default('RENT'),
  country: z.string().min(2).optional(),
  city: z.string().min(2),
  area: z.string().min(1).optional(),
  addressText: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  sizeSqm: z.number().positive().optional(),
  furnished: z.boolean().optional(),
  parkingSpaces: z.number().int().min(0).optional(),
  petsAllowed: z.boolean().optional(),
  internetAvailable: z.boolean().optional(),
  waterSource: z.enum(['MUNICIPAL', 'BOREHOLE', 'WELL', 'TANK', 'OTHER']).optional(),
  powerBackup: z.enum(['NONE', 'SOLAR', 'INVERTER', 'GENERATOR', 'OTHER']).optional(),
  securityFeatures: z.array(z.string().min(1)).optional(),
  isShortStay: z.boolean().optional(),
  isStudentFriendly: z.boolean().optional(),
  virtualTourUrl: UrlSchema,
  amenities: z.array(z.string().min(1)).optional(),
  rules: z.array(z.string().min(1)).optional(),
  images: z.array(ImageSchema).optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.parse(Object.fromEntries(url.searchParams));

    const where: any = {};
    if (parsed.q) {
      where.OR = [
        { title: { contains: parsed.q, mode: 'insensitive' } },
        { description: { contains: parsed.q, mode: 'insensitive' } },
        { city: { contains: parsed.q, mode: 'insensitive' } },
        { area: { contains: parsed.q, mode: 'insensitive' } },
        { addressText: { contains: parsed.q, mode: 'insensitive' } },
      ];
    }
    if (parsed.city) where.city = { contains: parsed.city, mode: 'insensitive' };
    if (parsed.area) where.area = { contains: parsed.area, mode: 'insensitive' };
    if (parsed.ownerId) where.ownerId = parsed.ownerId;
    if (parsed.status) where.status = parsed.status;
    if (parsed.listingType) {
      where.listingType = parsed.listingType === 'BOTH' ? { in: ['RENT', 'SALE', 'BOTH'] } : { in: [parsed.listingType, 'BOTH'] };
    }
    if (parsed.propertyType) where.propertyType = parsed.propertyType;
    if (parsed.minPrice || parsed.maxPrice) {
      where.price = {};
      if (parsed.minPrice) where.price.gte = parsed.minPrice;
      if (parsed.maxPrice) where.price.lte = parsed.maxPrice;
    }
    if (parsed.minBedrooms) where.bedrooms = { gte: parsed.minBedrooms };

    const skip = (parsed.page - 1) * parsed.pageSize;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    if (parsed.sortBy === 'price_asc') orderBy = { price: 'asc' };
    else if (parsed.sortBy === 'price_desc') orderBy = { price: 'desc' };
    else if (parsed.sortBy === 'popular') orderBy = { viewCount: 'desc' };

    const [total, items] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: parsed.pageSize,
        orderBy,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          owner: { select: { id: true, name: true, phone: true, role: true } },
        },
      }),
    ]);

    return NextResponse.json({ total, page: parsed.page, pageSize: parsed.pageSize, items, properties: items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'AGENT', 'ADMIN']);
    const { requireCsrf } = await import('../../../lib/auth');
    requireCsrf(req);

    const body = await req.json();
    const parsed = CreateSchema.parse(body);

    const prop = await prisma.property.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        price: parsed.price,
        deposit: parsed.deposit,
        listingType: parsed.listingType,
        country: parsed.country || 'Zambia',
        city: parsed.city,
        area: parsed.area,
        addressText: parsed.addressText,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        bedrooms: parsed.bedrooms,
        bathrooms: parsed.bathrooms,
        sizeSqm: parsed.sizeSqm,
        furnished: parsed.furnished ?? false,
        parkingSpaces: parsed.parkingSpaces ?? 0,
        petsAllowed: parsed.petsAllowed ?? false,
        internetAvailable: parsed.internetAvailable ?? false,
        waterSource: parsed.waterSource,
        powerBackup: parsed.powerBackup,
        securityFeatures: parsed.securityFeatures || [],
        isShortStay: parsed.isShortStay ?? false,
        isStudentFriendly: parsed.isStudentFriendly ?? false,
        virtualTourUrl: parsed.virtualTourUrl,
        amenities: parsed.amenities || [],
        rules: parsed.rules || [],
        ownerId: user.id,
        status: 'APPROVED', // Auto-approve properties for immediate visibility
        images: parsed.images?.length ? { 
          create: parsed.images.map((img, idx) => {
            // Handle both legacy string URLs and new image objects
            const isString = typeof img === 'string';
            return {
              url: isString ? img : img.url,
              sortOrder: idx,
              is360: isString ? false : (img.is360 ?? false),
              roomName: isString ? undefined : img.roomName,
            };
          }) 
        } : undefined,
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json({ id: prop.id, property: prop }, { status: 201 });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 422 });
    if (e instanceof Response) return e;
    console.error('Property creation error:', e);
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

