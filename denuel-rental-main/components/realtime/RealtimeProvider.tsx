/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { createContext, useContext, useEffect, useRef } from 'react';


const WS_URL = (() => {
  if (typeof window !== 'undefined') {
    return (window as any).__DENUEL_WS_URL || process.env.NEXT_PUBLIC_WS_URL || `ws://${window.location.hostname}:4001`;
  }
  return process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:4001`;
})();

// eslint-disable-next-line no-unused-vars
const RealtimeContext = createContext<{ join: (...args:any[])=>void; leave:(...args:any[])=>void; publish: (...args:any[])=>void } | null>(null);

export function RealtimeProvider({ children }:{ children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const pending = useRef<any[]>([]);

  useEffect(()=>{
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = ()=>{
      while (pending.current.length) ws.send(JSON.stringify(pending.current.shift()));
    };
    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        // dispatch as a window message so lightweight components can listen
        try {
          window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(payload) }));
        } catch (e) {
          console.warn('Failed to dispatch message', e);
        }
      } catch (e) {
        console.warn('Invalid websocket payload', e);
      }
    };
    ws.onclose = ()=>{ wsRef.current = null; setTimeout(()=>{ if (!wsRef.current) new WebSocket(WS_URL); }, 2000); };
    return ()=>{ ws.close(); };
  },[]);

  function send(msg: any) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      pending.current.push(msg);
      if (!wsRef.current) wsRef.current = new WebSocket(WS_URL);
      return;
    }
    wsRef.current.send(JSON.stringify(msg));
  }

  const value = {
    join: (channel: string) => send({ join: channel }),
    leave: (channel: string) => send({ leave: channel }),
    publish: (channel: string, event: string, data: any) => send({ channel, pub: { event, data } }),
  };

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}

export default RealtimeProvider;
