import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../../lib/auth';
import { publicServerError } from '../../../../lib/publicError';
import { z } from 'zod';

const DriverDocumentSchema = z.object({
  type: z.string().min(1),
  url: z.string().url(),
  name: z.string().min(1),
});

const CreateDriverSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(5),
  nrcNumber: z.string().min(3),
  licenseNumber: z.string().min(3),
  vehicleType: z.enum(['MOTORBIKE','CAR','SUV','VAN','TRUCK_SMALL','TRUCK_MEDIUM','TRUCK_LARGE']),
  vehiclePlate: z.string().min(1),
  vehicleMake: z.string().min(1),
  vehicleModel: z.string().min(1),
  vehicleYear: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  vehicleColor: z.string().min(1).optional(),
  vehicleCapacityKg: z.number().nonnegative().optional(),
  serviceAreas: z.array(z.string()).default([]),
  experience: z.string().optional(),
  bio: z.string().optional(),
  documents: z.array(DriverDocumentSchema).default([]),
});

const UpdateDriverSchema = CreateDriverSchema.omit({ documents: true }).partial();

function mapDocumentType(type: string) {
  const normalized = type.toLowerCase();
  if (normalized === 'nrc') return 'NRC';
  if (normalized === 'license') return 'LICENSE';
  if (normalized === 'insurance') return 'INSURANCE';
  if (normalized === 'clearance') return 'BACKGROUND_CHECK';
  if (normalized === 'vehicle_reg') return 'CERTIFICATE';
  return 'OTHER';
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status });
    }
    const safe = publicServerError(error, 'Unable to load the driver profile.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);
    const body = await req.json();
    const parsed = CreateDriverSchema.parse(body);

    const existing = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (existing) return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });

    const profile = await prisma.$transaction(async (tx) => {
      const created = await tx.driverProfile.create({
        data: {
          userId: user.id,
          licenseNumber: parsed.licenseNumber,
          vehicleType: parsed.vehicleType,
          vehiclePlate: parsed.vehiclePlate,
          vehicleMake: parsed.vehicleMake,
          vehicleModel: parsed.vehicleModel,
          vehicleYear: parsed.vehicleYear ?? null,
          vehicleColor: parsed.vehicleColor ?? null,
          vehicleCapacityKg: parsed.vehicleCapacityKg ?? null,
          serviceAreas: parsed.serviceAreas as any,
          experience: parsed.experience ?? null,
          bio: parsed.bio ?? null,
          isApproved: false,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          name: parsed.fullName,
          phone: parsed.phone,
          nrcNumber: parsed.nrcNumber,
          ...(user.role === 'USER' ? { role: 'DRIVER' as any } : {}),
        },
      });

      for (const document of parsed.documents) {
        await tx.verificationDocument.create({
          data: {
            userId: user.id,
            documentType: mapDocumentType(document.type) as any,
            documentUrl: document.url,
            status: 'PENDING',
            metadata: JSON.stringify({
              source: 'driver_application',
              originalName: document.name,
              driverProfileId: created.id,
              vehicleRegistration: document.type.toLowerCase() === 'vehicle_reg',
            }),
          },
        });
      }

      return created;
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ error: 'Sign in before applying as a driver.' }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid application details' }, { status: 422 });
    }

    console.error('Driver application failed', error);
    const safe = publicServerError(error, 'Unable to submit the driver application.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);
    const body = await req.json();
    const parsed = UpdateDriverSchema.parse(body);

    const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const updated = await prisma.driverProfile.update({
      where: { id: profile.id },
      data: {
        licenseNumber: parsed.licenseNumber ?? profile.licenseNumber,
        vehicleType: parsed.vehicleType ?? profile.vehicleType,
        vehiclePlate: parsed.vehiclePlate ?? profile.vehiclePlate,
        vehicleMake: parsed.vehicleMake ?? profile.vehicleMake,
        vehicleModel: parsed.vehicleModel ?? profile.vehicleModel,
        vehicleYear: parsed.vehicleYear ?? profile.vehicleYear,
        vehicleColor: parsed.vehicleColor ?? profile.vehicleColor,
        vehicleCapacityKg: parsed.vehicleCapacityKg ?? profile.vehicleCapacityKg,
        ...(parsed.serviceAreas !== undefined ? { serviceAreas: parsed.serviceAreas as any } : {}),
        experience: parsed.experience ?? profile.experience,
        bio: parsed.bio ?? profile.bio,
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid profile details' }, { status: 422 });
    }

    const safe = publicServerError(error, 'Unable to update the driver profile.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
