import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST - Register as a service provider
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      businessName,
      category,
      description,
      yearsInBusiness,
      hourlyRate,
      minimumCharge,
      priceRange,
      phone,
      email,
      city,
      area,
      address,
      website,
      serviceAreas,
      profilePhotoUrl,
      documents,
    } = body;

    // Validate required fields
    if (!businessName || !category || !phone || !email || !city) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already has a provider profile
    if (userId) {
      const existingProvider = await prisma.serviceProvider.findUnique({
        where: { userId },
      });

      if (existingProvider) {
        return NextResponse.json(
          { message: 'User already has a service provider profile' },
          { status: 400 }
        );
      }
    }

    // Create service provider
    const provider = await prisma.serviceProvider.create({
      data: {
        userId,
        businessName,
        category,
        description,
        yearsInBusiness: yearsInBusiness || 0,
        hourlyRate,
        minimumCharge,
        priceRange,
        phone,
        email,
        city,
        area,
        address,
        website,
        serviceAreas: serviceAreas || [],
        profilePhotoUrl,
        isActive: true,
        isAvailable: true,
      },
    });

    // Create documents if provided
    if (documents && documents.length > 0) {
      await prisma.serviceDocument.createMany({
        data: documents.map((doc: { type: string; url: string; name: string }) => ({
          providerId: provider.id,
          type: doc.type,
          fileUrl: doc.url,
          name: doc.name,
        })),
      });
    }

    return NextResponse.json({
      message: 'Service provider registered successfully',
      provider,
    });
  } catch (error) {
    console.error('Error registering provider:', error);
    return NextResponse.json(
      { message: 'Failed to register provider' },
      { status: 500 }
    );
  }
}
