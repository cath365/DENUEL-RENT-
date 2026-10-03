import hub from '../../../../lib/transport/realtime';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const role = url.searchParams.get('role') || 'USER';
  if (!id) return new Response('Missing id', { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      function send(event: string, data: any) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      hub.subscribe(id, role, send);

      req.signal.addEventListener('abort', () => {
        hub.unsubscribe(id, send);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }
  });
}
