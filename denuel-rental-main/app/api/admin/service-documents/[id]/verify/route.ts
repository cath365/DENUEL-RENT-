import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';

// POST - Verify a service document
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req, ['ADMIN']);
    requireCsrf(req);

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
    if (error instanceof Response) return error;
    console.error('Error verifying document:', error);
    return NextResponse.json({ message: 'Failed to verify document' }, { status: 500 });
  }
}
