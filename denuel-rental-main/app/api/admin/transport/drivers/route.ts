import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/auth';
import prisma from '../../../../../lib/prisma';
import { publicServerError } from '../../../../../lib/publicError';

const REQUIRED_DRIVER_DOCS = ['NRC', 'LICENSE', 'CERTIFICATE', 'INSURANCE', 'BACKGROUND_CHECK'];

function isDriverApplicationDocument(doc: { metadata: string | null }) {
  if (!doc.metadata) return false;
  try {
    const metadata = JSON.parse(doc.metadata);
    return metadata?.source === 'driver_application';
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    await requireAuth(req, ['ADMIN']);

    const drivers = await prisma.driverProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            nrcNumber: true,
            isSuspended: true,
            verificationDocs: {
              orderBy: { submittedAt: 'desc' },
            },
          },
        },
        _count: {
          select: {
            TransportRequests: true,
            Ratings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = drivers.map((driver) => {
      const documents = driver.user.verificationDocs.filter(isDriverApplicationDocument);
      const requiredApproved = REQUIRED_DRIVER_DOCS.filter((type) =>
        documents.some((doc) => doc.documentType === type && doc.status === 'APPROVED')
      ).length;

      return {
        id: driver.id,
        userId: driver.userId,
        user: {
          id: driver.user.id,
          name: driver.user.name,
          email: driver.user.email,
          phone: driver.user.phone,
          profileImage: driver.user.profileImage,
          nrcNumberSupplied: Boolean(driver.user.nrcNumber),
        },
        licenseNumber: driver.licenseNumber,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        vehicleMake: driver.vehicleMake,
        vehicleModel: driver.vehicleModel,
        vehicleYear: driver.vehicleYear,
        vehicleColor: driver.vehicleColor,
        vehicleCapacityKg: driver.vehicleCapacityKg,
        serviceAreas: driver.serviceAreas,
        experience: driver.experience,
        bio: driver.bio,
        isApproved: driver.isApproved,
        isOnline: driver.isOnline,
        isSuspended: driver.user.isSuspended,
        ratingAvg: driver.ratingAvg,
        ratingCount: driver.ratingCount,
        totalTrips: driver._count.TransportRequests,
        documents,
        requiredApproved,
        requiredCount: REQUIRED_DRIVER_DOCS.length,
        status: driver.user.isSuspended
          ? 'SUSPENDED'
          : driver.isApproved
            ? 'APPROVED'
            : 'PENDING',
        createdAt: driver.createdAt,
      };
    });

    return NextResponse.json({ drivers: result });
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: error.status === 401 ? 'Unauthorized' : 'Forbidden' },
        { status: error.status }
      );
    }

    console.error('Admin driver list failed', error);
    const safe = publicServerError(error, 'Unable to load driver applications.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

export async function POST(req: Request) {
  try {
    await requireAuth(req, ['ADMIN']);
    const body = await req.json();
    const driverId = String(body.driverId || '');
    const action = String(body.action || '');

    if (!driverId || !['approve', 'suspend', 'activate'].includes(action)) {
      return NextResponse.json({ error: 'Invalid driver action.' }, { status: 400 });
    }

    const driver = await prisma.driverProfile.findUnique({
      where: { id: driverId },
      include: {
        user: {
          include: {
            verificationDocs: {
              orderBy: { submittedAt: 'desc' },
            },
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found.' }, { status: 404 });
    }

    if (action === 'approve') {
      const documents = driver.user.verificationDocs.filter(isDriverApplicationDocument);
      const missing = REQUIRED_DRIVER_DOCS.filter(
        (type) => !documents.some((doc) => doc.documentType === type && doc.status === 'APPROVED')
      );

      if (missing.length) {
        return NextResponse.json(
          {
            error: 'All required driver documents must be approved first.',
            missing,
          },
          { status: 400 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const profile = await tx.driverProfile.update({
          where: { id: driver.id },
          data: { isApproved: true },
        });
        await tx.user.update({
          where: { id: driver.userId },
          data: { isSuspended: false },
        });
        await tx.notification.create({
          data: {
            userId: driver.userId,
            type: 'APPLICATION_APPROVED',
            data: {
              title: 'Driver application approved',
              message: 'Your Ng’anda transport driver profile has been approved.',
            },
          },
        });
        return profile;
      });

      return NextResponse.json({ driver: updated, status: 'APPROVED' });
    }

    if (action === 'suspend') {
      await prisma.$transaction([
        prisma.driverProfile.update({
          where: { id: driver.id },
          data: { isOnline: false },
        }),
        prisma.user.update({
          where: { id: driver.userId },
          data: { isSuspended: true },
        }),
      ]);
      return NextResponse.json({ status: 'SUSPENDED' });
    }

    await prisma.user.update({
      where: { id: driver.userId },
      data: { isSuspended: false },
    });

    return NextResponse.json({ status: driver.isApproved ? 'APPROVED' : 'PENDING' });
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: error.status === 401 ? 'Unauthorized' : 'Forbidden' },
        { status: error.status }
      );
    }

    console.error('Admin driver action failed', error);
    const safe = publicServerError(error, 'Unable to update the driver application.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
