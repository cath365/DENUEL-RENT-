import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../../lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const VehicleTypeSchema = z.enum([
  'MOTORBIKE',
  'CAR',
  'SUV',
  'VAN',
  'TRUCK_SMALL',
  'TRUCK_MEDIUM',
  'TRUCK_LARGE',
]);

const CreateDriverSchema = z.object({
  licenseNumber: z.string().trim().min(3),
  nrcNumber: z.string().trim().min(5),
  vehicleType: VehicleTypeSchema,
  vehiclePlate: z.string().trim().min(2),
  vehicleMake: z.string().trim().min(2),
  vehicleModel: z.string().trim().min(1),
  vehicleYear: z.number().int().min(1980).max(new Date().getFullYear() + 1),
  vehicleColor: z.string().trim().min(2),
  vehicleCapacityKg: z.number().int().nonnegative().optional(),
  experience: z.string().trim().min(2),
  bio: z.string().trim().max(3000).optional(),
  serviceAreas: z.array(z.string().trim().min(1)).min(1),
});

const UpdateDriverSchema = CreateDriverSchema.partial();

function safeDocuments(documents: any[]) {
  return documents.map(({ fileUrl, ...document }) => ({
    ...document,
    fileAccessUrl: '/api/driver/documents/' + document.id + '/file',
    storagePrivate: Boolean(fileUrl?.includes('.private.blob.vercel-storage.com')),
  }));
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req, ['DRIVER']);
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            isSuspended: true,
          },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      profile: profile
        ? {
            ...profile,
            documents: safeDocuments(profile.documents),
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Driver profile fetch error:', error);
    return NextResponse.json({ error: 'Unable to load driver profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req, ['DRIVER']);
    requireCsrf(req);

    const body = await req.json();
    const parsed = CreateDriverSchema.parse(body);

    const existing = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (existing) {
      return NextResponse.json({ error: 'Driver profile already exists' }, { status: 409 });
    }

    const profile = await prisma.driverProfile.create({
      data: {
        userId: user.id,
        licenseNumber: parsed.licenseNumber,
        nrcNumber: parsed.nrcNumber,
        vehicleType: parsed.vehicleType,
        vehiclePlate: parsed.vehiclePlate.toUpperCase(),
        vehicleMake: parsed.vehicleMake,
        vehicleModel: parsed.vehicleModel,
        vehicleYear: parsed.vehicleYear,
        vehicleColor: parsed.vehicleColor,
        vehicleCapacityKg: parsed.vehicleCapacityKg ?? null,
        experience: parsed.experience,
        bio: parsed.bio || null,
        serviceAreas: parsed.serviceAreas,
        verificationStatus: 'PENDING',
        rejectionReason: null,
        isApproved: false,
        isOnline: false,
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error('Driver profile create error:', error);
    return NextResponse.json({ error: error?.message || 'Unable to create driver profile' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth(req, ['DRIVER']);
    requireCsrf(req);

    const body = await req.json();
    const parsed = UpdateDriverSchema.parse(body);

    const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const sensitiveChange =
      parsed.licenseNumber !== undefined ||
      parsed.nrcNumber !== undefined ||
      parsed.vehicleType !== undefined ||
      parsed.vehiclePlate !== undefined ||
      parsed.vehicleMake !== undefined ||
      parsed.vehicleModel !== undefined ||
      parsed.vehicleYear !== undefined ||
      parsed.vehicleColor !== undefined;

    const updated = await prisma.driverProfile.update({
      where: { id: profile.id },
      data: {
        ...parsed,
        vehiclePlate: parsed.vehiclePlate ? parsed.vehiclePlate.toUpperCase() : undefined,
        serviceAreas: parsed.serviceAreas,
        ...(sensitiveChange
          ? {
              isApproved: false,
              isOnline: false,
              verificationStatus: 'PENDING',
              rejectionReason: null,
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            isSuspended: true,
          },
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      profile: {
        ...updated,
        documents: safeDocuments(updated.documents),
      },
    });
  } catch (error: any) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error('Driver profile update error:', error);
    return NextResponse.json({ error: error?.message || 'Unable to update driver profile' }, { status: 400 });
  }
}
