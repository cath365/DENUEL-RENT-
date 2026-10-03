import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import { markNotificationRead } from '../../../../lib/notifications';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const { id } = params;
    const body = await req.json();
    const { action } = body;
    if (action === 'mark-read') {
      await markNotificationRead(id, user.id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}