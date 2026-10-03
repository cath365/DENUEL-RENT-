import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth';
import bus from '../../../../lib/eventBus';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);

    const stream = new ReadableStream({
      start(controller) {
        function onNew(msg: any) {
          if (msg.userId === user.id) {
            const payload = `event: notification\ndata: ${JSON.stringify(msg)}\n\n`;
            controller.enqueue(new TextEncoder().encode(payload));
          }
        }

        bus.on('notification:new', onNew);
        const iv = setInterval(() => controller.enqueue(new TextEncoder().encode('event: ping\ndata: {}\n\n')), 20000);
        req.signal.addEventListener('abort', () => { bus.removeListener('notification:new', onNew); clearInterval(iv); });
      }
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}