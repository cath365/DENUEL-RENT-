import { NextResponse } from 'next/server';
import { verifyObject } from '../../../../lib/s3';
import { requireAuth } from '../../../../lib/auth';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { key } = body;
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
    if (!key.startsWith(`${user.id}/`)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { contentType, size, publicUrl } = await verifyObject(key);
    if (!contentType?.startsWith?.('image/')) return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    if (size > MAX_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 400 });

    return NextResponse.json({ publicUrl, size, contentType });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Unable to verify object' }, { status: 500 });
  }
}