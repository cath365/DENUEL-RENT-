import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

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
    } else if (role === 'landlord' || user.role === 'LANDLORD') {
      where.lease = {
        landlordId: user.id,
      };
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

    // Calculate summary stats
    const stats = {
      totalDue: payments.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0),
      totalPaid: payments.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0),
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
    console.error('Fetch rent payments error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST - Record a payment
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, amount, paymentMethod, transactionId, notes } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const payment = await prisma.rentPayment.findUnique({
      where: { id: paymentId },
      include: {
        lease: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check authorization
    if (payment.tenantId !== user.id && payment.lease.landlordId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if late
    const isLate = new Date(payment.dueDate) < new Date();
    let lateFee = 0;
    if (isLate && !payment.lateFee) {
      // Apply 5% late fee
      lateFee = payment.amount * 0.05;
    }

    const updated = await prisma.rentPayment.update({
      where: { id: paymentId },
      data: {
        status: amount >= payment.amount ? 'PAID' : 'PARTIAL',
        paidDate: new Date(),
        paymentMethod,
        transactionId,
        notes,
        lateFee: lateFee > 0 ? lateFee : payment.lateFee,
      },
    });

    // Notify landlord of payment
    await prisma.notification.create({
      data: {
        userId: payment.lease.landlordId,
        type: 'RENT_PAID',
        data: {
          paymentId: updated.id,
          amount: payment.amount,
          tenantId: payment.tenantId,
          propertyId: payment.lease.propertyId,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Record rent payment error:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}

// PUT - Update payment (landlord can waive, adjust, etc.)
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, status, lateFee, notes } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const payment = await prisma.rentPayment.findUnique({
      where: { id: paymentId },
      include: { lease: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only landlord or admin can modify
    if (payment.lease.landlordId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.rentPayment.update({
      where: { id: paymentId },
      data: { status, lateFee, notes },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update rent payment error:', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
