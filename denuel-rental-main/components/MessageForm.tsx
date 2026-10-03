"use client";
import React, { useState } from 'react';
import { csrfFetch } from '../lib/csrf';

export default function MessageForm({ receiverId, propertyId }: { receiverId: string; propertyId: string }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const res = await csrfFetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId, propertyId, message }) });
    const json = await res.json();
    if (json?.message) {
      setStatus('sent');
      setMessage('');
    } else {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full p-2 border rounded" placeholder="Write your message to the landlord/agent" />
      <div className="flex items-center justify-between">
        <button className="bg-brand-500 text-white px-4 py-2 rounded">Send Message</button>
        <div className="text-sm text-muted">{status === 'sent' && 'Sent'}</div>
      </div>
    </form>
  );
}
