import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

// POST /api/inquiries/unlock - Unlock inquiry contact details
export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    
    const { inquiryId } = body;

    if (!inquiryId) {
      return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
    }

    // Get inquiry
    const inquiry = await prisma.propertyInquiry.findUnique({
      where: { id: inquiryId },
      include: {
        property: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // Check if user is the property owner
    if (inquiry.property.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // If already unlocked, return it
    if (inquiry.isUnlocked) {
      return NextResponse.json({ inquiry });
    }

    // Check user's subscription for free inquiries
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.id },
      include: { plan: true },
    });

    const INQUIRY_UNLOCK_PRICE = 5; // K5 per inquiry

    if (subscription && subscription.plan.freeInquiries === -1) {
      // Unlimited inquiries
      await prisma.propertyInquiry.update({
        where: { id: inquiryId },
        data: { 
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      });

      return NextResponse.json({ inquiry });
    }

    if (subscription && subscription.inquiriesUsed < subscription.plan.freeInquiries) {
      // Still has free inquiries
      await prisma.$transaction([
        prisma.propertyInquiry.update({
          where: { id: inquiryId },
          data: { 
            isUnlocked: true,
            unlockedAt: new Date(),
          },
        }),
        prisma.userSubscription.update({
          where: { userId: user.id },
          data: {
            inquiriesUsed: { increment: 1 },
          },
        }),
      ]);

      return NextResponse.json({ inquiry, message: 'Unlocked using free inquiry quota' });
    }

    // Need to pay for inquiry
    await prisma.propertyInquiry.update({
      where: { id: inquiryId },
      data: { 
        isUnlocked: true,
        unlockedAt: new Date(),
      },
    });

    // Create payment
    await prisma.payment.create({
      data: {
        userId: user.id,
        amount: INQUIRY_UNLOCK_PRICE,
        currency: 'ZMW',
        paymentMethod: 'AIRTEL_MONEY',
        description: 'Inquiry contact unlock',
        status: 'PENDING',
        transactionRef: `INQ-${Date.now()}`,
      },
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        propertyId: inquiry.propertyId,
        type: 'INQUIRY_UNLOCK',
        amount: INQUIRY_UNLOCK_PRICE,
        currency: 'ZMW',
        commission: 0,
        description: 'Inquiry contact details unlock',
      },
    });

    return NextResponse.json({ 
      inquiry,
      message: `Payment of K${INQUIRY_UNLOCK_PRICE} required to unlock contact details`,
    });
  } catch (error: any) {
    console.error('Unlock inquiry error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
