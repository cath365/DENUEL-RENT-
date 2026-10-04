'use client';

import { useEffect, useState } from 'react';
import { csrfFetch } from '@/lib/csrf';

export default function FavoriteButton({ propertyId }: { propertyId: string }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/favorites/check?propertyId=' + encodeURIComponent(propertyId))
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setSaved(Boolean(data.isFavorited));
      })
      .catch(() => null);
  }, [propertyId]);

  async function toggle() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await csrfFetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/property/' + propertyId;
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) return;

      setSaved(!data.removed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="w-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50"
    >
      {loading ? 'Saving…' : saved ? 'Saved property' : 'Save property'}
    </button>
  );
}
