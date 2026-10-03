import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get driver profile
    const driver = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get trip counts using correct field name: assignedDriverId
    const [
      totalTrips,
      todayTrips,
      weekTrips,
      completedTrips,
      canceledTrips,
    ] = await Promise.all([
      prisma.transportRequest.count({
        where: { assignedDriverId: driver.id },
      }),
      prisma.transportRequest.count({
        where: {
          assignedDriverId: driver.id,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.transportRequest.count({
        where: {
          assignedDriverId: driver.id,
          createdAt: { gte: weekStart },
        },
      }),
      prisma.transportRequest.count({
        where: {
          assignedDriverId: driver.id,
          status: 'COMPLETED',
        },
      }),
      prisma.transportRequest.count({
        where: {
          assignedDriverId: driver.id,
          status: 'CANCELED',
        },
      }),
    ]);

    // Get earnings from DriverEarning table
    const earnings = await prisma.driverEarning.aggregate({
      where: {
        driverId: driver.id,
      },
      _sum: {
        netZmw: true,
      },
    });

    const todayEarnings = await prisma.driverEarning.aggregate({
      where: {
        driverId: driver.id,
        createdAt: { gte: todayStart },
      },
      _sum: {
        netZmw: true,
      },
    });

    const weekEarnings = await prisma.driverEarning.aggregate({
      where: {
        driverId: driver.id,
        createdAt: { gte: weekStart },
      },
      _sum: {
        netZmw: true,
      },
    });

    // Get average rating from Rating table
    const ratings = await prisma.rating.aggregate({
      where: {
        driverId: driver.id,
      },
      _avg: {
        stars: true,
      },
      _count: {
        stars: true,
      },
    });

    // Calculate acceptance rate
    const totalAssigned = await prisma.transportRequest.count({
      where: { assignedDriverId: driver.id },
    });
    const accepted = await prisma.transportRequest.count({
      where: {
        assignedDriverId: driver.id,
        status: { in: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'IN_PROGRESS', 'COMPLETED'] },
      },
    });
    const acceptanceRate = totalAssigned > 0 ? (accepted / totalAssigned) * 100 : 100;

    // Calculate completion rate
    const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 100;

    return NextResponse.json({
      driver: {
        id: driver.id,
        name: driver.user.name,
        email: driver.user.email,
        image: driver.user.profileImage,
        vehicleType: driver.vehicleType,
        vehiclePlate: driver.vehiclePlate,
        isOnline: driver.isOnline,
        isApproved: driver.isApproved,
      },
      stats: {
        totalTrips,
        todayTrips,
        weekTrips,
        completedTrips,
        canceledTrips,
        totalEarnings: earnings._sum.netZmw || 0,
        todayEarnings: todayEarnings._sum.netZmw || 0,
        weekEarnings: weekEarnings._sum.netZmw || 0,
        averageRating: ratings._avg.stars || 0,
        totalRatings: ratings._count.stars || 0,
        acceptanceRate: Math.round(acceptanceRate),
        completionRate: Math.round(completionRate),
      },
    });
  } catch (error) {
    console.error('Failed to fetch driver stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch driver stats' },
      { status: 500 }
    );
  }
}
