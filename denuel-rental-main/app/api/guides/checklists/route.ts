import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get checklists
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const slug = searchParams.get('slug');

    if (slug) {
      const checklist = await prisma.checklist.findUnique({
        where: { slug },
      });

      if (!checklist || !checklist.isPublished) {
        return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
      }

      return NextResponse.json(checklist);
    }

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category) {
      where.category = category;
    }

    const checklists = await prisma.checklist.findMany({
      where,
      orderBy: { title: 'asc' },
    });

    return NextResponse.json(checklists);
  } catch (error) {
    console.error('Fetch checklists error:', error);
    return NextResponse.json({ error: 'Failed to fetch checklists' }, { status: 500 });
  }
}

// POST - Create checklist (admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);
    const body = await req.json();
    const { slug, title, description, category, items } = body;

    if (!slug || !title || !category || !items) {
      return NextResponse.json(
        { error: 'Slug, title, category, and items are required' },
        { status: 400 }
      );
    }

    const checklist = await prisma.checklist.create({
      data: {
        slug,
        title,
        description,
        category,
        items,
      },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch (error) {
    console.error('Create checklist error:', error);
    return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 });
  }
}
