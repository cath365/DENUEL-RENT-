"use client";
import React, { useEffect, useState } from 'react';
import { csrfFetch } from '../lib/csrf';

export default function FavoriteButton({ propertyId }: { propertyId: string }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/favorites/check?propertyId=' + encodeURIComponent(propertyId), { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSaved(Boolean(data?.isFavorited)))
      .catch(() => null);
  }, [propertyId]);

  async function toggle() {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await csrfFetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
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

      if (!res.ok) {
        throw new Error(json?.error || text || 'Unable to update saved property.');
      }

      setSaved(!json.removed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update saved property.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="w-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-950 disabled:opacity-50"
      >
        {loading ? 'Updating…' : saved ? 'Saved property' : 'Save property'}
      </button>
      {error && <div className="mt-2 text-xs text-red-700">{error}</div>}
    </div>
  );
}
