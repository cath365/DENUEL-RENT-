"use client";
import React, { useEffect, useState } from 'react';
import Header from '../../../../components/Header';
import Link from 'next/link';

export default function InquiriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch('/api/inquiries');
      const json = await res.json();
      setItems(json.items || []);
      setLoading(false);

      // connect SSE for live updates
      try {
        const es = new EventSource('/api/inquiries/subscribe');
        es.addEventListener('inquiry', (e: any) => {
          const payload = JSON.parse(e.data || '{}');
          // prepend or update list
          setItems((prev) => {
            const exists = prev.find((x) => x.id === payload.threadId);
            if (exists) return prev.map((p) => (p.id === payload.threadId ? { ...p, lastMessage: { body: payload.message } } : p));
            // simple fetch thread to get property info
            (async () => {
              const r = await fetch(`/api/inquiries/${payload.threadId}`);
              const j = await r.json();
              setItems((prev2) => [ { id: j.thread.id, property: j.thread.property, lastMessage: j.thread.messages[j.thread.messages.length-1], messageCount: j.thread.messages.length }, ...prev2 ]);
            })();
            return prev;
          });
        });
      } catch (e) {
        // ignore SSE failure
        console.warn('SSE failed', e);
      }
    })();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      <h2 className="text-2xl font-semibold mb-4">Inquiries</h2>
      {loading && <div>Loading...</div>}
      {!loading && items.length === 0 && <div className="text-muted">No inquiries yet</div>}
      <div className="grid grid-cols-1 gap-4">
        {items.map((t) => (
          <Link key={t.id} href={`/dashboard/inquiries/${t.id}`} className="block bg-white dark:bg-gray-800 p-4 rounded shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{t.property.title}</div>
                <div className="text-sm text-muted">{t.lastMessage?.body}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">Messages: {t.messageCount}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}