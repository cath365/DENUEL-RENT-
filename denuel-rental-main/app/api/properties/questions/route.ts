import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, getUser } from '@/lib/auth';

// GET - Get questions for a property
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      propertyId,
      isPublic: true,
    };

    if (status) {
      where.status = status;
    }

    const questions = await prisma.propertyQuestion.findMany({
      where,
      include: {
        asker: { select: { id: true, name: true } },
        answers: {
          include: {
            answerer: { select: { id: true, name: true, role: true } },
          },
          orderBy: [
            { isOfficial: 'desc' },
            { upvotes: 'desc' },
            { createdAt: 'asc' },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Fetch property questions error:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST - Ask a question
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, question, isPublic } = body;

    if (!propertyId || !question) {
      return NextResponse.json(
        { error: 'Property ID and question are required' },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const newQuestion = await prisma.propertyQuestion.create({
      data: {
        propertyId,
        askerId: user.id,
        question,
        isPublic: isPublic ?? true,
      },
      include: {
        asker: { select: { id: true, name: true } },
      },
    });

    // Notify property owner
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        type: 'PROPERTY_QUESTION',
        data: {
          questionId: newQuestion.id,
          propertyId,
          propertyTitle: property.title,
          askerName: user.name,
          question: question.substring(0, 100),
        },
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    console.error('Create property question error:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}
