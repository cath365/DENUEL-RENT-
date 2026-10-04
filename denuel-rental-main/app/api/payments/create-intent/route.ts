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
    const rentPaymentId =
      typeof body.rentPaymentId === 'string' ? body.rentPaymentId : '';

    if (!rentPaymentId) {
      return NextResponse.json(
        { error: 'A rent payment record is required.' },
        { status: 400 }
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

    if (!['PENDING', 'LATE'].includes(rentPayment.status)) {
      return NextResponse.json(
        { error: 'This rent record is not available for online payment.' },
        { status: 400 }
      );
    }

    const lateFee =
      Number.isFinite(Number(rentPayment.lateFee)) && Number(rentPayment.lateFee) > 0
        ? Number(rentPayment.lateFee)
        : 0;

    const totalAmount = Number(rentPayment.amount) + lateFee;

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'This rent record has an invalid amount.' },
        { status: 400 }
      );
    }

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'zmw',
      description: `Rent payment for ${rentPayment.lease.property.title}`,
      metadata: {
        rentPaymentId: rentPayment.id,
        leaseId: rentPayment.leaseId,
        tenantId: user.id,
        propertyId: rentPayment.lease.propertyId,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency: 'ZMW',
      propertyTitle: rentPayment.lease.property.title,
    });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Create rent payment intent failed', error);
    const safe = publicServerError(
      error,
      'Unable to start the online rent payment right now.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
