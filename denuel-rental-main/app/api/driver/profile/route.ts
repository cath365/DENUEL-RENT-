import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth, requireRoleOrThrow } from '../../../../lib/auth';
import { z } from 'zod';

const CreateDriverSchema = z.object({
  licenseNumber: z.string().min(3),
  vehicleType: z.enum(['MOTORBIKE','CAR','VAN','TRUCK_SMALL','TRUCK_MEDIUM','TRUCK_LARGE']),
  vehiclePlate: z.string().min(1),
  vehicleCapacityKg: z.number().optional(),
});

const UpdateDriverSchema = CreateDriverSchema.partial();

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const profile = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    return NextResponse.json({ profile });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const parsed = CreateDriverSchema.parse(body);

    // prevent duplicate
    const existing = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (existing) return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });

    // create profile (isApproved false by default)
    const profile = await prisma.driverProfile.create({
      data: {
        userId: user.id,
        licenseNumber: parsed.licenseNumber,
        vehicleType: parsed.vehicleType,
        vehiclePlate: parsed.vehiclePlate,
        vehicleCapacityKg: parsed.vehicleCapacityKg ?? null,
        isApproved: false,
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth(req);
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
        vehicleCapacityKg: parsed.vehicleCapacityKg ?? profile.vehicleCapacityKg,
        // keep isApproved unchanged — admin must approve
      },
    });

    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 422 });
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}
