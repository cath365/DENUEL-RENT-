import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';

// GET /api/admin/approvals - Get all service provider applications
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    // Build filters
    const driverFilter: any = {};
    const serviceProviderFilter: any = {};

    if (status && status !== 'all') {
      const statusValue = status.toUpperCase();
      driverFilter.status = statusValue;
      serviceProviderFilter.status = statusValue;
    }

    const applications: any[] = [];

    // Fetch drivers if type is 'all' or 'driver'
    if (!type || type === 'all' || type === 'driver') {
      try {
        const drivers = await prisma.driverProfile.findMany({
          where: driverFilter,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        drivers.forEach((driver: any) => {
          applications.push({
            id: driver.id,
            type: 'driver',
            status: driver.status || 'PENDING',
            createdAt: driver.createdAt,
            user: {
              id: driver.user.id,
              name: driver.user.name,
              email: driver.user.email,
              phone: driver.user.phone || '',
              profileImage: driver.user.profileImage,
            },
            experience: driver.experience || 'Not specified',
            description: driver.bio || 'No description provided',
            serviceAreas: driver.serviceAreas || ['Lusaka'],
            documents: [],
            licenseNumber: driver.licenseNumber,
            vehicleType: driver.vehicleType,
            vehicleMake: driver.vehicleMake,
            vehicleModel: driver.vehicleModel,
            vehicleYear: driver.vehicleYear,
            plateNumber: driver.plateNumber,
          });
        });
      } catch (e) {
        console.log('Driver model not available');
      }
    }

    // Fetch service providers if type is 'all' or specific service type
    const serviceTypes = ['maid', 'cleaner', 'security', 'gardener', 'plumber', 'electrician', 'painter', 'mover'];
    if (!type || type === 'all' || serviceTypes.includes(type)) {
      try {
        const categoryMap: Record<string, string> = {
          maid: 'MAID',
          cleaner: 'CLEANER',
          security: 'SECURITY',
          gardener: 'GARDENER',
          plumber: 'PLUMBER',
          electrician: 'ELECTRICIAN',
          painter: 'PAINTER',
          mover: 'MOVER',
        };

        if (type && type !== 'all' && type !== 'driver') {
          serviceProviderFilter.category = categoryMap[type];
        }

        const providers = await prisma.serviceProvider.findMany({
          where: serviceProviderFilter,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profileImage: true,
              },
            },
            documents: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        providers.forEach((provider: any) => {
          const typeMap: Record<string, string> = {
            MAID: 'maid',
            CLEANER: 'cleaner',
            SECURITY: 'security',
            GARDENER: 'gardener',
            PLUMBER: 'plumber',
            ELECTRICIAN: 'electrician',
            PAINTER: 'painter',
            MOVER: 'mover',
          };

          applications.push({
            id: provider.id,
            type: typeMap[provider.category] || 'cleaner',
            status: provider.isActive ? 'APPROVED' : (provider.isVerified ? 'APPROVED' : 'PENDING'),
            createdAt: provider.createdAt,
            user: {
              id: provider.user?.id,
              name: provider.user?.name || provider.businessName,
              email: provider.user?.email || provider.email,
              phone: provider.user?.phone || provider.phone || '',
              profileImage: provider.user?.profileImage,
            },
            businessName: provider.businessName,
            experience: provider.experience || 'Not specified',
            description: provider.description || 'No description provided',
            serviceAreas: provider.serviceAreas || [provider.city] || ['Lusaka'],
            documents: provider.documents?.map((doc: any) => ({
              id: doc.id,
              type: doc.type,
              name: doc.name,
              url: doc.fileUrl,
              verified: doc.isVerified,
            })) || [],
            services: provider.services || [],
            hourlyRate: provider.hourlyRate,
            availability: provider.availability || [],
          });
        });
      } catch (e) {
        console.log('ServiceProvider model not available');
      }
    }

    // Sort by createdAt
    applications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate stats
    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === 'PENDING').length,
      approved: applications.filter(a => a.status === 'APPROVED').length,
      rejected: applications.filter(a => a.status === 'REJECTED').length,
    };

    return NextResponse.json({ applications, stats });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
