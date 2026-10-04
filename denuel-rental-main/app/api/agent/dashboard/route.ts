import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

export const dynamic = 'force-dynamic';

function latestDate(values: Array<Date | string | null | undefined>) {
  const times = values
    .filter(Boolean)
    .map((value) => new Date(value as any).getTime())
    .filter(Number.isFinite);

  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['AGENT']);

    const [
      profile,
      properties,
      applications,
      viewings,
      threads,
      leases,
      reviews,
      transactions,
      verificationDocs,
    ] = await Promise.all([
      prisma.agentProfile.findUnique({
        where: { userId: user.id },
      }),
      prisma.property.findMany({
        where: { ownerId: user.id },
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.application.findMany({
        where: { property: { ownerId: user.id } },
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
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
      }),
      prisma.viewingAppointment.findMany({
        where: { property: { ownerId: user.id } },
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
        orderBy: { scheduledAt: 'desc' },
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
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.agentReview.findMany({
        where: { agent: { userId: user.id } },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.agentTransaction.findMany({
        where: { agent: { userId: user.id } },
        orderBy: { closedAt: 'desc' },
      }),
      prisma.verificationDocument.findMany({
        where: { userId: user.id },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    const propertyIds = properties.map((property) => property.id);

    const viewRows = propertyIds.length
      ? await prisma.propertyView.findMany({
          where: {
            propertyId: { in: propertyIds },
            ip: { not: '' },
          },
          select: {
            propertyId: true,
            ip: true,
          },
        })
      : [];

    const viewerSets = new Map<string, Set<string>>();
    for (const row of viewRows) {
      if (!viewerSets.has(row.propertyId)) {
        viewerSets.set(row.propertyId, new Set());
      }
      viewerSets.get(row.propertyId)!.add(row.ip);
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

    const clientMap = new Map<string, any>();

    function ensureClient(person: any) {
      if (!person?.id) return null;
      if (!clientMap.has(person.id)) {
        clientMap.set(person.id, {
          id: person.id,
          name: person.name || null,
          email: person.email || null,
          phone: person.phone || null,
          profileImage: person.profileImage || null,
          isEmailVerified: Boolean(person.isEmailVerified),
          isPhoneVerified: Boolean(person.isPhoneVerified),
          isIdVerified: Boolean(person.isIdVerified),
          applications: 0,
          viewings: 0,
          conversations: 0,
          leases: 0,
          propertyIds: new Set<string>(),
          lastActivityAt: null as string | null,
        });
      }
      return clientMap.get(person.id);
    }

    for (const application of applications) {
      const client = ensureClient(application.user);
      if (!client) continue;
      client.applications += 1;
      client.propertyIds.add(application.propertyId);
      client.lastActivityAt = latestDate([
        client.lastActivityAt,
        application.appliedAt,
      ]);
    }

    for (const viewing of viewings) {
      const client = ensureClient(viewing.visitor);
      if (!client) continue;
      client.viewings += 1;
      client.propertyIds.add(viewing.propertyId);
      client.lastActivityAt = latestDate([
        client.lastActivityAt,
        viewing.updatedAt,
        viewing.createdAt,
      ]);
    }

    for (const thread of threads) {
      if (!thread.client) continue;
      const client = ensureClient(thread.client);
      if (!client) continue;
      client.conversations += 1;
      client.propertyIds.add(thread.propertyId);
      client.lastActivityAt = latestDate([
        client.lastActivityAt,
        thread.messages[0]?.createdAt,
        thread.createdAt,
      ]);
    }

    for (const lease of leases) {
      const client = ensureClient(lease.tenant);
      if (!client) continue;
      client.leases += 1;
      client.propertyIds.add(lease.propertyId);
      client.lastActivityAt = latestDate([
        client.lastActivityAt,
        lease.updatedAt,
        lease.createdAt,
      ]);
    }

    const clients = Array.from(clientMap.values())
      .map((client) => ({
        ...client,
        propertyIds: Array.from(client.propertyIds),
      }))
      .sort(
        (a, b) =>
          new Date(b.lastActivityAt || 0).getTime() -
          new Date(a.lastActivityAt || 0).getTime()
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

    const now = new Date();
    const upcomingViewings = viewings.filter(
      (viewing) =>
        new Date(viewing.scheduledAt) >= now &&
        ['PENDING', 'CONFIRMED'].includes(viewing.status)
    );

    const rating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    const approvedDocs = verificationDocs.filter(
      (doc) => doc.status === 'APPROVED'
    ).length;
    const pendingDocs = verificationDocs.filter(
      (doc) => doc.status === 'PENDING'
    ).length;

    const profileFields = profile
      ? [
          profile.bio,
          Array.isArray(profile.specialties) && profile.specialties.length > 0,
          Array.isArray(profile.areasServed) && profile.areasServed.length > 0,
          profile.yearsExperience !== null && profile.yearsExperience !== undefined,
          Array.isArray(profile.languages) && profile.languages.length > 0,
          profile.profilePhotoUrl,
        ]
      : [];

    const profileCompletion =
      profileFields.length > 0
        ? Math.round(
            (profileFields.filter(Boolean).length / profileFields.length) * 100
          )
        : 0;

    return NextResponse.json({
      agent: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        companyName: user.companyName,
        profileImage: user.profileImage,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isIdVerified: user.isIdVerified,
        isBusinessVerified: user.isBusinessVerified,
        trustScore: user.trustScore,
      },
      profile,
      profileCompletion,
      verification: {
        approvedDocuments: approvedDocs,
        pendingDocuments: pendingDocs,
      },
      stats: {
        totalProperties: properties.length,
        approvedProperties: properties.filter((property) => property.status === 'APPROVED').length,
        pendingProperties: properties.filter((property) => property.status === 'PENDING').length,
        uniqueViewers: new Set(viewRows.map((row) => row.propertyId + ':' + row.ip)).size,
        totalSaves: properties.reduce((sum, property) => sum + Number(property.saveCount || 0), 0),
        pendingApplications: applications.filter((application) => application.status === 'PENDING').length,
        upcomingViewings: upcomingViewings.length,
        unreadMessages,
        activeLeases: leases.filter((lease) => lease.status === 'ACTIVE').length,
        clients: clients.length,
        rating: Number(rating.toFixed(1)),
        reviews: reviews.length,
        recordedTransactions: transactions.length,
        recordedTransactionValue: transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
      },
      mostViewedProperties,
      recentProperties: propertiesWithViewers.slice(0, 6),
      recentApplications: applications.slice(0, 5),
      upcomingViewings: upcomingViewings.slice(0, 5),
      recentThreads: threads
        .filter((thread) => thread.messages[0])
        .slice(0, 5)
        .map((thread) => ({
          ...thread,
          lastMessage: thread.messages[0],
        })),
      clients,
      recentReviews: reviews.slice(0, 5),
      recordedTransactions: transactions.slice(0, 10),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Agent dashboard failed', error);
    const safe = publicServerError(error, 'Unable to load the agent workspace.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
