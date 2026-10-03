import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    
    // Get driver profile
    const driver = await prisma.driverProfile.findUnique({
      where: { userId: user.id }
    });
    
    if (!driver) {
      return NextResponse.json(null);
    }

    // Find active trip (not completed or cancelled)
    const activeTrip = await prisma.transportRequest.findFirst({
      where: {
        assignedDriverId: driver.id,
        status: {
          in: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'IN_PROGRESS']
        }
      },
      include: {
        tenant: {
          select: {
            name: true,
            phone: true
          }
        },
        property: {
          select: {
            title: true,
            addressText: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(activeTrip);
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Active trip error:', e);
    return NextResponse.json(null);
  }
}
