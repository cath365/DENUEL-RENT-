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

    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all earnings
    const allEarnings = await prisma.driverEarning.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
      include: {
        transportRequest: {
          select: {
            pickupAddressText: true,
            dropoffAddressText: true,
            status: true
          }
        }
      }
    });

    // Calculate totals
    const todayEarnings = allEarnings
      .filter(e => new Date(e.createdAt) >= todayStart)
      .reduce((sum, e) => sum + e.netZmw, 0);

    const weekEarnings = allEarnings
      .filter(e => new Date(e.createdAt) >= weekStart)
      .reduce((sum, e) => sum + e.netZmw, 0);

    const monthEarnings = allEarnings
      .filter(e => new Date(e.createdAt) >= monthStart)
      .reduce((sum, e) => sum + e.netZmw, 0);

    const totalEarnings = allEarnings.reduce((sum, e) => sum + e.netZmw, 0);

    return NextResponse.json({
      today: todayEarnings,
      week: weekEarnings,
      month: monthEarnings,
      total: totalEarnings,
      list: allEarnings.slice(0, 50) // Last 50 earnings
    });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Driver earnings error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to fetch earnings' }, { status: 500 });
  }
}
