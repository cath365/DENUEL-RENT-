import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';
import { publicServerError } from '@/lib/publicError';

export const dynamic = 'force-dynamic';

const EXPENSE_CATEGORIES = new Set([
  'MAINTENANCE',
  'TAXES',
  'INSURANCE',
  'UTILITIES',
  'MORTGAGE',
  'HOA',
  'OTHER',
]);

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, [
      'LANDLORD',
      'AGENT',
      'ADMIN',
    ]);

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const where: any = {
      landlordId: user.id,
    };

    if (propertyId) where.propertyId = propertyId;
    if (category && EXPENSE_CATEGORIES.has(category)) {
      where.category = category;
    }

    if (year) {
      const parsedYear = Number(year);
      const parsedMonth = month ? Number(month) : null;

      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 2000 ||
        parsedYear > 2200 ||
        (parsedMonth !== null &&
          (!Number.isInteger(parsedMonth) ||
            parsedMonth < 1 ||
            parsedMonth > 12))
      ) {
        return NextResponse.json(
          { error: 'Invalid expense date filter.' },
          { status: 400 }
        );
      }

      const startDate = new Date(
        parsedYear,
        parsedMonth ? parsedMonth - 1 : 0,
        1
      );

      const endDate = parsedMonth
        ? new Date(parsedYear, parsedMonth, 1)
        : new Date(parsedYear + 1, 0, 1);

      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    const expenses = await prisma.landlordExpense.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const byCategory = expenses.reduce(
      (acc, expense) => {
        acc[expense.category] =
          (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const byProperty = expenses.reduce(
      (acc, expense) => {
        const key = expense.property.title;
        acc[key] = (acc[key] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const byMonth = expenses.reduce(
      (acc, expense) => {
        const key = expense.date.toISOString().slice(0, 7);
        acc[key] = (acc[key] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      expenses,
      summary: {
        total: expenses.reduce(
          (sum, expense) => sum + expense.amount,
          0
        ),
        count: expenses.length,
        byCategory,
        byProperty,
        byMonth,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Fetch expenses error:', error);
    const safe = publicServerError(
      error,
      'Unable to load property expenses.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, [
      'LANDLORD',
      'AGENT',
      'ADMIN',
    ]);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const propertyId =
      typeof body.propertyId === 'string' ? body.propertyId : '';
    const category =
      typeof body.category === 'string' ? body.category : '';
    const description =
      typeof body.description === 'string'
        ? body.description.trim().slice(0, 500)
        : '';
    const amount = Number(body.amount);
    const date = body.date ? new Date(body.date) : null;
    const receiptUrl =
      typeof body.receiptUrl === 'string' && body.receiptUrl.trim()
        ? body.receiptUrl.trim()
        : null;
    const vendor =
      typeof body.vendor === 'string' && body.vendor.trim()
        ? body.vendor.trim().slice(0, 200)
        : null;
    const isRecurring = body.isRecurring === true;
    const recurringFrequency =
      typeof body.recurringFrequency === 'string' &&
      body.recurringFrequency.trim()
        ? body.recurringFrequency.trim().slice(0, 50)
        : null;

    if (
      !propertyId ||
      !EXPENSE_CATEGORIES.has(category) ||
      !description ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !date ||
      Number.isNaN(date.getTime())
    ) {
      return NextResponse.json(
        {
          error:
            'Property, valid category, description, positive amount and date are required.',
        },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (
      !property ||
      (property.ownerId !== user.id && user.role !== 'ADMIN')
    ) {
      return NextResponse.json(
        { error: 'Property not found or you do not manage it.' },
        { status: 404 }
      );
    }

    const expense = await prisma.landlordExpense.create({
      data: {
        propertyId,
        landlordId: user.id,
        category: category as any,
        description,
        amount,
        date,
        receiptUrl,
        vendor,
        isRecurring,
        recurringFrequency:
          isRecurring ? recurringFrequency : null,
      },
      include: {
        property: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Create expense error:', error);
    const safe = publicServerError(
      error,
      'Unable to record this expense.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req, [
      'LANDLORD',
      'AGENT',
      'ADMIN',
    ]);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const expenseId =
      typeof body.expenseId === 'string' ? body.expenseId : '';

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required.' },
        { status: 400 }
      );
    }

    const expense = await prisma.landlordExpense.findUnique({
      where: { id: expenseId },
    });

    if (
      !expense ||
      (expense.landlordId !== user.id && user.role !== 'ADMIN')
    ) {
      return NextResponse.json(
        { error: 'Expense not found.' },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      const description =
        typeof body.description === 'string'
          ? body.description.trim().slice(0, 500)
          : '';
      if (!description) {
        return NextResponse.json(
          { error: 'Expense description cannot be empty.' },
          { status: 400 }
        );
      }
      updates.description = description;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json(
          { error: 'Expense amount must be positive.' },
          { status: 400 }
        );
      }
      updates.amount = amount;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'category')) {
      if (
        typeof body.category !== 'string' ||
        !EXPENSE_CATEGORIES.has(body.category)
      ) {
        return NextResponse.json(
          { error: 'Invalid expense category.' },
          { status: 400 }
        );
      }
      updates.category = body.category;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'date')) {
      const date = new Date(body.date);
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expense date.' },
          { status: 400 }
        );
      }
      updates.date = date;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No permitted expense update was provided.' },
        { status: 400 }
      );
    }

    const updated = await prisma.landlordExpense.update({
      where: { id: expenseId },
      data: updates,
      include: {
        property: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Update expense error:', error);
    const safe = publicServerError(
      error,
      'Unable to update this expense.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req, [
      'LANDLORD',
      'AGENT',
      'ADMIN',
    ]);
    requireCsrf(req);

    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get('id');

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required.' },
        { status: 400 }
      );
    }

    const expense = await prisma.landlordExpense.findUnique({
      where: { id: expenseId },
      select: { landlordId: true },
    });

    if (
      !expense ||
      (expense.landlordId !== user.id && user.role !== 'ADMIN')
    ) {
      return NextResponse.json(
        { error: 'Expense not found.' },
        { status: 404 }
      );
    }

    await prisma.landlordExpense.delete({
      where: { id: expenseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Delete expense error:', error);
    const safe = publicServerError(
      error,
      'Unable to delete this expense.'
    );
    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
