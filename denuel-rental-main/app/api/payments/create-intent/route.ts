import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCsrf } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    requireCsrf(req);

    return NextResponse.json(
      {
        error:
          'Online rent payment is not enabled yet because DENUEL does not have a verified payment-settlement webhook connected to rent records.',
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
