import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - List all service providers (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const verified = searchParams.get('verified');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    
    if (verified === 'true') {
      where.isVerified = true;
    } else if (verified === 'false') {
      where.isVerified = false;
    }

    if (category) {
      where.category = category;
    }

    const [providers, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true },
          },
          documents: {
            orderBy: { uploadedAt: 'desc' },
          },
          _count: {
            select: { bookings: true, reviews: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceProvider.count({ where }),
    ]);

    return NextResponse.json({
      providers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ message: 'Failed to fetch providers' }, { status: 500 });
  }
}
