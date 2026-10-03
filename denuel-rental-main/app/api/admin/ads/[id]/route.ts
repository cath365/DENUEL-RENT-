import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Fetch single ad
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ad = await prisma.advertisement.findUnique({
      where: { id: params.id }
    });

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    return NextResponse.json({ ad });
  } catch (error: any) {
    console.error('Error fetching ad:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update ad (admin only)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    let user;
    try {
      user = await requireAuth(req, ['ADMIN']);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Remove fields that shouldn't be updated directly
    delete body.id;
    delete body.createdAt;
    delete body.updatedAt;
    delete body.impressions;
    delete body.clicks;

    // Convert dates if provided
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);

    const ad = await prisma.advertisement.update({
      where: { id: params.id },
      data: body
    });

    return NextResponse.json({ ad, message: 'Ad updated successfully' });
  } catch (error: any) {
    console.error('Error updating ad:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete ad (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    let user;
    try {
      user = await requireAuth(req, ['ADMIN']);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.advertisement.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Ad deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting ad:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Track ad impression or click
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { action } = body; // 'impression' or 'click'

    if (!['impression', 'click'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const ad = await prisma.advertisement.update({
      where: { id: params.id },
      data: {
        [action === 'impression' ? 'impressions' : 'clicks']: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking ad:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
