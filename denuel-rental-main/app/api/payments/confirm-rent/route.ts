import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Online card payments are not configured yet.' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const paymentIntentId =
      typeof body.paymentIntentId === 'string' ? body.paymentIntentId : '';

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment confirmation reference is required.' },
        { status: 400 }
      );
    }

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    });

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'The payment has not been confirmed as successful.' },
        { status: 409 }
      );
    }

    const rentPaymentId = intent.metadata?.rentPaymentId;
    const tenantId = intent.metadata?.tenantId;

    if (!rentPaymentId || tenantId !== user.id) {
      return NextResponse.json(
        { error: 'This payment confirmation does not belong to your account.' },
        { status: 403 }
      );
    }

    const rentPayment = await prisma.rentPayment.findUnique({
      where: { id: rentPaymentId },
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

    if (!rentPayment || rentPayment.tenantId !== user.id) {
      return NextResponse.json(
        { error: 'Rent payment record not found.' },
        { status: 404 }
      );
    }

    if (rentPayment.status === 'PAID') {
      return NextResponse.json({
        payment: rentPayment,
        alreadyRecorded: true,
      });
    }

    const expectedLateFee =
      Number.isFinite(Number(rentPayment.lateFee)) && Number(rentPayment.lateFee) > 0
        ? Number(rentPayment.lateFee)
        : 0;

    const expectedAmount = Number(rentPayment.amount) + expectedLateFee;
    const paidAmount = Number(intent.amount_received || intent.amount || 0) / 100;

    if (Math.abs(expectedAmount - paidAmount) > 0.01) {
      return NextResponse.json(
        { error: 'The confirmed amount does not match this rent record.' },
        { status: 409 }
      );
    }

    const updated = await prisma.rentPayment.update({
      where: { id: rentPayment.id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: 'CARD',
        transactionId: intent.id,
        notes: 'Paid online through the configured card payment provider.',
      },
      include: {
        lease: {
          include: {
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
          userId: rentPayment.lease.landlordId,
          type: 'RENT_PAYMENT_RECORDED',
          data: {
            paymentId: updated.id,
            amount: paidAmount,
            propertyId: rentPayment.lease.propertyId,
            transactionId: intent.id,
          },
        },
      });
    } catch {
      // A confirmed payment must not be rolled back because notification delivery failed.
    }

    return NextResponse.json({
      payment: updated,
      amount: paidAmount,
      transactionId: intent.id,
    });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Confirm rent payment failed', error);
    const safe = publicServerError(
      error,
      'Unable to confirm the rent payment right now.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
