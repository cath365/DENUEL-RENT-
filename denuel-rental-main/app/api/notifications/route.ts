import { NextResponse } from 'next/server';
import { requireAuth } from '../../../lib/auth';
import { listNotifications } from '../../../lib/notifications';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    const items = await listNotifications(user.id, 50);
    return NextResponse.json({ items });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}