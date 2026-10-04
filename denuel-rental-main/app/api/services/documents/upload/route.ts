import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set([
  'NATIONAL_ID',
  'PASSPORT',
  'BUSINESS_LICENSE',
  'PROOF_OF_ADDRESS',
  'TAX_CLEARANCE',
  'NRC',
  'CERTIFICATE',
  'LICENSE',
  'INSURANCE',
  'QUALIFICATION',
  'REFERENCE',
  'BACKGROUND_CHECK',
  'OTHER',
]);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, ['SERVICE_PROVIDER', 'ADMIN']);
    requireCsrf(req);

    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: user.id },
      include: { documents: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Service provider profile not found' }, { status: 404 });
    }

    const form = await req.formData();
    const file = form.get('file');
    const type = String(form.get('type') || '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Document file is required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Unsupported verification document type' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only PDF, JPG, PNG and WEBP files are allowed' }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Document must be between 1 byte and 10MB' }, { status: 400 });
    }

    const existing = provider.documents.find((document) => document.type === type);
    if (existing?.isVerified) {
      return NextResponse.json(
        { error: 'A verified document cannot be replaced. Contact DENUEL support or an administrator if it must be changed.' },
        { status: 409 }
      );
    }

    const token = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'Private verification storage is not configured.' },
        { status: 503 }
      );
    }

    const pathname = [
      'service-verification',
      provider.id,
      type.toLowerCase(),
      Date.now() + '-' + safeFileName(file.name || 'document'),
    ].join('/');

    const blob = await put(pathname, file, {
      access: 'private',
      token,
      contentType: file.type,
      addRandomSuffix: true,
    });

    const document = await prisma.$transaction(async (tx) => {
      if (existing && !existing.isVerified) {
        await tx.serviceDocument.delete({ where: { id: existing.id } });
      }

      return tx.serviceDocument.create({
        data: {
          providerId: provider.id,
          type: type as any,
          name: file.name,
          fileUrl: blob.url,
          fileSize: file.size,
          mimeType: file.type,
          isVerified: false,
        },
      });
    });

    return NextResponse.json({
      document: {
        id: document.id,
        type: document.type,
        name: document.name,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        isVerified: document.isVerified,
        uploadedAt: document.uploadedAt,
        fileAccessUrl: '/api/services/documents/' + document.id + '/file',
      },
      message: 'Document uploaded securely and is waiting for admin review.',
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Private verification upload error:', error);
    return NextResponse.json({ error: 'Unable to upload verification document' }, { status: 500 });
  }
}
