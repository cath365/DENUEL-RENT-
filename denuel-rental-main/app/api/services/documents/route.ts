import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';

const ALLOWED_DOCUMENT_TYPES = new Set([
  'NATIONAL_ID',
  'PASSPORT',
  'BUSINESS_LICENSE',
  'PROOF_OF_ADDRESS',
  'PROPERTY_TITLE',
  'TAX_CLEARANCE',
  'NRC',
  'CERTIFICATE',
  'LICENSE',
  'INSURANCE',
  'QUALIFICATION',
  'REFERENCE',
  'PORTFOLIO',
  'ID_PHOTO',
  'BACKGROUND_CHECK',
  'OTHER',
]);

// GET - Get documents for a provider
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({
      documents: provider.documents.map(({ fileUrl, ...document }) => ({
        ...document,
        fileAccessUrl: '/api/services/documents/' + document.id + '/file',
        storagePrivate: Boolean(fileUrl?.includes('.private.blob.vercel-storage.com')),
      })),
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Error fetching documents:', error);
    return NextResponse.json({ message: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST - Metadata-only document creation is intentionally disabled.
// Verification documents must be uploaded through the private storage endpoint.
export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['SERVICE_PROVIDER', 'ADMIN']);
    requireCsrf(req);
    return NextResponse.json(
      { message: 'Use /api/services/documents/upload for secure verification uploads.' },
      { status: 410 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ message: 'Unable to process document request' }, { status: 500 });
  }
}

// DELETE - Remove document
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['SERVICE_PROVIDER', 'ADMIN']);
    requireCsrf(req);

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ message: 'Document ID required' }, { status: 400 });
    }

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!provider) {
      return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
    }

    // Verify ownership
    const document = await prisma.serviceDocument.findFirst({
      where: { id: docId, providerId: provider.id },
    });

    if (!document) {
      return NextResponse.json({ message: 'Document not found' }, { status: 404 });
    }

    if (document.isVerified) {
      return NextResponse.json(
        { message: 'Verified documents cannot be removed from the provider dashboard.' },
        { status: 409 }
      );
    }

    await prisma.serviceDocument.delete({
      where: { id: docId },
    });

    if (document.fileUrl.includes('.blob.vercel-storage.com')) {
      const token = document.fileUrl.includes('.private.blob.vercel-storage.com')
        ? process.env.PRIVATE_BLOB_READ_WRITE_TOKEN
        : process.env.BLOB_READ_WRITE_TOKEN;

      if (token) {
        try {
          await del(document.fileUrl, { token });
        } catch {
          console.warn('Unable to clean up deleted service verification blob.');
        }
      }
    }

    return NextResponse.json({ message: 'Document deleted' });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Error deleting document:', error);
    return NextResponse.json({ message: 'Failed to delete document' }, { status: 500 });
  }
}
