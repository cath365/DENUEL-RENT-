import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const now = new Date();

    const [
      applications,
      leases,
      payments,
      savedProperties,
      savedSearches,
      unreadNotifications,
      transportRequests,
    ] = await Promise.all([
      prisma.application.findMany({
        where: { userId: user.id },
        orderBy: { appliedAt: 'desc' },
        take: 20,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              area: true,
              price: true,
              status: true,
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      }),
      prisma.leaseAgreement.findMany({
        where: { tenantId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              addressText: true,
              city: true,
              area: true,
            },
          },
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.rentPayment.findMany({
        where: { tenantId: user.id },
        orderBy: { dueDate: 'asc' },
        take: 50,
        include: {
          lease: {
            select: {
              id: true,
              property: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.favorite.count({ where: { userId: user.id } }),
      prisma.savedSearch.count({ where: { userId: user.id } }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
      prisma.transportRequest.findMany({
        where: { tenantId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          pickupAddressText: true,
          dropoffAddressText: true,
          lockedPriceZmw: true,
          priceEstimateZmw: true,
          createdAt: true,
        },
      }),
    ]);

    const activeLeases = leases.filter((lease) => lease.status === 'ACTIVE');
    const pendingPayments = payments.filter(
      (payment) => payment.status === 'PENDING' || payment.status === 'PARTIAL'
    );
    const overduePayments = pendingPayments.filter(
      (payment) => new Date(payment.dueDate) < now
    );
    const amountDue = pendingPayments.reduce(
      (sum, payment) =>
        sum +
        Number(payment.amount || 0) +
        Number(payment.lateFee || 0),
      0
    );

    const activeTransport = transportRequests.filter((request) =>
      [
        'REQUESTED',
        'SEARCHING',
        'DRIVER_ASSIGNED',
        'DRIVER_ARRIVING',
        'IN_PROGRESS',
      ].includes(request.status)
    );

    return NextResponse.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      stats: {
        applications: applications.length,
        pendingApplications: applications.filter(
          (application) => application.status === 'PENDING'
        ).length,
        activeLeases: activeLeases.length,
        pendingPayments: pendingPayments.length,
        overduePayments: overduePayments.length,
        amountDue,
        savedProperties,
        savedSearches,
        unreadNotifications,
        activeTransport: activeTransport.length,
      },
      applications,
      leases,
      payments,
      transportRequests,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Renter overview error:', error);
    return NextResponse.json(
      { error: 'Unable to load renter overview' },
      { status: 500 }
    );
  }
}
