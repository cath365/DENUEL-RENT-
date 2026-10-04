import { NextRequest, NextResponse } from 'next/server';
import { del, put } from '@vercel/blob';
import prisma from '@/lib/prisma';
import { requireAuth, requireCsrf } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUIRED_TYPES = new Set([
  'NRC',
  'DRIVER_LICENSE',
  'VEHICLE_REGISTRATION',
  'INSURANCE',
  'POLICE_CLEARANCE',
]);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_FILE_SIZE = 4 * 1024 * 1024;

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
}

async function cleanupManagedBlob(url?: string | null) {
  if (!url || !url.includes('.blob.vercel-storage.com')) return;

  const token = url.includes('.private.blob.vercel-storage.com')
    ? process.env.PRIVATE_BLOB_READ_WRITE_TOKEN
    : process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) return;

  try {
    await del(url, { token });
  } catch {
    console.warn('Unable to clean up an old driver verification blob.');
  }
}

export async function POST(req: NextRequest) {
  let newlyUploadedUrl: string | null = null;

  try {
    const user = await requireAuth(req, ['DRIVER']);
    requireCsrf(req);

    const driver = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
      include: { documents: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Create your driver profile before uploading documents.' }, { status: 404 });
    }

    const form = await req.formData();
    const file = form.get('file');
    const type = String(form.get('type') || '');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Document file is required' }, { status: 400 });
    }

    if (!REQUIRED_TYPES.has(type)) {
      return NextResponse.json({ error: 'Unsupported driver document type' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only PDF, JPG, PNG and WEBP files are allowed' }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Document must be 4MB or smaller' }, { status: 400 });
    }

    const existing = driver.documents.find((document) => document.type === type);
    const existingIsPrivate = Boolean(existing?.fileUrl?.includes('.private.blob.vercel-storage.com'));

    if (existing?.isVerified && existingIsPrivate) {
      return NextResponse.json(
        { error: 'A securely stored verified driver document cannot be replaced without admin review.' },
        { status: 409 }
      );
    }

    const token = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Private verification storage is not configured.' }, { status: 503 });
    }

    const pathname = [
      'driver-verification',
      driver.id,
      type.toLowerCase(),
      Date.now() + '-' + safeFileName(file.name || 'document'),
    ].join('/');

    const blob = await put(pathname, file, {
      access: 'private',
      token,
      contentType: file.type,
      addRandomSuffix: true,
    });
    newlyUploadedUrl = blob.url;

    let document;
    try {
      document = await prisma.$transaction(async (tx) => {
        if (existing) {
          await tx.driverDocument.delete({ where: { id: existing.id } });
        }

        const created = await tx.driverDocument.create({
          data: {
            driverId: driver.id,
            type,
            name: file.name,
            fileUrl: blob.url,
            fileSize: file.size,
            mimeType: file.type,
            isVerified: false,
          },
        });

        await tx.driverProfile.update({
          where: { id: driver.id },
          data: {
            isApproved: false,
            isOnline: false,
            verificationStatus: 'PENDING',
            rejectionReason: null,
          },
        });

        return created;
      });
    } catch (error) {
      await cleanupManagedBlob(blob.url);
      newlyUploadedUrl = null;
      throw error;
    }

    newlyUploadedUrl = null;

    if (existing?.fileUrl && existing.fileUrl !== blob.url) {
      await cleanupManagedBlob(existing.fileUrl);
    }

    return NextResponse.json({
      document: {
        id: document.id,
        type: document.type,
        name: document.name,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        isVerified: document.isVerified,
        uploadedAt: document.uploadedAt,
        fileAccessUrl: '/api/driver/documents/' + document.id + '/file',
        storagePrivate: true,
      },
    });
  } catch (error) {
    if (newlyUploadedUrl) {
      await cleanupManagedBlob(newlyUploadedUrl);
    }
    if (error instanceof Response) return error;
    console.error('Driver document upload error:', error);
    return NextResponse.json({ error: 'Unable to upload driver document' }, { status: 500 });
  }
}
