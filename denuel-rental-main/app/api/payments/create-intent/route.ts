import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, description } = await req.json(); // amount in ZMW, convert to cents

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // ZMW to ngwee (100 ngwee = 1 ZMW)
      currency: 'zmw',
      description,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}