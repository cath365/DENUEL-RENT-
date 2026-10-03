import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// PATCH - Update provider (admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    const updateData: Record<string, unknown> = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;

    const provider = await prisma.serviceProvider.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({ message: 'Failed to update provider' }, { status: 500 });
  }
}

// DELETE - Delete provider (admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.serviceProvider.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Provider deleted' });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json({ message: 'Failed to delete provider' }, { status: 500 });
  }
}
