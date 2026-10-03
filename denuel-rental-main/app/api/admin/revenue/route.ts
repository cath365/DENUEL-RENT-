import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

// GET /api/admin/revenue - Get revenue analytics
export async function GET(req: Request) {
  try {
    const user = await requireAuth(req, ['ADMIN']);

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || '30'; // days
    const days = parseInt(period);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total revenue by transaction type
    const revenueByType = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
        commission: true,
      },
      _count: true,
    });

    // Total revenue
    const totalRevenue = revenueByType.reduce((sum, item) => sum + (item._sum.amount || 0), 0);
    const totalCommission = revenueByType.reduce((sum, item) => sum + (item._sum.commission || 0), 0);

    // Active subscriptions
    const activeSubscriptions = await prisma.userSubscription.groupBy({
      by: ['planId'],
      where: {
        status: 'ACTIVE',
      },
      _count: true,
    });

    // Get subscription revenue
    const subscriptionRevenue = await prisma.subscriptionPlan.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        _count: {
          select: {
            userSubscriptions: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    const monthlyRecurring = subscriptionRevenue.reduce(
      (sum, plan) => sum + (plan.price * plan._count.userSubscriptions),
      0
    );

    // Recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Payment statistics
    const paymentStats = await prisma.payment.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Active boosts
    const activeBoosts = await prisma.propertyBoost.count({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
    });

    // Daily revenue trend
    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM Transaction
      WHERE createdAt >= ${startDate}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalCommission,
        monthlyRecurring,
        transactionCount: revenueByType.reduce((sum, item) => sum + item._count, 0),
        activeSubscriptions: activeSubscriptions.reduce((sum, item) => sum + item._count, 0),
        activeBoosts,
      },
      revenueByType,
      subscriptionRevenue,
      paymentStats,
      dailyRevenue,
      recentTransactions,
    });
  } catch (error: any) {
    console.error('Revenue error:', error);
    return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 500 });
  }
}
