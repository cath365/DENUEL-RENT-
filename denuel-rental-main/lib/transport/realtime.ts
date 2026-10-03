import { EventEmitter } from 'events';
import wsClient from './wsClient';

type SseClient = {
  id: string; // user id
  role: string;
  send: Function;
};

class RealtimeHub extends EventEmitter {
  private clients: Map<string, SseClient[]> = new Map();

  subscribe(id: string, role: string, send: Function) {
    const lst = this.clients.get(id) || [];
    lst.push({ id, role, send });
    this.clients.set(id, lst);
    this.emit('connect', { id, role });
  }

  unsubscribe(id: string, send: Function) {
    const lst = this.clients.get(id) || [];
    const filtered = lst.filter(c => c.send !== send);
    if (filtered.length) this.clients.set(id, filtered);
    else this.clients.delete(id);
    this.emit('disconnect', { id });
  }

  sendToUser(id: string, event: string, data: any) {
    const lst = this.clients.get(id) || [];
    for (const c of lst) c.send(event, data);
    // also publish to WebSocket channel for external clients
    try {
      // tenant and driver channels
      wsClient.publish(`tenant:${id}`, event, data);
      wsClient.publish(`driver:${id}`, event, data);
      wsClient.publish(`user:${id}`, event, data);
    } catch (e) { console.warn('Realtime publish failed', e); }
  }

  broadcastToRole(role: string, event: string, data: any) {
    for (const [, lst] of this.clients) {
      for (const c of lst) if (c.role === role) c.send(event, data);
    }
    // also broadcast via websocket to a role channel
    try { wsClient.publish(`role:${role}`, event, data); } catch (e) { console.warn('Realtime role publish failed', e); }
  }

  // notify subset of drivers by id list
  notifyDrivers(driverIds: string[], event: string, data: any) {
    for (const id of driverIds) this.sendToUser(id, event, data);
    // also publish per-driver channel
    for (const id of driverIds) {
      try { wsClient.publish(`driver:${id}`, event, data); } catch (e) { console.warn('Realtime driver publish failed', e); }
    }
  }
}

const hub = new RealtimeHub();

export default hub;
