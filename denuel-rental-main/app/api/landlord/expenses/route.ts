import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET - Get landlord expenses
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const where: Record<string, unknown> = {
      landlordId: user.id,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (category) {
      where.category = category;
    }

    if (year) {
      const startDate = new Date(parseInt(year), month ? parseInt(month) - 1 : 0, 1);
      const endDate = month
        ? new Date(parseInt(year), parseInt(month), 0)
        : new Date(parseInt(year) + 1, 0, 0);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const expenses = await prisma.landlordExpense.findMany({
      where,
      include: {
        property: {
          select: { id: true, title: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate totals by category
    const byCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate totals by property
    const byProperty = expenses.reduce((acc, expense) => {
      const key = expense.property.title;
      acc[key] = (acc[key] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Monthly totals
    const byMonth = expenses.reduce((acc, expense) => {
      const key = expense.date.toISOString().slice(0, 7); // YYYY-MM
      acc[key] = (acc[key] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      expenses,
      summary: {
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        count: expenses.length,
        byCategory,
        byProperty,
        byMonth,
      },
    });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

// POST - Create expense
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      propertyId,
      category,
      description,
      amount,
      date,
      receiptUrl,
      vendor,
      isRecurring,
      recurringFrequency,
    } = body;

    if (!propertyId || !category || !description || !amount || !date) {
      return NextResponse.json(
        { error: 'Property, category, description, amount, and date are required' },
        { status: 400 }
      );
    }

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.ownerId !== user.id) {
      return NextResponse.json({ error: 'Property not found or unauthorized' }, { status: 404 });
    }

    const expense = await prisma.landlordExpense.create({
      data: {
        propertyId,
        landlordId: user.id,
        category,
        description,
        amount,
        date: new Date(date),
        receiptUrl,
        vendor,
        isRecurring: isRecurring || false,
        recurringFrequency,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

// PUT - Update expense
export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { expenseId, ...updates } = body;

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const expense = await prisma.landlordExpense.findFirst({
      where: { id: expenseId, landlordId: user.id },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    const updated = await prisma.landlordExpense.update({
      where: { id: expenseId },
      data: updates,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update expense error:', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

// DELETE - Delete expense
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get('id');

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    await prisma.landlordExpense.deleteMany({
      where: { id: expenseId, landlordId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete expense error:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
