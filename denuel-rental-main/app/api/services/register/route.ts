import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const documentTypes = (documents: any[] = []) =>
  new Set(documents.map((doc) => String(doc?.type || '').toUpperCase()));

function calculateCompletion(body: any, documents: any[]) {
  const checks = [
    body.businessName,
    body.category,
    body.description,
    body.phone,
    body.email,
    body.city,
    body.address,
    Array.isArray(body.serviceAreas) && body.serviceAreas.length > 0,
    Array.isArray(body.servicesOffered) && body.servicesOffered.length > 0,
    body.yearsInBusiness !== undefined && body.yearsInBusiness !== '',
    body.priceRange || body.hourlyRate,
    body.website || body.whatsappNumber,
    body.logoUrl || body.profilePhotoUrl,
    Array.isArray(documents) && documents.length > 0,
  ];

  if (body.providerType === 'COMPANY') {
    checks.push(
      body.companyRegistrationNumber,
      body.tpinNumber,
      body.teamSize && Number(body.teamSize) > 0,
      body.contactPersonName
    );
  } else {
    checks.push(body.nrcNumber, body.profilePhotoUrl);
  }

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      providerType = 'INDIVIDUAL',
      contactPersonName,
      contactPersonRole,
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
      whatsappNumber,
      serviceAreas,
      servicesOffered,
      workingHours,
      languages,
      profilePhotoUrl,
      logoUrl,
      coverPhotoUrl,
      nrcNumber,
      companyRegistrationNumber,
      tpinNumber,
      licenseNumber,
      teamSize,
      insured,
      insuranceProvider,
      backgroundCheckedStaff,
      emergencyService,
      responseTimeText,
      categoryDetails,
      documents = [],
    } = body;

    const normalizedType = providerType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL';

    if (!userId || !businessName || !category || !description || !phone || !email || !city) {
      return NextResponse.json(
        { message: 'Complete the required account, service and location details.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(serviceAreas) || serviceAreas.length === 0) {
      return NextResponse.json(
        { message: 'Select at least one service area.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(servicesOffered) || servicesOffered.length === 0) {
      return NextResponse.json(
        { message: 'Select at least one service you provide.' },
        { status: 400 }
      );
    }

    const types = documentTypes(documents);

    if (normalizedType === 'COMPANY') {
      if (!companyRegistrationNumber || !tpinNumber || !address || !contactPersonName || !teamSize) {
        return NextResponse.json(
          { message: 'Companies must provide registration number, TPIN, physical address, team size and a contact person.' },
          { status: 400 }
        );
      }

      if (!types.has('BUSINESS_LICENSE') || !types.has('TAX_CLEARANCE') || !(types.has('NRC') || types.has('NATIONAL_ID'))) {
        return NextResponse.json(
          { message: 'Company verification requires company registration, TPIN/tax document and the contact person ID.' },
          { status: 400 }
        );
      }

      if (insured && !types.has('INSURANCE')) {
        return NextResponse.json(
          { message: 'Upload the insurance document when declaring the company as insured.' },
          { status: 400 }
        );
      }
    } else {
      if (!nrcNumber || !profilePhotoUrl) {
        return NextResponse.json(
          { message: 'Individuals must provide an NRC number and professional profile photo.' },
          { status: 400 }
        );
      }

      if (!(types.has('NRC') || types.has('NATIONAL_ID'))) {
        return NextResponse.json(
          { message: 'Individuals must upload an NRC or national ID for verification.' },
          { status: 400 }
        );
      }
    }

    if (category === 'SECURITY') {
      if (!licenseNumber) {
        return NextResponse.json(
          { message: 'Security providers must provide their relevant licence or registration number.' },
          { status: 400 }
        );
      }

      if (!types.has('LICENSE')) {
        return NextResponse.json(
          { message: 'Security providers must upload supporting licence documentation.' },
          { status: 400 }
        );
      }

      if (!types.has('BACKGROUND_CHECK')) {
        return NextResponse.json(
          { message: 'Security providers must upload background/police-clearance evidence for verification.' },
          { status: 400 }
        );
      }
    }

    if (category === 'ELECTRICIAN' && normalizedType === 'INDIVIDUAL') {
      const qualified = types.has('CERTIFICATE') || types.has('QUALIFICATION') || types.has('LICENSE');
      if (!qualified) {
        return NextResponse.json(
          { message: 'Individual electricians must upload a professional qualification, certificate or licence.' },
          { status: 400 }
        );
      }
    }

    const existingProvider = await prisma.serviceProvider.findUnique({
      where: { userId },
    });

    if (existingProvider) {
      return NextResponse.json(
        { message: 'This account already has a service provider profile.' },
        { status: 400 }
      );
    }

    const profileCompletion = calculateCompletion(
      {
        ...body,
        providerType: normalizedType,
      },
      documents
    );

    const provider = await prisma.serviceProvider.create({
      data: {
        userId,
        providerType: normalizedType,
        contactPersonName,
        contactPersonRole,
        profileCompletion,
        verificationStatus: 'PENDING',
        businessName,
        category,
        description,
        bio: description,
        yearsInBusiness: Number(yearsInBusiness || 0),
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        minimumCharge: minimumCharge ? Number(minimumCharge) : null,
        priceRange,
        phone,
        email,
        city,
        area,
        address,
        website,
        whatsappNumber,
        serviceAreas: serviceAreas || [],
        servicesOffered: servicesOffered || [],
        workingHours: workingHours || null,
        languages: languages || [],
        profilePhotoUrl,
        logoUrl,
        coverPhotoUrl,
        nrcNumber,
        companyRegistrationNumber,
        tpinNumber,
        licenseNumber,
        teamSize: teamSize ? Number(teamSize) : null,
        insured: Boolean(insured),
        insuranceProvider: insured ? insuranceProvider : null,
        backgroundCheckedStaff: Boolean(backgroundCheckedStaff),
        emergencyService: Boolean(emergencyService),
        responseTimeText,
        categoryDetails: categoryDetails || null,
        isVerified: false,
        isActive: true,
        isAvailable: true,
      },
    });

    if (documents.length > 0) {
      await prisma.serviceDocument.createMany({
        data: documents.map((doc: any) => ({
          providerId: provider.id,
          type: doc.type,
          fileUrl: doc.url,
          name: doc.name,
          fileSize: doc.fileSize || null,
          mimeType: doc.mimeType || null,
          isVerified: false,
        })),
      });
    }

    return NextResponse.json(
      {
        message: 'Profile submitted for verification.',
        provider,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering provider:', error);
    return NextResponse.json(
      { message: 'Failed to register provider.' },
      { status: 500 }
    );
  }
}
