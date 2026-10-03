import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST - Verify a service document
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

    const document = await prisma.serviceDocument.update({
      where: { id },
      data: { 
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Document verified successfully',
      document,
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    return NextResponse.json({ message: 'Failed to verify document' }, { status: 500 });
  }
}
