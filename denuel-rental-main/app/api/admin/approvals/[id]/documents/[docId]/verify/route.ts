import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../../../lib/prisma';
import { requireAuth, requireCsrf } from '../../../../../../../../lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/admin/approvals/[id]/documents/[docId]/verify
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await requireAuth(request, ['ADMIN']);
    requireCsrf(request);

    const { id, docId } = await params;

    const serviceDocument = await prisma.serviceDocument.findFirst({
      where: { id: docId, providerId: id },
    });

    if (serviceDocument) {
      if (!serviceDocument.fileUrl.includes('.private.blob.vercel-storage.com')) {
        return NextResponse.json(
          { error: 'This legacy document must be re-uploaded to private storage before verification.' },
          { status: 409 }
        );
      }

      await prisma.serviceDocument.update({
        where: { id: docId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          verifiedById: user.id,
        },
      });

      return NextResponse.json({ success: true, type: 'service_provider' });
    }

    const driverDocument = await prisma.driverDocument.findFirst({
      where: { id: docId, driverId: id },
    });

    if (driverDocument) {
      if (!driverDocument.fileUrl.includes('.private.blob.vercel-storage.com')) {
        return NextResponse.json(
          { error: 'This driver document must be re-uploaded to private storage before verification.' },
          { status: 409 }
        );
      }

      await prisma.driverDocument.update({
        where: { id: docId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, type: 'driver' });
    }

    return NextResponse.json({ error: 'Document not found for this application' }, { status: 404 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Error verifying application document:', error);
    return NextResponse.json({ error: 'Failed to verify document' }, { status: 500 });
  }
}
