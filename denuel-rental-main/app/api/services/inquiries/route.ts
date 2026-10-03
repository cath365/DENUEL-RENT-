import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get inquiries for a service provider
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const whereClause: any = { providerId: provider.id };
    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const inquiries = await prisma.serviceInquiry.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Get counts by status
    const statusCounts = await prisma.serviceInquiry.groupBy({
      by: ['status'],
      where: { providerId: provider.id },
      _count: { status: true },
    });

    return NextResponse.json({
      inquiries,
      counts: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
    });
  } catch (error: any) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new inquiry (from customer)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      providerId,
      customerName,
      customerEmail,
      customerPhone,
      serviceNeeded,
      description,
      preferredDate,
      budget,
      propertyAddress,
      city,
    } = body;

    if (!providerId || !customerName || !customerPhone || !serviceNeeded) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get customer ID if logged in
    let customerId = null;
    try {
      const user = await requireAuth(req);
      if (user) {
        customerId = user.id;
      }
    } catch (e) {
      // Anonymous inquiry
    }

    const inquiry = await prisma.serviceInquiry.create({
      data: {
        providerId,
        customerId,
        customerName,
        customerEmail,
        customerPhone,
        serviceNeeded,
        description,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        budget,
        propertyAddress,
        city,
        status: 'NEW',
      },
    });

    return NextResponse.json({ success: true, inquiry });
  } catch (error: any) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update inquiry status
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { inquiryId, status, notes } = body;

    if (!inquiryId || !status) {
      return NextResponse.json({ error: 'Inquiry ID and status required' }, { status: 400 });
    }

    // Verify provider owns this inquiry
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }

    const inquiry = await prisma.serviceInquiry.findFirst({
      where: { id: inquiryId, providerId: provider.id },
    });

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    const updated = await prisma.serviceInquiry.update({
      where: { id: inquiryId },
      data: { status, notes },
    });

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error: any) {
    console.error('Error updating inquiry:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
