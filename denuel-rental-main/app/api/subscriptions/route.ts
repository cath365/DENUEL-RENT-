import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

// GET /api/subscriptions - Get user's subscription
export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });

    return NextResponse.json({ subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST /api/subscriptions - Subscribe to a plan
export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    
    const { planId } = body;

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Check if user already has a subscription
    const existing = await prisma.userSubscription.findUnique({
      where: { userId: user.id },
    });

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    if (existing) {
      // Update existing subscription
      const updated = await prisma.userSubscription.update({
        where: { userId: user.id },
        data: {
          planId,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          listingsUsed: 0,
          boostsUsed: 0,
          inquiriesUsed: 0,
        },
        include: { plan: true },
      });

      // Create payment record if not free
      if (plan.price > 0) {
        await prisma.payment.create({
          data: {
            userId: user.id,
            amount: plan.price,
            currency: plan.currency,
            paymentMethod: 'AIRTEL_MONEY', // Default, should be from request
            description: `Subscription to ${plan.name} plan`,
            status: 'PENDING',
            transactionRef: `SUB-${Date.now()}`,
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: 'SUBSCRIPTION',
            amount: plan.price,
            currency: plan.currency,
            commission: 0,
            description: `${plan.name} subscription payment`,
          },
        });
      }

      return NextResponse.json({ 
        subscription: updated,
        message: plan.price > 0 ? 'Payment required to activate subscription' : 'Subscription activated',
      });
    }

    // Create new subscription
    const subscription = await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        listingsUsed: 0,
        boostsUsed: 0,
        inquiriesUsed: 0,
      },
      include: { plan: true },
    });

    // Create payment record if not free
    if (plan.price > 0) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          amount: plan.price,
          currency: plan.currency,
          paymentMethod: 'AIRTEL_MONEY',
          description: `Subscription to ${plan.name} plan`,
          status: 'PENDING',
          transactionRef: `SUB-${Date.now()}`,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'SUBSCRIPTION',
          amount: plan.price,
          currency: plan.currency,
          commission: 0,
          description: `${plan.name} subscription payment`,
        },
      });
    }

    return NextResponse.json({ 
      subscription,
      message: plan.price > 0 ? 'Payment required to activate subscription' : 'Subscription activated',
    });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/subscriptions - Cancel subscription
export async function DELETE(req: Request) {
  try {
    const user = await requireAuth(req);
    
    const subscription = await prisma.userSubscription.update({
      where: { userId: user.id },
      data: {
        cancelAtPeriodEnd: true,
      },
      include: { plan: true },
    });

    return NextResponse.json({ 
      subscription,
      message: 'Subscription will be canceled at the end of the current period',
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
