'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { csrfFetch } from '../lib/csrf';

type Application = {
  id: string;
  status: string;
  appliedAt: string;
};

async function readResponse(res: Response) {
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  return { text, data };
}

function humanize(value?: string | null) {
  if (!value) return 'Pending';
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PropertyApplicationButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadStatus() {
    try {
      const res = await fetch(
        '/api/applications?propertyId=' + encodeURIComponent(propertyId),
        {
          credentials: 'same-origin',
          cache: 'no-store',
        }
      );

      if (res.status === 401) {
        setSignedOut(true);
        setApplication(null);
        return;
      }

      if (res.status === 403) {
        setApplication(null);
        return;
      }

      const { text, data } = await readResponse(res);
      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to check application status.');
      }

      setSignedOut(false);
      setApplication(data.application || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to check application status.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, [propertyId]);

  async function submitApplication() {
    setSubmitting(true);
    setError('');

    try {
      const res = await csrfFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      if (res.status === 401) {
        window.location.href =
          '/auth/login?redirect=' +
          encodeURIComponent('/property/' + propertyId);
        return;
      }

      const { text, data } = await readResponse(res);

      if (res.status === 409 && data?.application) {
        setApplication(data.application);
        return;
      }

      if (!res.ok) {
        const validation = Array.isArray(data?.error)
          ? data.error
              .map((item: any) => item.message)
              .filter(Boolean)
              .join(' ')
          : data?.error;
        throw new Error(
          validation || text || 'Unable to submit application.'
        );
      }

      setApplication(data.application || null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to submit application.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="h-12 animate-pulse bg-slate-100" aria-label="Loading application status" />
    );
  }

  if (application) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Application submitted
        </div>
        <div className="mt-1 text-sm font-semibold text-emerald-950">
          Status: {humanize(application.status)}
        </div>
        <p className="mt-2 text-xs leading-5 text-emerald-800">
          No application fee is marked as paid unless DENUEL has a verified payment record.
        </p>
        <Link
          href="/renter-hub#applications"
          className="mt-3 inline-flex text-sm font-semibold text-emerald-900 underline underline-offset-4"
        >
          View in Renter Hub
        </Link>
      </div>
    );
  }

  if (signedOut) {
    return (
      <Link
        href={'/auth/login?redirect=' + encodeURIComponent('/property/' + propertyId)}
        className="flex w-full items-center justify-center bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
      >
        Sign in to apply
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={submitApplication}
        disabled={submitting}
        className="flex w-full items-center justify-center bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Submitting application…' : 'Apply for this property'}
      </button>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        Submitting an application does not mark any fee as paid.
      </p>

      {error && (
        <div className="mt-3 border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
