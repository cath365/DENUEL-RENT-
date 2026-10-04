import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth';
import { publicServerError } from '../../../../../../lib/publicError';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, ['ADMIN']);
    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (reason.length < 5) {
      return NextResponse.json(
        { error: 'Give the property owner a clear rejection reason.' },
        { status: 422 }
      );
    }

    const property = await prisma.property.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: property.ownerId,
          type: 'PROPERTY_REJECTED',
          data: {
            title: 'Property needs changes',
            message: reason,
            propertyId: property.id,
          },
        },
      });
    } catch {
      // Rejection should not fail if notification delivery fails.
    }

    return NextResponse.json({ property });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Property rejection failed', error);
    const safe = publicServerError(error, 'Unable to reject this property.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
