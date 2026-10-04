import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

// GET - Get rent payments
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leaseId = searchParams.get('leaseId');
    const status = searchParams.get('status');
    const role = searchParams.get('role'); // 'landlord' or 'tenant'

    const where: Record<string, unknown> = {};

    if (leaseId) {
      where.leaseId = leaseId;
      where.OR = [
        { tenantId: user.id },
        { lease: { landlordId: user.id } },
      ];
    } else if (role === 'tenant') {
      where.tenantId = user.id;
    } else if (role === 'landlord') {
      where.lease = { landlordId: user.id };
    } else if (user.role === 'LANDLORD' || user.role === 'AGENT') {
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
              select: {
                id: true,
                title: true,
                addressText: true,
                city: true,
                area: true,
              },
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

    // Calculate summary stats
    const stats = {
      totalDue: payments
        .filter((p) => ['PENDING', 'LATE'].includes(p.status))
        .reduce((sum, p) => sum + p.amount + Math.max(0, Number(p.lateFee || 0)), 0),
      totalPaid: payments
        .filter((p) => p.status === 'PAID')
        .reduce(
          (sum, p) =>
            sum + p.amount + Math.max(0, Number(p.lateFee || 0)),
          0
        ),
      overdue: payments.filter((p) => p.status === 'PENDING' && new Date(p.dueDate) < new Date()).length,
      upcoming: payments.filter((p) => {
        const due = new Date(p.dueDate);
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return p.status === 'PENDING' && due >= now && due <= weekFromNow;
      }).length,
    };

    return NextResponse.json({ payments, stats });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch rent payments error:', error);
    const safe = publicServerError(error, 'Unable to load rent payment records.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

// POST - Record a real offline/manual full payment
// Online card payments use the Stripe verification flow instead.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const paymentId =
      typeof body.paymentId === 'string' ? body.paymentId : '';
    const amount = Number(body.amount);
    const paymentMethod =
      typeof body.paymentMethod === 'string'
        ? body.paymentMethod.trim().toUpperCase()
        : '';
    const transactionId =
      typeof body.transactionId === 'string'
        ? body.transactionId.trim().slice(0, 240)
        : '';
    const notes =
      typeof body.notes === 'string'
        ? body.notes.trim().slice(0, 1000)
        : '';

    const allowedMethods = new Set([
      'BANK',
      'MOBILE_MONEY',
      'CASH',
      'CARD',
    ]);

    if (
      !paymentId ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !allowedMethods.has(paymentMethod)
    ) {
      return NextResponse.json(
        {
          error:
            'Payment record, full amount and a valid payment method are required.',
        },
        { status: 400 }
      );
    }

    const payment = await prisma.rentPayment.findUnique({
      where: { id: paymentId },
      include: {
        lease: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found.' },
        { status: 404 }
      );
    }

    const canRecord =
      payment.lease.landlordId === user.id ||
      user.role === 'ADMIN';

    if (!canRecord) {
      return NextResponse.json(
        {
          error:
            'Only the property manager or an administrator can record an offline rent payment.',
        },
        { status: 403 }
      );
    }

    if (payment.status === 'PAID') {
      return NextResponse.json(
        { error: 'This rent record is already paid.' },
        { status: 409 }
      );
    }

    if (!['PENDING', 'LATE'].includes(payment.status)) {
      return NextResponse.json(
        {
          error:
            'This rent record is not available for full manual payment recording.',
        },
        { status: 400 }
      );
    }

    const lateFee = Math.max(
      0,
      Number(payment.lateFee || 0)
    );
    const amountDue = Number(payment.amount) + lateFee;

    if (Math.abs(amount - amountDue) > 0.01) {
      return NextResponse.json(
        {
          error:
            `The recorded amount must match the full amount due: K${amountDue.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.rentPayment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod,
        transactionId: transactionId || null,
        notes: notes || null,
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
                city: true,
                area: true,
              },
            },
          },
        },
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: payment.tenantId,
          type: 'RENT_PAYMENT_RECORDED',
          data: {
            paymentId: updated.id,
            amount: amountDue,
            propertyId: payment.lease.propertyId,
            paymentMethod,
            transactionId: transactionId || null,
          },
        },
      });
    } catch {
      // The payment record remains valid if notification delivery fails.
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Record rent payment error:', error);
    const safe = publicServerError(
      error,
      'Unable to record this rent payment right now.'
    );

    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

// PUT - Update a rent record (landlord/admin only)
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json();
    const paymentId =
      typeof body.paymentId === 'string' ? body.paymentId : '';
    const requestedStatus =
      typeof body.status === 'string' ? body.status : undefined;
    const notes =
      typeof body.notes === 'string' ? body.notes.trim().slice(0, 1000) : undefined;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required.' },
        { status: 400 }
      );
    }

    const payment = await prisma.rentPayment.findUnique({
      where: { id: paymentId },
      include: { lease: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found.' },
        { status: 404 }
      );
    }

    if (payment.lease.landlordId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const allowedStatuses = ['PENDING', 'PAID', 'LATE', 'PARTIAL', 'WAIVED'];
    const data: Record<string, unknown> = {};

    if (requestedStatus !== undefined) {
      if (!allowedStatuses.includes(requestedStatus)) {
        return NextResponse.json(
          { error: 'Invalid rent-payment status.' },
          { status: 400 }
        );
      }
      data.status = requestedStatus;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'lateFee')) {
      if (body.lateFee === null || body.lateFee === '') {
        data.lateFee = null;
      } else {
        const lateFee = Number(body.lateFee);
        if (!Number.isFinite(lateFee) || lateFee < 0) {
          return NextResponse.json(
            { error: 'Late fee must be a valid non-negative amount.' },
            { status: 400 }
          );
        }
        data.lateFee = lateFee;
      }
    }

    if (notes !== undefined) {
      data.notes = notes || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No permitted payment update was provided.' },
        { status: 400 }
      );
    }

    const updated = await prisma.rentPayment.update({
      where: { id: paymentId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Update rent payment error:', error);
    const safe = publicServerError(error, 'Unable to update this rent record.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
