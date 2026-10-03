/**
 * Production-ready WebSocket server using Redis pub/sub for horizontal scaling.
 * Requires `ws` and `ioredis` packages.
 * Run with: node ./scripts/ws-server-redis.js
 */
const http = require('http');
const WebSocket = require('ws');
const IORedis = require('ioredis');

const PORT = process.env.WS_PORT || 4001;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const pub = new IORedis(REDIS_URL);
const sub = new IORedis(REDIS_URL);

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

// Maintain local map of channel -> set of ws
const channels = new Map();

function join(channel, ws) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(ws);
}

function leaveAll(ws) {
  for (const set of channels.values()) set.delete(ws);
}

function publishLocal(channel, event, data) {
  const set = channels.get(channel);
  if (!set) return;
  const payload = JSON.stringify({ event, data });
  for (const ws of set) if (ws.readyState === WebSocket.OPEN) ws.send(payload);
}

sub.on('message', (channel, message) => {
  try {
    const { event, data } = JSON.parse(message);
    publishLocal(channel, event, data);
  } catch (e) { }
});

// Accept connections
wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const obj = JSON.parse(msg.toString());
      if (obj.join) {
        join(obj.join, ws);
        // ensure Redis subscription
        sub.subscribe(obj.join).catch(()=>{});
      }
      if (obj.leave) {
        const set = channels.get(obj.leave);
        set?.delete(ws);
      }
      if (obj.pub && obj.channel) {
        // publish to redis so all nodes get it
        pub.publish(obj.channel, JSON.stringify({ event: obj.pub.event, data: obj.pub.data }));
      }
    } catch (e) { }
  });
  ws.on('close', () => leaveAll(ws));
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

server.listen(PORT, () => console.log(`WS Redis server running on ws://0.0.0.0:${PORT}`));
