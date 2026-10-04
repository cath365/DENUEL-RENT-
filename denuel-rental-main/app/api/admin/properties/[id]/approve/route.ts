import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth';
import { publicServerError } from '../../../../../../lib/publicError';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, ['ADMIN']);

    const property = await prisma.property.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        rejectionReason: null,
      },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    try {
      await prisma.notification.create({
        data: {
          userId: property.ownerId,
          type: 'PROPERTY_APPROVED',
          data: {
            title: 'Property approved',
            message: `Your property "${property.title}" is now live on Ng'anda.`,
            propertyId: property.id,
          },
        },
      });
    } catch {
      // Approval should not fail if notification delivery fails.
    }

    return NextResponse.json({ property });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Property approval failed', error);
    const safe = publicServerError(error, 'Unable to approve this property.');
    return NextResponse.json({ error: safe.message }, { status: safe.status });
  }
}
