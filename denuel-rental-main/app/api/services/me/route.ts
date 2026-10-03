import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get current user's service provider profile
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        portfolio: {
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          include: {
            reviewer: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          include: {
            customer: {
              select: { name: true, phone: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { message: 'Service provider profile not found' },
        { status: 404 }
      );
    }

    // Transform bookings to include customer info
    const bookingsWithCustomer = provider.bookings.map((booking) => ({
      ...booking,
      customerName: booking.customer.name,
      customerPhone: booking.customer.phone,
      customerEmail: booking.customer.email,
    }));

    return NextResponse.json({
      provider: {
        ...provider,
        bookings: bookingsWithCustomer,
      },
    });
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    return NextResponse.json(
      { message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update provider profile
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json(
        { message: 'Service provider profile not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const allowedFields = [
      'businessName',
      'description',
      'phone',
      'email',
      'website',
      'address',
      'city',
      'area',
      'priceRange',
      'hourlyRate',
      'minimumCharge',
      'yearsInBusiness',
      'servicesOffered',
      'serviceAreas',
      'workingHours',
      'languages',
      'isAvailable',
      'isActive',
      'profilePhotoUrl',
      'logoUrl',
      'coverPhotoUrl',
      'bio',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedProvider = await prisma.serviceProvider.update({
      where: { id: provider.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      provider: updatedProvider,
    });
  } catch (error) {
    console.error('Error updating provider profile:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
