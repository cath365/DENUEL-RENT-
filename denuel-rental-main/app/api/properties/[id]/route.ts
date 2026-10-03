import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { z } from 'zod';
import { requireAuth } from '../../../../lib/auth';

const NullableTextSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z.string().nullable().optional(),
);

const NullableUrlSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z.string().url().nullable().optional(),
);

const UpdateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  deposit: z.number().nonnegative().optional(),
  country: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  area: NullableTextSchema,
  addressText: NullableTextSchema,
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  sizeSqm: z.number().positive().nullable().optional(),
  furnished: z.boolean().optional(),
  parkingSpaces: z.number().int().min(0).optional(),
  petsAllowed: z.boolean().optional(),
  internetAvailable: z.boolean().optional(),
  waterSource: z.enum(['MUNICIPAL', 'BOREHOLE', 'WELL', 'TANK', 'OTHER']).optional(),
  powerBackup: z.enum(['NONE', 'SOLAR', 'INVERTER', 'GENERATOR', 'OTHER']).optional(),
  securityFeatures: z.array(z.string().min(1)).optional(),
  isShortStay: z.boolean().optional(),
  isStudentFriendly: z.boolean().optional(),
  virtualTourUrl: NullableUrlSchema,
  amenities: z.array(z.string().min(1)).optional(),
  rules: z.array(z.string().min(1)).optional(),
  images: z.array(z.string().url()).optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const prop = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        owner: { select: { id: true, name: true, phone: true, role: true } },
      },
    });
    if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ property: prop });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await requireAuth(req, ['LANDLORD', 'AGENT', 'ADMIN']);
    const { requireCsrf } = await import('../../../../lib/auth');
    requireCsrf(req);

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.ownerId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = UpdateSchema.parse(body);

    if (parsed.status && user.role !== 'ADMIN' && !['DRAFT', 'PENDING'].includes(parsed.status)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const rest = parsed as any;

      const data: any = { ...rest };
      if (Object.prototype.hasOwnProperty.call(parsed, 'area')) data.area = parsed.area;
      if (Object.prototype.hasOwnProperty.call(parsed, 'addressText')) data.addressText = parsed.addressText;
      if (Object.prototype.hasOwnProperty.call(parsed, 'virtualTourUrl')) data.virtualTourUrl = parsed.virtualTourUrl;

      await tx.property.update({ where: { id }, data });

      if (parsed.images) {
        await tx.propertyImage.deleteMany({ where: { propertyId: id } });
        if (parsed.images.length) {
          await tx.propertyImage.createMany({
            data: parsed.images.map((url, idx) => ({ propertyId: id, url, sortOrder: idx })),
          });
        }
      }

      return tx.property.findUnique({
        where: { id },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          owner: { select: { id: true, name: true, phone: true, role: true } },
        },
      });
    });

    return NextResponse.json({ property: updated });
  } catch (e: any) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.errors }, { status: 422 });
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const user = await requireAuth(req, ['LANDLORD', 'AGENT', 'ADMIN']);
    const { requireCsrf } = await import('../../../../lib/auth');
    requireCsrf(req);

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.ownerId !== user.id && user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { propertyId: id } }),
      prisma.propertyAvailability.deleteMany({ where: { propertyId: id } }),
      prisma.propertyView.deleteMany({ where: { propertyId: id } }),
      prisma.listingReport.deleteMany({ where: { propertyId: id } }),
      prisma.message.deleteMany({ where: { thread: { propertyId: id } } }),
      prisma.messageThread.deleteMany({ where: { propertyId: id } }),
      prisma.propertyImage.deleteMany({ where: { propertyId: id } }),
      prisma.property.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}

