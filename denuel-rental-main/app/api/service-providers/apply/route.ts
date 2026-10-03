import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';
import { ServiceCategory } from '@prisma/client';

// POST /api/service-providers/apply - Submit service provider application
export async function POST(request: NextRequest) {
  try {
    // Get current user if logged in
    let user = null;
    try {
      user = await requireAuth(request);
    } catch (e) {
      // User not logged in, continue with form data
    }

    const body = await request.json();
    const {
      serviceType,
      businessName,
      fullName,
      email,
      phone,
      nrcNumber,
      experience,
      description,
      services,
      serviceAreas,
      hourlyRate,
      availability,
      documents,
    } = body;

    // Validate required fields
    if (!serviceType || !fullName || !email || !phone || !description || !services?.length || !serviceAreas?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Map service type to category
    const categoryMap: Record<string, string> = {
      maid: 'MAID',
      cleaner: 'CLEANER',
      security: 'SECURITY',
      gardener: 'GARDENER',
      plumber: 'PLUMBER',
      electrician: 'ELECTRICIAN',
      painter: 'PAINTER',
      mover: 'MOVER',
      home_inspector: 'HOME_INSPECTOR',
      photographer: 'PHOTOGRAPHER',
      contractor: 'CONTRACTOR',
      landscaper: 'LANDSCAPER',
      pest_control: 'PEST_CONTROL',
      hvac: 'HVAC',
      roofing: 'ROOFING',
      flooring: 'FLOORING',
      interior_designer: 'INTERIOR_DESIGNER',
      other: 'OTHER',
    };

    const category = (categoryMap[serviceType] || 'OTHER') as ServiceCategory;

    // Create or get user if not logged in
    let userId = user?.id;
    
    if (!userId) {
      // Check if user exists with this email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create a new user
        const newUser = await prisma.user.create({
          data: {
            name: fullName,
            email,
            phone,
            password: '', // They'll need to set password later
            role: 'USER',
          },
        });
        userId = newUser.id;
      }
    }

    // Create the service provider
    const serviceProvider = await prisma.serviceProvider.create({
      data: {
        userId,
        businessName: businessName || fullName,
        category,
        phone,
        email,
        city: serviceAreas[0] || 'Lusaka',
        description,
        yearsInBusiness: experience ? parseInt(experience) : null,
        servicesOffered: services,
        serviceAreas: serviceAreas,
        hourlyRate: hourlyRate || 0,
        workingHours: availability || null,
        isVerified: false,
        isActive: false,
        nrcNumber,
      },
    });

    // Create document records
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await prisma.serviceDocument.create({
          data: {
            providerId: serviceProvider.id,
            type: doc.type.toUpperCase(),
            name: doc.name,
            fileUrl: doc.url,
            isVerified: false,
          },
        });
      }
    }

    // Send notification to admin
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'NEW_APPLICATION',
            data: {
              title: 'New Service Provider Application',
              message: `${fullName} has applied to become a ${serviceType}. Review their application.`,
            },
          },
        });
      }
    } catch (e) {
      console.log('Could not notify admins');
    }

    return NextResponse.json({
      success: true,
      id: serviceProvider.id,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
