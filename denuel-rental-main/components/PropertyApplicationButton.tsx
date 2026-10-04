'use client';

import { useState } from 'react';
import { csrfFetch } from '@/lib/csrf';

export default function PropertyApplicationButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'applied' | 'existing' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function apply() {
    if (state === 'loading' || state === 'applied' || state === 'existing') return;

    setState('loading');
    setMessage('');

    try {
      const response = await csrfFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/property/' + propertyId;
        return;
      }

      if (response.status === 409) {
        setState('existing');
        setMessage('You already applied for this property.');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit your application.');
      }

      setState('applied');
      setMessage('Application submitted.');
    } catch (error) {
      setState('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to submit your application.'
      );
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={apply}
        disabled={state === 'loading' || state === 'applied' || state === 'existing'}
        className="w-full bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {state === 'loading'
          ? 'Submitting…'
          : state === 'applied'
            ? 'Application submitted'
            : state === 'existing'
              ? 'Already applied'
              : 'Apply to rent'}
      </button>

      {message && (
        <p className={`mt-2 text-xs leading-5 ${
          state === 'error' ? 'text-red-600' : 'text-slate-500'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}
