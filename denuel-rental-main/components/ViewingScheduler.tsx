'use client';

import { useState } from 'react';
import { csrfFetch } from '@/lib/csrf';

interface ViewingSchedulerProps {
  propertyId: string;
  propertyTitle: string;
  className?: string;
}

export default function ViewingScheduler({
  propertyId,
  propertyTitle,
  className = '',
}: ViewingSchedulerProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function submitViewing() {
    if (!date || !time || status === 'submitting') return;

    setStatus('submitting');
    setMessage('');

    try {
      const localDate = new Date(date + 'T' + time);

      if (Number.isNaN(localDate.getTime()) || localDate.getTime() <= Date.now()) {
        throw new Error('Choose a future date and time.');
      }

      const response = await csrfFetch('/api/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          scheduledAt: localDate.toISOString(),
          notes: notes.trim() || undefined,
        }),
      });

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/property/' + propertyId;
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit the viewing request.');
      }

      setStatus('sent');
      setMessage('Viewing request submitted. The lister can now confirm or respond.');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to submit the viewing request.'
      );
    }
  }

  return (
    <div className={className}>
      <p className="text-xs leading-5 text-slate-500">
        Request a preferred time to view {propertyTitle}. The lister must confirm the appointment.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Date</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDate(event.target.value)}
            className="h-11 w-full border border-slate-300 px-2 text-sm outline-none focus:border-[#16A34A]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Time</label>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="h-11 w-full border border-slate-300 px-2 text-sm outline-none focus:border-[#16A34A]"
          />
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="Optional note for the lister"
        className="mt-2 w-full border border-slate-300 p-2.5 text-sm outline-none focus:border-[#16A34A]"
      />

      <button
        type="button"
        onClick={submitViewing}
        disabled={!date || !time || status === 'submitting'}
        className="mt-2 w-full border border-[#0F2B46] bg-white px-4 py-3 text-sm font-semibold text-[#0F2B46] disabled:opacity-50"
      >
        {status === 'submitting' ? 'Submitting…' : 'Request viewing'}
      </button>

      {message && (
        <p className={`mt-2 text-xs leading-5 ${status === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
