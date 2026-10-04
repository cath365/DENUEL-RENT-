import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { z } from 'zod';
import { requireAuth } from '../../../../lib/auth';
import { publicServerError } from '../../../../lib/publicError';

const NullableTextSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().nullable().optional(),
);

const NullableUrlSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().url().nullable().optional(),
);

const UpdateSchema = z.object({
  title: z.string().trim().min(3).optional(),
  description: z.string().trim().min(20).optional(),
  propertyType: z.enum([
    'APARTMENT',
    'HOUSE',
    'DUPLEX',
    'STUDIO',
    'ROOM',
    'OFFICE',
    'SHOP',
    'WAREHOUSE',
    'LAND',
    'COMMERCIAL',
    'OTHER',
  ]).optional(),
  listingType: z.enum(['RENT', 'SALE', 'BOTH']).optional(),
  price: z.number().positive().optional(),
  deposit: z.number().nonnegative().nullable().optional(),
  country: z.string().trim().min(2).optional(),
  city: z.string().trim().min(2).optional(),
  area: NullableTextSchema,
  addressText: NullableTextSchema,
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
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
  images: z.array(z.string().url()).min(1, 'At least one real property image is required.').optional(),
});

async function getViewer(req: Request) {
  try {
    return await requireAuth(req);
  } catch {
    return null;
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        owner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    if (property.status !== 'APPROVED') {
      const viewer = await getViewer(req);
      const canSeePrivateListing =
        viewer && (viewer.id === property.ownerId || viewer.role === 'ADMIN');

      if (!canSeePrivateListing) {
        return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
      }
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error('Property lookup failed', error);
    const safe = publicServerError(error, 'Unable to load this property right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'AGENT', 'ADMIN']);
    const { requireCsrf } = await import('../../../../lib/auth');
    requireCsrf(req);

    const existing = await prisma.property.findUnique({
      where: { id: params.id },
      include: { images: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    if (existing.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You cannot edit this property.' }, { status: 403 });
    }

    const parsed = UpdateSchema.parse(await req.json());

    const { images, ...scalarFields } = parsed;

    const updated = await prisma.$transaction(async (tx) => {
      const data: any = {
        ...scalarFields,
      };

      if (user.role !== 'ADMIN') {
        // Any owner/agent edit requires a fresh review before the listing is public again.
        data.status = 'PENDING';
        data.rejectionReason = null;
      }

      if (Object.prototype.hasOwnProperty.call(parsed, 'area')) {
        data.area = parsed.area;
      }
      if (Object.prototype.hasOwnProperty.call(parsed, 'addressText')) {
        data.addressText = parsed.addressText;
      }
      if (Object.prototype.hasOwnProperty.call(parsed, 'virtualTourUrl')) {
        data.virtualTourUrl = parsed.virtualTourUrl;
      }
      if (Object.prototype.hasOwnProperty.call(parsed, 'deposit')) {
        data.deposit = parsed.deposit;
      }

      await tx.property.update({
        where: { id: params.id },
        data,
      });

      if (images) {
        await tx.propertyImage.deleteMany({
          where: { propertyId: params.id },
        });

        await tx.propertyImage.createMany({
          data: images.map((url, index) => ({
            propertyId: params.id,
            url,
            sortOrder: index,
          })),
        });
      }

      return tx.property.findUnique({
        where: { id: params.id },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          owner: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      property: updated,
      message:
        user.role === 'ADMIN'
          ? 'Property updated.'
          : 'Changes saved and submitted for admin review.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Please check the property details.' },
        { status: 422 }
      );
    }
    if (error instanceof Response) return error;

    console.error('Property update failed', error);
    const safe = publicServerError(error, 'Unable to update this property right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'AGENT', 'ADMIN']);
    const { requireCsrf } = await import('../../../../lib/auth');
    requireCsrf(req);

    const existing = await prisma.property.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    if (existing.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'You cannot delete this property.' }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.favorite.deleteMany({ where: { propertyId: params.id } }),
      prisma.propertyAvailability.deleteMany({ where: { propertyId: params.id } }),
      prisma.propertyView.deleteMany({ where: { propertyId: params.id } }),
      prisma.listingReport.deleteMany({ where: { propertyId: params.id } }),
      prisma.message.deleteMany({ where: { thread: { propertyId: params.id } } }),
      prisma.messageThread.deleteMany({ where: { propertyId: params.id } }),
      prisma.propertyImage.deleteMany({ where: { propertyId: params.id } }),
      prisma.property.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Property deletion failed', error);
    const safe = publicServerError(error, 'Unable to delete this property right now.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
