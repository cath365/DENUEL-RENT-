import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

// GET /api/payments - Get user's payment history
export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    
    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST /api/payments - Initiate a payment
export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    
    const { amount, paymentMethod, phoneNumber, description, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method required' }, { status: 400 });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount,
        currency: 'ZMW',
        paymentMethod,
        phoneNumber,
        description,
        metadata,
        status: 'PENDING',
        transactionRef: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      },
    });

    // Here you would integrate with actual payment gateways:
    // - Airtel Money API
    // - MTN MoMo API
    // - Visa/Mastercard payment gateway
    
    // For now, return payment details
    return NextResponse.json({ 
      payment,
      message: 'Payment initiated. Please complete payment on your phone.',
      // In production, return payment gateway redirect URL or USSD code
    });
  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
