import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCsrf } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

function safeDocuments(documents: any[]) {
  return documents.map(({ fileUrl, ...document }) => ({
    ...document,
    fileAccessUrl: '/api/driver/documents/' + document.id + '/file',
    storagePrivate: Boolean(fileUrl?.includes('.private.blob.vercel-storage.com')),
  }));
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'all').toLowerCase();
    const q = searchParams.get('q')?.trim();

    const where: any = {};

    if (status === 'pending') {
      where.isApproved = false;
      where.verificationStatus = 'PENDING';
      where.user = { isSuspended: false };
    } else if (status === 'approved') {
      where.isApproved = true;
      where.user = { isSuspended: false };
    } else if (status === 'rejected') {
      where.verificationStatus = 'REJECTED';
    } else if (status === 'suspended') {
      where.user = { isSuspended: true };
    }

    if (q) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { licenseNumber: { contains: q } },
            { vehiclePlate: { contains: q } },
            { vehicleMake: { contains: q } },
            { vehicleModel: { contains: q } },
            { user: { name: { contains: q } } },
            { user: { email: { contains: q } } },
            { user: { phone: { contains: q } } },
          ],
        },
      ];
    }

    const drivers = await prisma.driverProfile.findMany({
      where,
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
        _count: {
          select: {
            TransportRequests: true,
            Ratings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const allDrivers = await prisma.driverProfile.findMany({
      select: {
        isApproved: true,
        verificationStatus: true,
        user: {
          select: { isSuspended: true },
        },
      },
    });

    return NextResponse.json({
      drivers: drivers.map((driver) => ({
        id: driver.id,
        userId: driver.userId,
        user: driver.user,
        licenseNumber: driver.licenseNumber,
        nrcNumber: driver.nrcNumber,
        vehicleType: driver.vehicleType,
        vehicleMake: driver.vehicleMake,
        vehicleModel: driver.vehicleModel,
        vehicleYear: driver.vehicleYear,
        vehicleColor: driver.vehicleColor,
        vehiclePlate: driver.vehiclePlate,
        vehicleCapacityKg: driver.vehicleCapacityKg,
        experience: driver.experience,
        bio: driver.bio,
        serviceAreas: Array.isArray(driver.serviceAreas) ? driver.serviceAreas : [],
        verificationStatus: driver.verificationStatus,
        rejectionReason: driver.rejectionReason,
        status: driver.user.isSuspended
          ? 'SUSPENDED'
          : driver.isApproved
            ? 'APPROVED'
            : driver.verificationStatus === 'REJECTED'
              ? 'REJECTED'
              : 'PENDING',
        rating: driver.ratingAvg,
        ratingCount: driver.ratingCount,
        totalTrips: driver._count.TransportRequests,
        isOnline: driver.isOnline,
        verified: driver.isApproved && driver.verificationStatus === 'VERIFIED',
        documents: safeDocuments(driver.documents),
        createdAt: driver.createdAt,
      })),
      stats: {
        total: allDrivers.length,
        pending: allDrivers.filter(
          (driver) =>
            !driver.isApproved &&
            !driver.user.isSuspended &&
            driver.verificationStatus === 'PENDING'
        ).length,
        approved: allDrivers.filter(
          (driver) => driver.isApproved && !driver.user.isSuspended
        ).length,
        rejected: allDrivers.filter(
          (driver) => driver.verificationStatus === 'REJECTED'
        ).length,
        suspended: allDrivers.filter((driver) => driver.user.isSuspended).length,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin drivers fetch error:', error);
    return NextResponse.json({ error: 'Unable to load drivers' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);
    requireCsrf(req);

    const body = await req.json();
    const driverId = String(body.driverId || '');
    const action = String(body.action || '');

    if (!driverId || !['suspend', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Valid driverId and action are required' }, { status: 400 });
    }

    const driver = await prisma.driverProfile.findUnique({
      where: { id: driverId },
      select: { id: true, userId: true, isApproved: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const suspend = action === 'suspend';

    await prisma.$transaction([
      prisma.user.update({
        where: { id: driver.userId },
        data: { isSuspended: suspend },
      }),
      prisma.driverProfile.update({
        where: { id: driver.id },
        data: {
          isOnline: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      status: suspend ? 'SUSPENDED' : driver.isApproved ? 'APPROVED' : 'PENDING',
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin driver status update error:', error);
    return NextResponse.json({ error: 'Unable to update driver status' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Direct driver approval is disabled. Use the verified approval workflow.' },
    { status: 405 }
  );
}
