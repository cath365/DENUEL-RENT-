import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import { publicServerError } from '../../../lib/publicError';

// GET /api/payments - Genuine platform payment records for the signed-in user.
export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ payments });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Platform payment history failed', error);
    const safe = publicServerError(error, 'Unable to load payment history.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}

// Generic payment initiation is intentionally disabled.
// Product-specific payment routes must be tied to a real record and a configured provider.
export async function POST() {
  return NextResponse.json(
    {
      error:
        'Generic payment initiation is disabled. Use the payment flow connected to the real transaction you are paying.',
    },
    { status: 405 }
  );
}
