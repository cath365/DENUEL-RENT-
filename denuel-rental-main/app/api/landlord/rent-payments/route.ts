import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ManualPaymentSchema = z.object({
  paymentId: z.string().cuid(),
  paymentMethod: z.enum(['CASH', 'BANK', 'MOBILE_MONEY', 'CARD']),
  transactionId: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const AdjustmentSchema = z.object({
  paymentId: z.string().cuid(),
  status: z.enum(['PENDING', 'LATE', 'WAIVED']),
  lateFee: z.number().nonnegative().nullable().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { searchParams } = new URL(req.url);
    const leaseId = searchParams.get('leaseId');
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    const where: Record<string, unknown> = {};

    if (leaseId) {
      where.leaseId = leaseId;
    } else if (role === 'landlord') {
      where.lease = { landlordId: user.id };
    } else if (role === 'tenant') {
      where.tenantId = user.id;
    } else if (user.role === 'LANDLORD') {
      where.lease = { landlordId: user.id };
    } else {
      where.tenantId = user.id;
    }

    if (status) {
      where.status = status;
    }

    const payments = await prisma.rentPayment.findMany({
      where,
      include: {
        lease: {
          include: {
            property: {
              select: { id: true, title: true, addressText: true },
            },
            tenant: {
              select: { id: true, name: true, email: true },
            },
            landlord: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { dueDate: 'desc' },
    });

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalDue: payments
        .filter((payment) => ['PENDING', 'LATE'].includes(payment.status))
        .reduce(
          (sum, payment) =>
            sum + Number(payment.amount || 0) + Number(payment.lateFee || 0),
          0
        ),
      totalPaid: payments
        .filter((payment) => payment.status === 'PAID')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      overdue: payments.filter(
        (payment) =>
          ['PENDING', 'LATE'].includes(payment.status) &&
          new Date(payment.dueDate) < now
      ).length,
      upcoming: payments.filter((payment) => {
        const due = new Date(payment.dueDate);
        return (
          payment.status === 'PENDING' &&
          due >= now &&
          due <= weekFromNow
        );
      }).length,
    };

    return NextResponse.json({ payments, stats });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch rent payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// Record a full offline/manual payment. Tenants cannot mark themselves paid.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'ADMIN']);
    requireCsrf(req);

    const parsed = ManualPaymentSchema.parse(await req.json());

    const payment = await prisma.rentPayment.findUnique({
      where: { id: parsed.paymentId },
      include: { lease: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (
      payment.lease.landlordId !== user.id &&
      user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (payment.status === 'PAID') {
      return NextResponse.json(
        { error: 'This rent payment is already marked paid.' },
        { status: 409 }
      );
    }

    if (payment.status === 'WAIVED') {
      return NextResponse.json(
        { error: 'A waived payment cannot be marked paid without restoring it first.' },
        { status: 409 }
      );
    }

    const updated = await prisma.rentPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: parsed.paymentMethod,
        transactionId: parsed.transactionId || null,
        notes: parsed.notes || null,
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: payment.tenantId,
          type: 'RENT_PAYMENT_RECORDED',
          data: {
            paymentId: updated.id,
            amount: payment.amount,
            propertyId: payment.lease.propertyId,
            paymentMethod: parsed.paymentMethod,
          },
        },
      });
    } catch {
      console.warn('Unable to create rent payment notification.');
    }

    return NextResponse.json({ payment: updated });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error('Record rent payment error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}

// Landlord/admin adjustments that do not pretend money settled.
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['LANDLORD', 'ADMIN']);
    requireCsrf(req);

    const parsed = AdjustmentSchema.parse(await req.json());

    const payment = await prisma.rentPayment.findUnique({
      where: { id: parsed.paymentId },
      include: { lease: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (
      payment.lease.landlordId !== user.id &&
      user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.rentPayment.update({
      where: { id: payment.id },
      data: {
        status: parsed.status,
        lateFee:
          parsed.lateFee === undefined ? payment.lateFee : parsed.lateFee,
        notes: parsed.notes === undefined ? payment.notes : parsed.notes,
        ...(parsed.status !== 'PENDING'
          ? {}
          : {
              paidDate: null,
              paymentMethod: null,
              transactionId: null,
            }),
      },
    });

    return NextResponse.json({ payment: updated });
  } catch (error) {
    if (error instanceof Response) return error;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error('Update rent payment error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
