import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get guides
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const slug = searchParams.get('slug');
    const featured = searchParams.get('featured') === 'true';

    if (slug) {
      const guide = await prisma.guide.findUnique({
        where: { slug },
      });

      if (!guide || !guide.isPublished) {
        return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
      }

      // Increment view count
      await prisma.guide.update({
        where: { id: guide.id },
        data: { viewCount: { increment: 1 } },
      });

      return NextResponse.json(guide);
    }

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category) {
      where.category = category;
    }

    const guides = await prisma.guide.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        coverImage: true,
        author: true,
        tags: true,
        readTime: true,
        viewCount: true,
        publishedAt: true,
      },
      orderBy: featured
        ? [{ viewCount: 'desc' }, { publishedAt: 'desc' }]
        : { publishedAt: 'desc' },
    });

    // Get categories
    const categories = await prisma.guide.groupBy({
      by: ['category'],
      where: { isPublished: true },
      _count: { category: true },
    });

    return NextResponse.json({
      guides,
      categories: categories.map((c) => ({
        name: c.category,
        count: c._count.category,
      })),
    });
  } catch (error) {
    console.error('Fetch guides error:', error);
    return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
  }
}

// POST - Create guide (admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMIN']);
    const body = await req.json();
    const {
      slug,
      title,
      excerpt,
      content,
      category,
      coverImage,
      author,
      tags,
      readTime,
      isPublished,
    } = body;

    if (!slug || !title || !content || !category) {
      return NextResponse.json(
        { error: 'Slug, title, content, and category are required' },
        { status: 400 }
      );
    }

    const guide = await prisma.guide.create({
      data: {
        slug,
        title,
        excerpt,
        content,
        category,
        coverImage,
        author,
        tags,
        readTime,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error('Create guide error:', error);
    return NextResponse.json({ error: 'Failed to create guide' }, { status: 500 });
  }
}
