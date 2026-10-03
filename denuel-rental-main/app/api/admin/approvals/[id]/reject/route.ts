import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth';

// POST /api/admin/approvals/[id]/reject - Reject a service provider application
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
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    // Try to find and update driver first
    try {
      const driver = await prisma.driverProfile.findUnique({ where: { id } });
      if (driver) {
        await prisma.driverProfile.update({
          where: { id },
          data: {
            isApproved: false,
          },
        });

        // Send notification to the driver
        try {
          await prisma.notification.create({
            data: {
              userId: driver.userId,
              type: 'APPLICATION_REJECTED',
              data: {
                title: 'Application Update',
                message: `Your driver application was not approved. Reason: ${reason}. You may reapply after addressing the issues.`,
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
      const provider = await prisma.serviceProvider.findUnique({ where: { id } });
      if (provider) {
        await prisma.serviceProvider.update({
          where: { id },
          data: {
            isVerified: false,
            isActive: false,
            rejectionReason: reason,
          },
        });

        // Send notification
        try {
          if (provider.userId) {
            await prisma.notification.create({
              data: {
                userId: provider.userId,
                type: 'APPLICATION_REJECTED',
                data: {
                  title: 'Application Update',
                  message: `Your service provider application for ${provider.businessName} was not approved. Reason: ${reason}. You may reapply after addressing the issues.`,
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
    console.error('Error rejecting application:', error);
    return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
  }
}
