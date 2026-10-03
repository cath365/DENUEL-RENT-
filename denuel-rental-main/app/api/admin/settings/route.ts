import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Fetch system settings (public for reading colors/branding)
export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'main' }
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'main' }
      });
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update system settings (admin only)
export async function PUT(req: Request) {
  return handleUpdate(req);
}

// POST - Alternative method for updating (some clients prefer POST)
export async function POST(req: Request) {
  return handleUpdate(req);
}

async function handleUpdate(req: Request) {
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

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'main' },
      update: body,
      create: { id: 'main', ...body }
    });

    return NextResponse.json({ settings, message: 'Settings updated successfully' });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
