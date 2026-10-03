import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../../../lib/auth';

// POST /api/admin/approvals/[id]/documents/[docId]/verify - Verify a document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, docId } = await params;

    // Try to update service document
    try {
      const document = await prisma.serviceDocument.findUnique({ 
        where: { id: docId } 
      });

      if (document) {
        await prisma.serviceDocument.update({
          where: { id: docId },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
            verifiedById: user.id,
          },
        });

        return NextResponse.json({ success: true });
      }
    } catch (e) {
      console.log('ServiceDocument model not available or document not found');
    }

    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  } catch (error) {
    console.error('Error verifying document:', error);
    return NextResponse.json({ error: 'Failed to verify document' }, { status: 500 });
  }
}
