'use client';

import { FormEvent, useState } from 'react';
import { csrfFetch } from '@/lib/csrf';

export default function MessageForm({
  receiverId,
  propertyId,
}: {
  receiverId: string;
  propertyId: string;
}) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim() || status === 'sending') return;

    setStatus('sending');
    setError('');

    try {
      const response = await csrfFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId,
          propertyId,
          message: message.trim(),
        }),
      });

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/property/' + propertyId;
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.message) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : 'Unable to send your enquiry.'
        );
      }

      setStatus('sent');
      setMessage('');
    } catch (sendError) {
      setStatus('error');
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Unable to send your enquiry.'
      );
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(event) => {
          setMessage(event.target.value);
          if (status !== 'sending') setStatus('idle');
        }}
        rows={4}
        maxLength={1200}
        className="w-full border border-slate-300 bg-white p-3 text-sm outline-none focus:border-[#16A34A]"
        placeholder="Ask the lister a question about this property"
      />

      <button
        type="submit"
        disabled={status === 'sending' || !message.trim()}
        className="mt-2 w-full bg-[#0F2B46] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>

      {status === 'sent' && (
        <p className="mt-2 text-xs text-emerald-700">Your enquiry was sent through Ng&apos;anda.</p>
      )}

      {status === 'error' && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </form>
  );
}
