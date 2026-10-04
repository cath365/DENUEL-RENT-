import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Payments are not configured yet.' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    });

    const { amount, description } = await req.json();

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'A valid payment amount is required.' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'zmw',
      description,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Unable to create payment intent.' },
      { status: 500 }
    );
  }
}
