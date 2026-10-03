import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get portfolio items for a provider
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      // Get current user's portfolio
      const user = await requireAuth(req);
      if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      const provider = await prisma.serviceProvider.findUnique({
        where: { userId: user.id },
        include: {
          portfolio: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!provider) {
        return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
      }

      return NextResponse.json({ portfolio: provider.portfolio });
    }

    // Get specific provider's portfolio
    const portfolio = await prisma.servicePortfolio.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ message: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

// POST - Add portfolio item
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, imageUrl, category, projectDate } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { message: 'Title and image are required' },
        { status: 400 }
      );
    }

    const portfolioItem = await prisma.servicePortfolio.create({
      data: {
        providerId: provider.id,
        title,
        description,
        imageUrl,
        category,
        projectDate: projectDate ? new Date(projectDate) : null,
      },
    });

    return NextResponse.json({
      message: 'Portfolio item added successfully',
      item: portfolioItem,
    });
  } catch (error) {
    console.error('Error creating portfolio item:', error);
    return NextResponse.json({ message: 'Failed to add portfolio item' }, { status: 500 });
  }
}

// DELETE - Remove portfolio item
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ message: 'Item ID required' }, { status: 400 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    // Verify ownership
    const item = await prisma.servicePortfolio.findFirst({
      where: { id: itemId, providerId: provider.id },
    });

    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    await prisma.servicePortfolio.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ message: 'Portfolio item deleted' });
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    return NextResponse.json({ message: 'Failed to delete portfolio item' }, { status: 500 });
  }
}
