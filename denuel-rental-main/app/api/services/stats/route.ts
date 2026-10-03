import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    
    // Get service provider
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id }
    });
    
    if (!provider) {
      return NextResponse.json({
        totalBookings: 0,
        pendingBookings: 0,
        completedJobs: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0,
        averageRating: 0
      });
    }

    // Get booking stats
    const allBookings = await prisma.serviceBooking.findMany({
      where: { providerId: provider.id }
    });

    const pendingBookings = allBookings.filter(b => b.status === 'PENDING').length;
    const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');
    
    // Calculate earnings (from completed bookings with finalPrice)
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);
    
    // This month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthEarnings = completedBookings
      .filter(b => new Date(b.createdAt) >= startOfMonth)
      .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    return NextResponse.json({
      totalBookings: allBookings.length,
      pendingBookings,
      completedJobs: completedBookings.length,
      totalEarnings,
      thisMonthEarnings,
      averageRating: provider.ratingAvg
    });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Service stats error:', e);
    return NextResponse.json({
      totalBookings: 0,
      pendingBookings: 0,
      completedJobs: 0,
      totalEarnings: 0,
      thisMonthEarnings: 0,
      averageRating: 0
    });
  }
}
