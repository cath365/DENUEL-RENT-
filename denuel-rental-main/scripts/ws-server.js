/**
 * Simple standalone WebSocket server for real-time transport channels.
 * Run with: node ./scripts/ws-server.js
 * Requires `ws` package.
 */
const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.WS_PORT || 4001;

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

// channels: tenant:{id}, driver:{id}, trip:{id}
const channels = new Map(); // channel -> Set of ws

function join(channel, ws) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(ws);
}

function leaveAll(ws) {
  for (const [k, set] of channels) set.delete(ws);
}

function sendToChannel(channel, event, data) {
  const set = channels.get(channel);
  if (!set) return;
  const payload = JSON.stringify({ event, data });
  for (const ws of set) if (ws.readyState === WebSocket.OPEN) ws.send(payload);
}

wss.on('connection', (ws, request, client) => {
  ws.on('message', (msg) => {
    try {
      const obj = JSON.parse(msg.toString());
      if (obj.join) join(obj.join, ws);
      if (obj.leave) channels.get(obj.leave)?.delete(ws);
      if (obj.pub && obj.channel) sendToChannel(obj.channel, obj.pub.event, obj.pub.data);
    } catch (e) {}
  });
  ws.on('close', () => leaveAll(ws));
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

server.listen(PORT, () => console.log(`WS server running on ws://localhost:${PORT}`));

// Expose simple publish function via process messaging (optional)
process.on('message', (m) => {
  if (m && m.type === 'publish' && m.channel) sendToChannel(m.channel, m.event, m.data);
});
