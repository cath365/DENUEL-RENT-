import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireCsrf } from '@/lib/auth';
import { createPresignedUploadUrl } from '@/lib/s3';
import { publicServerError } from '@/lib/publicError';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireCsrf(req);

    const body = await req.json().catch(() => ({}));
    const filename =
      typeof body.filename === 'string' ? body.filename.trim() : '';
    const contentType =
      typeof body.contentType === 'string' ? body.contentType : '';
    const size = Number(body.size);

    if (
      !filename ||
      !ALLOWED_TYPES.has(contentType) ||
      !Number.isFinite(size) ||
      size <= 0 ||
      size > MAX_SIZE
    ) {
      return NextResponse.json(
        {
          error:
            'Use a PDF, JPG, PNG or WebP verification document up to 10 MB.',
        },
        { status: 400 }
      );
    }

    if (
      !process.env.AWS_REGION ||
      !process.env.S3_BUCKET ||
      !process.env.AWS_ACCESS_KEY_ID
    ) {
      return NextResponse.json(
        {
          error:
            'Private verification-document storage is not configured yet.',
        },
        { status: 503 }
      );
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key =
      `verification/${user.id}/${Date.now()}-${safeName}`;

    const upload = await createPresignedUploadUrl(key, contentType);

    return NextResponse.json({
      uploadUrl: upload.url,
      documentKey: key,
    });
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Verification upload URL failed', error);
    const safe = publicServerError(
      error,
      'Unable to prepare private verification storage.'
    );

    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
