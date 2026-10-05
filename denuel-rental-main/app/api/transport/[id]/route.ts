import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = ['USER', 'LANDLORD', 'AGENT', 'ADMIN', 'DRIVER', 'SERVICE_PROVIDER'];

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req, ALLOWED_ROLES);
    const id = params.id;

    let transportRequest = await prisma.transportRequest.findUnique({
      where: { id },
      include: {
        assignedDriver: {
          select: {
            userId: true,
          },
        },
        Rating: {
          select: {
            id: true,
            stars: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!transportRequest) {
      return NextResponse.json({ error: 'Transport request not found' }, { status: 404 });
    }

    const isTenant = user.id === transportRequest.tenantId;
    const isAssignedDriver = user.id === transportRequest.assignedDriver?.userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isTenant && !isAssignedDriver && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (
      transportRequest.status === 'REQUESTED' &&
      transportRequest.expiresAt &&
      transportRequest.expiresAt <= new Date()
    ) {
      transportRequest = await prisma.transportRequest.update({
        where: { id: transportRequest.id },
        data: { status: 'EXPIRED' },
        include: {
          assignedDriver: {
            select: {
              userId: true,
            },
          },
          Rating: {
            select: {
              id: true,
              stars: true,
              comment: true,
              createdAt: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      request: {
        ...transportRequest,
        assignedDriver: transportRequest.assignedDriver
          ? { assigned: true }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Transport request detail error:', error);
    return NextResponse.json({ error: 'Unable to load transport request' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Use the dedicated transport cancel and rating endpoints for request mutations.',
    },
    { status: 405 },
  );
}
