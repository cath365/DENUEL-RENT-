import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeDispositionName(value: string) {
  return value.replace(/[\r\n"]/g, '_').slice(0, 160) || 'document';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(req);

    const document = await prisma.driverDocument.findUnique({
      where: { id: params.id },
      include: {
        driver: {
          select: { userId: true },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const ownsDocument = document.driver.userId === user.id;
    if (!ownsDocument && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isPrivateBlob = document.fileUrl.includes('.private.blob.vercel-storage.com');
    const token = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;

    if (isPrivateBlob && !token) {
      return NextResponse.json({ error: 'Private document storage is unavailable' }, { status: 503 });
    }

    const upstream = await fetch(document.fileUrl, {
      cache: 'no-store',
      headers: isPrivateBlob && token ? { Authorization: 'Bearer ' + token } : undefined,
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Unable to open document' }, { status: upstream.status || 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || document.mimeType || 'application/octet-stream',
        'Content-Disposition': 'inline; filename="' + safeDispositionName(document.name) + '"',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Driver document access error:', error);
    return NextResponse.json({ error: 'Unable to open driver document' }, { status: 500 });
  }
}
