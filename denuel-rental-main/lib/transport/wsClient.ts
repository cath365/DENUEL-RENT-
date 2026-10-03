import WebSocket from 'ws';

const WS_URL = process.env.WS_SERVER_URL || `ws://localhost:${process.env.WS_PORT || 4001}`;

class WSClient {
  private ws: WebSocket | null = null;
  private queue: any[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.connect();
  }

  connect() {
    if (this.ws) return;
    this.ws = new WebSocket(WS_URL as string);
    this.ws.on('open', () => {
      // flush queue
      while (this.queue.length) {
        const msg = this.queue.shift();
        this.ws?.send(JSON.stringify(msg));
      }
    });
    this.ws.on('close', () => { this.ws = null; this.scheduleReconnect(); });
    this.ws.on('error', (err) => { console.warn('WS client error', err); });
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000 + Math.random() * 3000);
  }

  publish(channel: string, event: string, data: any) {
    const msg = { channel, pub: { event, data } };
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.queue.push(msg);
      this.connect();
      return;
    }
    try {
      this.ws.send(JSON.stringify(msg));
    } catch (e) {
      this.queue.push(msg);
    }
  }
}

const client = new WSClient();
export default client;
