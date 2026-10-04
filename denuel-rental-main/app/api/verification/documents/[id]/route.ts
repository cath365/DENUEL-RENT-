import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { createPresignedDownloadUrl } from '@/lib/s3';
import { publicServerError } from '@/lib/publicError';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);

    const document = await prisma.verificationDocument.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        documentUrl: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Verification document not found.' },
        { status: 404 }
      );
    }

    if (document.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden.' },
        { status: 403 }
      );
    }

    if (document.documentUrl.startsWith('s3-private:')) {
      const key = document.documentUrl.slice('s3-private:'.length);
      const signedUrl = await createPresignedDownloadUrl(key, 300);
      return NextResponse.redirect(signedUrl);
    }

    // Legacy records may contain an older direct URL.
    // Access to the URL remains gated through this authorized route.
    if (/^https?:\/\//i.test(document.documentUrl)) {
      return NextResponse.redirect(document.documentUrl);
    }

    return NextResponse.json(
      { error: 'This verification document has an unsupported storage reference.' },
      { status: 409 }
    );
  } catch (error) {
    if (error instanceof Response) return error;

    console.error('Verification document read failed', error);
    const safe = publicServerError(
      error,
      'Unable to open this verification document.'
    );

    return NextResponse.json(
      { error: safe.message },
      { status: safe.status }
    );
  }
}
