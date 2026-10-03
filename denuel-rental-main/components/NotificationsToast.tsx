"use client";
import React, { useEffect, useState } from 'react';

export default function NotificationsToast() {
  const [items, setItems] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated first via /api/auth/me
    (async () => {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          setIsAuthenticated(false);
          return;
        }
        const authData = await authRes.json();
        if (!authData?.user) {
          setIsAuthenticated(false);
          return;
        }
        
        setIsAuthenticated(true);
        
        // Now fetch notifications
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const json = await res.json();
          setItems(json.items || []);
        }
      } catch {
        setIsAuthenticated(false);
      }
    })();
  }, []);

  // Only connect to SSE if authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/notifications/subscribe');
      es.addEventListener('notification', (e: any) => {
        const p = JSON.parse(e.data || '{}');
        setItems((s) => [p, ...s].slice(0, 10));

        // show browser notification if permission
        if (typeof window !== 'undefined' && (window as any).Notification && (window as any).Notification.permission === 'granted') {
          new (window as any).Notification('DENUEL', { body: p.data?.message || 'New notification' });
        }
      });
      
      es.onerror = () => {
        // SSE connection failed, likely auth issue
        es?.close();
      };
    } catch (e) {
      console.warn('SSE not available', e);
    }

    return () => es?.close();
  }, [isAuthenticated]);

  // Don't render anything if not authenticated
  if (!isAuthenticated || items.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 space-y-2">
      {items.slice(0,3).map((n) => (
        <div key={n.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow w-80">
          <div className="font-semibold">{n.type}</div>
          <div className="text-sm text-muted">{n.data?.message}</div>
        </div>
      ))}
    </div>
  );
}