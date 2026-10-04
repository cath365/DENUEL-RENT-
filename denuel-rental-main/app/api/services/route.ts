import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Search service providers
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const verified = searchParams.get('verified') === 'true';
    const sortBy = searchParams.get('sortBy') || 'rating';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (city) {
      where.city = city;
    }

    if (area) {
      where.area = area;
    }

    if (verified) {
      where.isVerified = true;
    }

    const orderBy: Record<string, string> = {};
    switch (sortBy) {
      case 'rating':
        orderBy.ratingAvg = 'desc';
        break;
      case 'reviews':
        orderBy.ratingCount = 'desc';
        break;
      case 'name':
        orderBy.businessName = 'asc';
        break;
      default:
        orderBy.ratingAvg = 'desc';
    }

    const [providers, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        where,
        include: {
          reviews: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              reviewer: { select: { name: true } },
            },
          },
        },
        orderBy: [{ isVerified: 'desc' }, orderBy],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceProvider.count({ where }),
    ]);

    // Get categories summary
    const categories = await prisma.serviceProvider.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: { category: true },
    });

    return NextResponse.json({
      providers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      categories: categories.map((c) => ({
        name: c.category,
        count: c._count.category,
      })),
    });
  } catch (error) {
    console.error('Fetch service providers error:', error);
    return NextResponse.json({ error: 'Failed to fetch service providers' }, { status: 500 });
  }
}

// POST - Register as a service provider
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Sign in before creating a service profile.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessName,
      providerType,
      contactPersonName,
      contactPersonRole,
      category,
      description,
      phone,
      email,
      website,
      address,
      city,
      area,
      latitude,
      longitude,
      logoUrl,
      coverPhotoUrl,
      servicesOffered,
      priceRange,
      yearsInBusiness,
      licenseNumber,
      tpinNumber,
      nrcNumber,
      companyRegistrationNumber,
      teamSize,
      whatsappNumber,
      emergencyService,
      backgroundCheckedStaff,
      insured,
      insuranceProvider,
      responseTimeText,
      categoryDetails,
      workingHours,
      serviceAreas,
      languages,
      bio,
      profilePhotoUrl,
    } = body;

    const normalizedType = providerType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL';
    const services = Array.isArray(servicesOffered) ? servicesOffered.filter(Boolean) : [];
    const areas = Array.isArray(serviceAreas) ? serviceAreas.filter(Boolean) : [];

    if (!businessName || !category || !description || !phone || !email || !city) {
      return NextResponse.json(
        { error: 'Name, category, description, phone, email and city are required.' },
        { status: 400 }
      );
    }

    if (services.length === 0 || areas.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one service and one service area.' },
        { status: 400 }
      );
    }

    if (normalizedType === 'COMPANY') {
      if (!contactPersonName || !companyRegistrationNumber || !tpinNumber || !address || !teamSize) {
        return NextResponse.json(
          { error: 'Companies must provide a contact person, company registration number, TPIN, physical address and team size.' },
          { status: 400 }
        );
      }
    } else if (!nrcNumber) {
      return NextResponse.json(
        { error: 'Individual professionals must provide an NRC / identity number.' },
        { status: 400 }
      );
    }

    if (category === 'SECURITY') {
      if (!licenseNumber) {
        return NextResponse.json(
          { error: 'Security providers must provide their security / operating licence number.' },
          { status: 400 }
        );
      }
      const details = categoryDetails && typeof categoryDetails === 'object' ? categoryDetails : {};
      if (!details.guardingServices && !details.cctv && !details.alarmResponse && !details.patrolServices) {
        return NextResponse.json(
          { error: 'Security providers must describe at least one operational capability.' },
          { status: 400 }
        );
      }
    }

    if (insured && !insuranceProvider) {
      return NextResponse.json(
        { error: 'Add the insurance provider when marking the profile as insured.' },
        { status: 400 }
      );
    }

    const existing = await prisma.serviceProvider.findUnique({ where: { userId: user.id } });
    if (existing) {
      return NextResponse.json(
        { error: 'This account already has a service provider profile.' },
        { status: 409 }
      );
    }

    const completionChecks = [
      businessName,
      category,
      description,
      phone,
      email,
      city,
      areas.length > 0,
      services.length > 0,
      normalizedType === 'COMPANY' ? companyRegistrationNumber : nrcNumber,
      normalizedType === 'COMPANY' ? tpinNumber : true,
      normalizedType === 'COMPANY' ? contactPersonName : true,
      normalizedType === 'COMPANY' ? teamSize : true,
      category === 'SECURITY' ? licenseNumber : true,
    ];
    const profileCompletion = Math.round(
      (completionChecks.filter(Boolean).length / completionChecks.length) * 100
    );

    const provider = await prisma.serviceProvider.create({
      data: {
        userId: user.id,
        businessName,
        providerType: normalizedType,
        contactPersonName: normalizedType === 'COMPANY' ? contactPersonName : null,
        contactPersonRole: normalizedType === 'COMPANY' ? contactPersonRole : null,
        profileCompletion,
        verificationStatus: 'PENDING',
        category,
        description,
        phone,
        email,
        website,
        address,
        city,
        area,
        latitude,
        longitude,
        logoUrl,
        coverPhotoUrl,
        servicesOffered: services,
        priceRange,
        yearsInBusiness: yearsInBusiness ? Number(yearsInBusiness) : null,
        licenseNumber,
        tpinNumber: normalizedType === 'COMPANY' ? tpinNumber : null,
        nrcNumber: normalizedType === 'INDIVIDUAL' ? nrcNumber : null,
        companyRegistrationNumber: normalizedType === 'COMPANY' ? companyRegistrationNumber : null,
        teamSize: normalizedType === 'COMPANY' && teamSize ? Number(teamSize) : null,
        whatsappNumber,
        emergencyService: Boolean(emergencyService),
        backgroundCheckedStaff: Boolean(backgroundCheckedStaff),
        insured: Boolean(insured),
        insuranceProvider: insured ? insuranceProvider : null,
        responseTimeText,
        categoryDetails,
        workingHours,
        serviceAreas: areas,
        languages: Array.isArray(languages) ? languages : [],
        bio: bio || description,
        profilePhotoUrl,
        isVerified: false,
        isActive: false,
        isAvailable: true,
      },
    });

    if (user.role !== 'ADMIN' && user.role !== 'SERVICE_PROVIDER') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SERVICE_PROVIDER' },
      });
    }

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Create service provider error:', error);
    return NextResponse.json({ error: 'Failed to register service provider' }, { status: 500 });
  }
}
