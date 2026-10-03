import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    
    // Get service provider profile
    const profile = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
      include: {
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: { name: true }
            }
          }
        },
        documents: true,
        portfolio: {
          take: 6,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    return NextResponse.json({ profile });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Service profile error:', e);
    return NextResponse.json({ profile: null });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    
    // Check if profile already exists
    const existing = await prisma.serviceProvider.findUnique({
      where: { userId: user.id }
    });
    
    if (existing) {
      // Update existing profile
      const updated = await prisma.serviceProvider.update({
        where: { userId: user.id },
        data: {
          businessName: body.businessName,
          category: body.category,
          description: body.description,
          phone: body.phone,
          email: body.email,
          website: body.website,
          address: body.address,
          city: body.city,
          area: body.area,
          latitude: body.latitude,
          longitude: body.longitude,
          logoUrl: body.logoUrl,
          profilePhotoUrl: body.profilePhotoUrl,
          servicesOffered: body.servicesOffered,
          priceRange: body.priceRange,
          hourlyRate: body.hourlyRate,
          minimumCharge: body.minimumCharge,
          yearsInBusiness: body.yearsInBusiness,
          licenseNumber: body.licenseNumber,
          nrcNumber: body.nrcNumber,
          tpinNumber: body.tpinNumber,
          bio: body.bio,
          workingHours: body.workingHours,
          serviceAreas: body.serviceAreas,
          languages: body.languages
        }
      });
      return NextResponse.json({ profile: updated });
    }
    
    // Create new profile
    const profile = await prisma.serviceProvider.create({
      data: {
        userId: user.id,
        businessName: body.businessName,
        category: body.category,
        description: body.description,
        phone: body.phone,
        email: body.email || user.email,
        website: body.website,
        address: body.address,
        city: body.city,
        area: body.area,
        latitude: body.latitude,
        longitude: body.longitude,
        logoUrl: body.logoUrl,
        profilePhotoUrl: body.profilePhotoUrl,
        servicesOffered: body.servicesOffered,
        priceRange: body.priceRange,
        hourlyRate: body.hourlyRate,
        minimumCharge: body.minimumCharge,
        yearsInBusiness: body.yearsInBusiness,
        licenseNumber: body.licenseNumber,
        nrcNumber: body.nrcNumber,
        tpinNumber: body.tpinNumber,
        bio: body.bio,
        workingHours: body.workingHours,
        serviceAreas: body.serviceAreas,
        languages: body.languages
      }
    });
    
    return NextResponse.json({ profile });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Service profile create error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to create profile' }, { status: 500 });
  }
}
