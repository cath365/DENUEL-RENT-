import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

function requiredDocumentTypes(provider: any) {
  const types: string[] = [];

  if (provider.providerType === 'COMPANY') {
    types.push('BUSINESS_LICENSE', 'TAX_CLEARANCE');
    if (provider.category === 'SECURITY') types.push('LICENSE');
    if (provider.insured) types.push('INSURANCE');
  } else {
    types.push('NRC');
    if (provider.category === 'SECURITY') types.push('LICENSE', 'BACKGROUND_CHECK');
  }

  return types;
}

// POST - Verify a service provider only when required documents are verified
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const provider = await prisma.serviceProvider.findUnique({
      where: { id },
      include: { documents: true },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    const required = requiredDocumentTypes(provider);
    const missing = required.filter(
      (type) => !provider.documents.some((doc) => doc.type === type && doc.isVerified)
    );

    if (missing.length > 0) {
      return NextResponse.json(
        {
          message: 'Required verification documents are still missing or unverified.',
          missing,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.serviceProvider.update({
      where: { id },
      data: {
        isVerified: true,
        isActive: true,
        verificationStatus: 'VERIFIED',
        rejectionReason: null,
      },
    });

    if (updated.userId) {
      try {
        await prisma.notification.create({
          data: {
            userId: updated.userId,
            type: 'APPLICATION_APPROVED',
            data: {
              title: 'Service provider verified',
              message: `${updated.businessName} has been verified by DENUEL.`,
            },
          },
        });
      } catch {
        // Verification must not fail if notification delivery is unavailable.
      }
    }

    return NextResponse.json({
      message: 'Provider verified successfully',
      provider: updated,
    });
  } catch (error) {
    console.error('Error verifying provider:', error);
    return NextResponse.json({ message: 'Failed to verify provider' }, { status: 500 });
  }
}
