import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../../../../lib/auth';

// POST /api/admin/approvals/[id]/approve - Approve a service provider application
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request, ['ADMIN']);
    requireCsrf(request);

    const { id } = await params;

    // Try to find and update driver first
    try {
      const driver = await prisma.driverProfile.findUnique({
        where: { id },
        include: {
          documents: true,
          user: {
            select: { isSuspended: true },
          },
        },
      });

      if (driver) {
        if (driver.user.isSuspended) {
          return NextResponse.json(
            { error: 'Suspended users cannot be approved as drivers.' },
            { status: 409 }
          );
        }

        const requiredDriverDocuments = [
          'NRC',
          'DRIVER_LICENSE',
          'VEHICLE_REGISTRATION',
          'INSURANCE',
          'POLICE_CLEARANCE',
        ];

        const missing = requiredDriverDocuments.filter(
          (type) => !driver.documents.some((document) => document.type === type)
        );
        const unverified = requiredDriverDocuments.filter(
          (type) => driver.documents.some((document) => document.type === type && !document.isVerified)
        );
        const insecure = requiredDriverDocuments.filter(
          (type) => driver.documents.some(
            (document) =>
              document.type === type &&
              !document.fileUrl.includes('.private.blob.vercel-storage.com')
          )
        );

        if (missing.length || unverified.length || insecure.length) {
          return NextResponse.json(
            {
              error: 'Driver documents must be uploaded privately and verified before approval.',
              missing,
              unverified,
              insecure,
            },
            { status: 400 }
          );
        }

        await prisma.driverProfile.update({
          where: { id },
          data: {
            isApproved: true,
            isOnline: false,
            verificationStatus: 'VERIFIED',
            rejectionReason: null,
          },
        });

        try {
          await prisma.notification.create({
            data: {
              userId: driver.userId,
              type: 'APPLICATION_APPROVED',
              data: {
                title: 'Driver application approved',
                message: 'Your driver application has been approved. You can now go online and accept matching transport requests.',
              },
            },
          });
        } catch (notificationError) {
          console.log('Could not create driver approval notification');
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
          (type) => !provider.documents.some((doc) => doc.type === type)
        );
        const unverified = required.filter(
          (type) => provider.documents.some((doc) => doc.type === type && !doc.isVerified)
        );
        const insecure = required.filter(
          (type) => provider.documents.some(
            (doc) =>
              doc.type === type &&
              !doc.fileUrl.includes('.private.blob.vercel-storage.com')
          )
        );

        if (missing.length > 0 || unverified.length > 0 || insecure.length > 0) {
          return NextResponse.json(
            {
              error: 'Required documents must be uploaded privately and verified before approval',
              missing,
              unverified,
              insecure,
            },
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
    if (error instanceof Response) return error;
    console.error('Error approving application:', error);
    return NextResponse.json({ error: 'Failed to approve application' }, { status: 500 });
  }
}
