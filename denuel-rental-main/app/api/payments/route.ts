import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/payments - Real payment records owned by the signed-in user.
export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ payments });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Payment history error:', error);
    return NextResponse.json(
      { error: 'Unable to load payment history' },
      { status: 500 }
    );
  }
}

// Payment initiation is intentionally disabled until a production gateway
// creates a real provider reference and settlement is verified server-side.
export async function POST(req: Request) {
  try {
    await requireAuth(req);
    requireCsrf(req);

    return NextResponse.json(
      {
        error:
          'Online payment initiation is not enabled yet because no verified gateway settlement flow is connected.',
      },
      { status: 503 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Unable to process payment request' },
      { status: 500 }
    );
  }
}
