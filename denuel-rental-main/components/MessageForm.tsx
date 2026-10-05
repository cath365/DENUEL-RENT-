"use client";
import React, { useState } from 'react';
import { csrfFetch } from '../lib/csrf';

export default function MessageForm({ receiverId, propertyId }: { receiverId: string; propertyId: string }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await csrfFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, propertyId, message: message.trim() }),
      });

      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/property/' + propertyId;
        return;
      }

      if (!res.ok || !json?.message) {
        setStatus('error');
        return;
      }

      setStatus('sent');
      setMessage('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required className="w-full border border-slate-300 p-3 text-sm outline-none focus:border-slate-950" placeholder="Write your message to the landlord or agent" />
      <div className="flex items-center justify-between">
        <button disabled={status === 'sending' || !message.trim()} className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{status === 'sending' ? 'Sending…' : 'Send message'}</button>
        <div className="text-sm">{status === 'sent' && <span className="text-emerald-700">Message sent</span>}{status === 'error' && <span className="text-red-700">Unable to send message</span>}</div>
      </div>
    </form>
  );
}
