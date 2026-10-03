"use client";
import React, { useEffect, useState } from 'react';
import Header from '../../../../../components/Header';
import { csrfFetch } from '../../../../../lib/csrf';

export default function ThreadPage({ params }: { params: { id: string } }) {
  const [thread, setThread] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/inquiries/${params.id}`);
      const json = await res.json();
      setThread(json.thread);
    })();
  }, [params.id]);

  async function send() {
    if (!message) return;
    const res = await csrfFetch(`/api/inquiries/${params.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
    const json = await res.json();
    if (json.message) {
      setMessage('');
      // reload
      const r2 = await fetch(`/api/inquiries/${params.id}`);
      const j2 = await r2.json();
      setThread(j2.thread);
    }
  }

  if (!thread) return <div className="p-8">Loading...</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      <h2 className="text-2xl font-semibold mb-4">Inquiries for {thread.property.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="space-y-4">
            {thread.messages.map((m: any) => (
              <div key={m.id} className={`p-3 rounded ${m.senderId === thread.property.ownerId ? 'bg-gray-100' : 'bg-white dark:bg-gray-800'}`}>
                <div className="text-sm text-muted">{m.senderId}</div>
                <div className="mt-1">{m.body}</div>
                <div className="text-xs text-muted mt-1">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-2 border rounded" rows={4} />
            <div className="mt-2 flex items-center justify-between">
              <button onClick={send} className="bg-brand-500 text-white px-4 py-2 rounded">Send reply</button>
              <button onClick={async () => { await csrfFetch(`/api/inquiries/${params.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark-read' }) }); alert('Marked read'); }} className="text-sm text-muted">Mark read</button>
            </div>
          </div>
        </div>
        <aside className="md:col-span-1 bg-white dark:bg-gray-800 p-4 rounded shadow">
          <div className="font-semibold">Property</div>
          <div className="text-muted">{[thread.property.area, thread.property.city].filter(Boolean).join(', ') || thread.property.city}</div>
          <div className="text-bold mt-2">K{thread.property.price}</div>
        </aside>
      </div>
    </main>
  );
}
