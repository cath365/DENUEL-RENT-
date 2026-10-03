"use client";
import React, { useState } from 'react';
import { csrfFetch } from '../lib/csrf';

const REASONS = ['Scam / fraud', 'Duplicate listing', 'Wrong price', 'Unavailable', 'Inappropriate content', 'Other'] as const;

export default function ReportListing({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('Scam / fraud');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit() {
    setStatus('sending');
    try {
      const res = await csrfFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, reason, details: details.trim() ? details.trim() : undefined }),
      });
      const json = await res.json();
      if (json?.report) {
        setStatus('sent');
        setOpen(false);
        setDetails('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="mt-4">
      <button type="button" onClick={() => setOpen((v) => !v)} className="p-2 rounded border w-full text-sm">
        Report listing
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <select value={reason} onChange={(e) => setReason(e.target.value as any)} className="w-full p-2 border rounded text-sm">
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            rows={3}
            placeholder="Details (optional)"
          />
          <button
            type="button"
            onClick={submit}
            disabled={status === 'sending'}
            className="bg-brand-500 text-white px-3 py-2 rounded w-full text-sm"
          >
            {status === 'sending' ? 'Sending...' : 'Submit report'}
          </button>
          {status === 'sent' && <div className="text-sm text-green-600">Report submitted. Thank you.</div>}
          {status === 'error' && <div className="text-sm text-red-600">Unable to submit report.</div>}
        </div>
      )}
    </div>
  );
}

