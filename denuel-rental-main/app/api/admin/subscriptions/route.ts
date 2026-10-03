import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

// GET /api/admin/subscriptions - Get all users and their subscriptions
export async function GET(req: Request) {
  try {
    await requireAuth(req, ['ADMIN']);

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['LANDLORD', 'AGENT'],
        },
      },
      include: {
        userSubscription: {
          include: {
            plan: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

// POST /api/admin/subscriptions - Manually activate/update user subscription
export async function POST(req: Request) {
  try {
    await requireAuth(req, ['ADMIN']);
    
    const body = await req.json();
    const { userId, planId, note } = body;

    if (!userId || !planId) {
      return NextResponse.json({ error: 'User ID and Plan ID required' }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Check if user has existing subscription
    const existing = await prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (existing) {
      // Update existing subscription
      const updated = await prisma.userSubscription.update({
        where: { userId },
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

      // Record transaction
      if (plan.price > 0) {
        await prisma.transaction.create({
          data: {
            userId,
            type: 'SUBSCRIPTION',
            amount: plan.price,
            currency: plan.currency,
            commission: 0,
            description: `${plan.name} subscription activated by admin${note ? ': ' + note : ''}`,
          },
        });
      }

      return NextResponse.json({ 
        subscription: updated,
        message: `Subscription updated to ${plan.name}`,
      });
    }

    // Create new subscription
    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
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

    // Record transaction
    if (plan.price > 0) {
      await prisma.transaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          amount: plan.price,
          currency: plan.currency,
          commission: 0,
          description: `${plan.name} subscription activated by admin${note ? ': ' + note : ''}`,
        },
      });
    }

    return NextResponse.json({ 
      subscription,
      message: `Subscription activated: ${plan.name}`,
    });
  } catch (error: any) {
    console.error('Admin subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
