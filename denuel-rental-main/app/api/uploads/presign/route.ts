import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { filename, contentType } = body;
    if (!filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });

    // sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9.-_]/g, '-');
    const key = `${user.id}/${Date.now()}-${safeName}`;

    // Check if S3 is configured
    const hasS3 = process.env.AWS_REGION && process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID;
    
    if (hasS3) {
      // Use S3 presigned URL
      const { createPresignedUploadUrl } = await import('../../../../lib/s3');
      const result = await createPresignedUploadUrl(key, contentType || 'application/octet-stream');
      return NextResponse.json(result);
    }

    // Check if Vercel Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'File storage is not configured. Please add BLOB_READ_WRITE_TOKEN to your environment variables.' },
        { status: 500 }
      );
    }

    // Use direct upload to Vercel Blob
    const uploadUrl = `/api/uploads/direct`;
    const publicUrl = `uploads/${key}`; // Will be replaced with blob URL after upload
    
    return NextResponse.json({ 
      url: uploadUrl, 
      publicUrl, 
      key,
      useDirectUpload: true // Flag to tell client to use FormData upload
    });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Presign error:', e);
    return NextResponse.json({ error: e?.message || 'Unable to generate upload URL' }, { status: 500 });
  }
}