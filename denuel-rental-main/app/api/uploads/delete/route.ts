import { NextResponse } from 'next/server';
import { deleteObject } from '../../../../lib/s3';
import { requireAuth } from '../../../../lib/auth';

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const { key } = body;
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
    if (!key.startsWith(`${user.id}/`)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await deleteObject(key);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Unable to delete object' }, { status: 500 });
  }
}