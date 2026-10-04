import WebSocket from 'ws';

const WS_URL = process.env.WS_SERVER_URL || '';

class WSClient {
  private ws: WebSocket | null = null;
  private queue: any[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private canConnect() {
    return Boolean(WS_URL);
  }

  connect() {
    if (!this.canConnect() || this.ws) return;

    try {
      this.ws = new WebSocket(WS_URL);
      this.ws.on('open', () => {
        while (this.queue.length) {
          const msg = this.queue.shift();
          this.ws?.send(JSON.stringify(msg));
        }
      });
      this.ws.on('close', () => {
        this.ws = null;
        this.scheduleReconnect();
      });
      this.ws.on('error', (err) => {
        console.warn('WS client error', err);
      });
    } catch (error) {
      this.ws = null;
      console.warn('WS client connection failed', error);
    }
  }

  scheduleReconnect() {
    if (!this.canConnect() || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  publish(channel: string, event: string, data: any) {
    const msg = { channel, pub: { event, data } };

    if (!this.canConnect()) {
      return;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.queue.push(msg);
      this.connect();
      return;
    }

    try {
      this.ws.send(JSON.stringify(msg));
    } catch {
      this.queue.push(msg);
    }
  }
}

const client = new WSClient();
export default client;
