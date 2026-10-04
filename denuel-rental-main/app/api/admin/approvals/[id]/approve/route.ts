import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth';

// POST /api/admin/approvals/[id]/approve - Approve a service provider application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Try to find and update driver first
    try {
      const driver = await prisma.driverProfile.findUnique({ where: { id } });
      if (driver) {
        await prisma.driverProfile.update({
          where: { id },
          data: {
            isApproved: true,
          },
        });

        // Send notification to the driver
        try {
          await prisma.notification.create({
            data: {
              userId: driver.userId,
              type: 'APPLICATION_APPROVED',
              data: {
                title: 'Application Approved!',
                message: 'Congratulations! Your driver application has been approved. You can now start accepting ride requests.',
              },
            },
          });
        } catch (e) {
          console.log('Could not create notification');
        }

        return NextResponse.json({ success: true, type: 'driver' });
      }
    } catch (e) {
      console.log('Driver model not available');
    }

    // Try service provider
    try {
      const provider = await prisma.serviceProvider.findUnique({
        where: { id },
        include: { documents: true },
      });
      if (provider) {
        const required: string[] = [];
        if (provider.providerType === 'COMPANY') {
          required.push('BUSINESS_LICENSE', 'TAX_CLEARANCE', 'NRC');
          if (provider.category === 'SECURITY') required.push('LICENSE', 'BACKGROUND_CHECK');
          if (provider.insured) required.push('INSURANCE');
        } else {
          required.push('NRC');
          if (provider.category === 'SECURITY') required.push('LICENSE', 'BACKGROUND_CHECK');
          if (provider.category === 'ELECTRICIAN') required.push('QUALIFICATION');
        }

        const missing = required.filter(
          (type) => !provider.documents.some((doc) => doc.type === type && doc.isVerified)
        );

        if (missing.length > 0) {
          return NextResponse.json(
            { error: 'Required documents are still missing or unverified', missing },
            { status: 400 }
          );
        }
        await prisma.serviceProvider.update({
          where: { id },
          data: {
            isVerified: true,
            isActive: true,
            verificationStatus: 'VERIFIED',
            rejectionReason: null,
          },
        });

        // Send notification
        try {
          if (provider.userId) {
            await prisma.notification.create({
              data: {
                userId: provider.userId,
                type: 'APPLICATION_APPROVED',
                data: {
                  title: 'Application Approved!',
                  message: `Congratulations! Your service provider application for ${provider.businessName} has been approved. You can now start receiving job requests.`,
                },
              },
            });
          }
        } catch (e) {
          console.log('Could not create notification');
        }

        return NextResponse.json({ success: true, type: 'service_provider' });
      }
    } catch (e) {
      console.log('ServiceProvider model not available');
    }

    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  } catch (error) {
    console.error('Error approving application:', error);
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
  }
}
