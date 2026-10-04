import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'AGENT', 'ADMIN']);

    const properties = await prisma.property.findMany({
      where: { ownerId: user.id },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const propertyIds = properties.map((property) => property.id);

    const [
      viewRows,
      applications,
      viewings,
      leases,
      rentPayments,
      maintenance,
      messageThreads,
      screenings,
    ] = await Promise.all([
      propertyIds.length
        ? prisma.propertyView.findMany({
            where: {
              propertyId: { in: propertyIds },
              ip: { not: '' },
            },
            select: {
              propertyId: true,
              ip: true,
            },
          })
        : Promise.resolve([]),

      prisma.application.findMany({
        where: {
          property: { ownerId: user.id },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profileImage: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isIdVerified: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              area: true,
              status: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
      }),

      prisma.viewingAppointment.findMany({
        where: {
          property: { ownerId: user.id },
        },
        include: {
          visitor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profileImage: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              area: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
      }),

      prisma.leaseAgreement.findMany({
        where: { landlordId: user.id },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              area: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.rentPayment.findMany({
        where: {
          lease: { landlordId: user.id },
        },
        include: {
          lease: {
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              property: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),

      prisma.maintenanceRequest.findMany({
        where: { landlordId: user.id },
        include: {
          property: {
            select: {
              id: true,
              title: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.messageThread.findMany({
        where: {
          property: { ownerId: user.id },
          messages: { some: {} },
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              companyName: true,
              profileImage: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              city: true,
              area: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.tenantScreening.findMany({
        where: { landlordId: user.id },
        include: {
          applicant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const viewerSets = new Map<string, Set<string>>();

    for (const view of viewRows) {
      if (!viewerSets.has(view.propertyId)) {
        viewerSets.set(view.propertyId, new Set());
      }
      viewerSets.get(view.propertyId)!.add(view.ip);
    }

    const propertiesWithViewers = properties.map((property) => ({
      ...property,
      viewerCount: viewerSets.get(property.id)?.size || 0,
    }));

    const mostViewedProperties = [...propertiesWithViewers]
      .filter((property) => property.status === 'APPROVED')
      .sort((a, b) => {
        if (b.viewerCount !== a.viewerCount) {
          return b.viewerCount - a.viewerCount;
        }
        return Number(b.saveCount || 0) - Number(a.saveCount || 0);
      })
      .slice(0, 6);

    const uniqueViewerPairs = new Set(
      viewRows.map((view) => view.propertyId + ':' + view.ip)
    );

    const now = new Date();

    const pendingApplications = applications.filter(
      (application) => application.status === 'PENDING'
    );

    const upcomingViewings = viewings.filter((viewing) => {
      const scheduledAt = new Date(viewing.scheduledAt);
      return (
        scheduledAt >= now &&
        ['PENDING', 'CONFIRMED'].includes(viewing.status)
      );
    });

    const activeLeases = leases.filter(
      (lease) => lease.status === 'ACTIVE'
    );

    const outstandingPayments = rentPayments.filter((payment) =>
      ['PENDING', 'LATE', 'PARTIAL'].includes(payment.status)
    );

    const outstandingRentAmount = outstandingPayments.reduce(
      (sum, payment) =>
        sum +
        Number(payment.amount || 0) +
        Math.max(0, Number(payment.lateFee || 0)),
      0
    );

    const rentCollected = rentPayments
      .filter((payment) => payment.status === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const openMaintenance = maintenance.filter((request) =>
      ['OPEN', 'IN_PROGRESS', 'SCHEDULED'].includes(request.status)
    );

    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
        thread: {
          property: { ownerId: user.id },
        },
      },
    });

    const recentMessages = messageThreads
      .map((thread) => ({
        ...thread,
        lastMessage: thread.messages[0] || null,
      }))
      .filter((thread) => Boolean(thread.lastMessage))
      .sort(
        (a, b) =>
          new Date(b.lastMessage!.createdAt).getTime() -
          new Date(a.lastMessage!.createdAt).getTime()
      )
      .slice(0, 5);

    return NextResponse.json({
      stats: {
        totalProperties: properties.length,
        approvedProperties: properties.filter(
          (property) => property.status === 'APPROVED'
        ).length,
        pendingProperties: properties.filter(
          (property) => property.status === 'PENDING'
        ).length,
        uniquePropertyViewers: uniqueViewerPairs.size,
        totalSaves: properties.reduce(
          (sum, property) => sum + Number(property.saveCount || 0),
          0
        ),
        pendingApplications: pendingApplications.length,
        upcomingViewings: upcomingViewings.length,
        activeLeases: activeLeases.length,
        outstandingRentAmount,
        rentCollected,
        openMaintenance: openMaintenance.length,
        unreadMessages,
        pendingScreenings: screenings.filter(
          (screening) => screening.status === 'PENDING'
        ).length,
      },
      mostViewedProperties,
      recentProperties: propertiesWithViewers.slice(0, 5),
      recentApplications: applications.slice(0, 5),
      upcomingViewings: upcomingViewings.slice(0, 5),
      recentMessages,
      outstandingPayments: outstandingPayments.slice(0, 5),
      openMaintenance: openMaintenance.slice(0, 5),
      activeLeases: activeLeases.slice(0, 5),
    });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Landlord dashboard failed', error);
    const safe = publicServerError(
      error,
      'Unable to load the landlord dashboard right now.'
    );

    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
