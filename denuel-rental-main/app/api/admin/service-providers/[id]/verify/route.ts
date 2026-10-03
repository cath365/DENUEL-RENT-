import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST - Verify a service provider
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

    const provider = await prisma.serviceProvider.update({
      where: { id },
      data: { isVerified: true },
    });

    // TODO: Send notification to provider about verification

    return NextResponse.json({
      message: 'Provider verified successfully',
      provider,
    });
  } catch (error) {
    console.error('Error verifying provider:', error);
    return NextResponse.json({ message: 'Failed to verify provider' }, { status: 500 });
  }
}
