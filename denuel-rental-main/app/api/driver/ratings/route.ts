import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    
    // Get driver profile
    const driver = await prisma.driverProfile.findUnique({
      where: { userId: user.id }
    });
    
    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    // Fetch all ratings for this driver
    const ratings = await prisma.rating.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: {
            name: true
          }
        },
        transportRequest: {
          select: {
            pickupAddressText: true,
            dropoffAddressText: true,
            createdAt: true
          }
        }
      }
    });

    return NextResponse.json(ratings);
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Driver ratings error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to fetch ratings' }, { status: 500 });
  }
}
