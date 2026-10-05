import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

const PAYMENT_STATUSES = new Set([
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
]);

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || '').toUpperCase();

    const paymentWhere: any = {};
    if (PAYMENT_STATUSES.has(status)) {
      paymentWhere.status = status;
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      payments,
      rentPayments,
      completedAggregate,
      monthAggregate,
      pendingAggregate,
      completedCount,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: paymentWhere,
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.rentPayment.findMany({
        orderBy: { dueDate: 'desc' },
        take: 200,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lease: {
            select: {
              id: true,
              landlord: {
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
      }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.payment.count({
        where: { status: 'COMPLETED' },
      }),
    ]);

    const recordedPaidRent = rentPayments
      .filter((payment) => payment.status === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return NextResponse.json({
      payments,
      rentPayments,
      stats: {
        completedVolume: Number(completedAggregate._sum.amount || 0),
        thisMonthCompletedVolume: Number(monthAggregate._sum.amount || 0),
        pendingVolume: Number(pendingAggregate._sum.amount || 0),
        completedPayments: completedCount,
        recordedPaidRent,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Admin payments fetch error:', error);
    return NextResponse.json(
      { error: 'Unable to load payment records' },
      { status: 500 }
    );
  }
}
