import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// POST - Answer a question
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { questionId, answer } = body;

    if (!questionId || !answer) {
      return NextResponse.json(
        { error: 'Question ID and answer are required' },
        { status: 400 }
      );
    }

    const question = await prisma.propertyQuestion.findUnique({
      where: { id: questionId },
      include: {
        property: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Determine if this is an official answer (from owner/agent)
    const isOfficial = question.property.ownerId === user.id ||
      user.role === 'AGENT' ||
      user.role === 'ADMIN';

    const newAnswer = await prisma.propertyAnswer.create({
      data: {
        questionId,
        answererId: user.id,
        answer,
        isOfficial,
      },
      include: {
        answerer: { select: { id: true, name: true, role: true } },
      },
    });

    // Update question status if official answer
    if (isOfficial) {
      await prisma.propertyQuestion.update({
        where: { id: questionId },
        data: { status: 'ANSWERED' },
      });
    }

    // Notify question asker
    await prisma.notification.create({
      data: {
        userId: question.askerId,
        type: 'QUESTION_ANSWERED',
        data: {
          questionId,
          propertyId: question.propertyId,
          answererName: user.name,
          isOfficial,
        },
      },
    });

    return NextResponse.json(newAnswer, { status: 201 });
  } catch (error) {
    console.error('Create answer error:', error);
    return NextResponse.json({ error: 'Failed to create answer' }, { status: 500 });
  }
}

// PUT - Upvote an answer
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { answerId } = body;

    if (!answerId) {
      return NextResponse.json({ error: 'Answer ID is required' }, { status: 400 });
    }

    const updated = await prisma.propertyAnswer.update({
      where: { id: answerId },
      data: {
        upvotes: { increment: 1 },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Upvote answer error:', error);
    return NextResponse.json({ error: 'Failed to upvote answer' }, { status: 500 });
  }
}
