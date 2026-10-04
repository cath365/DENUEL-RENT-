'use client';

import { useEffect } from 'react';

export default function PropertyViewTracker({
  propertyId,
  enabled = true,
}: {
  propertyId: string;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled || !propertyId) return;

    const controller = new AbortController();

    fetch('/api/properties/' + encodeURIComponent(propertyId) + '/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: controller.signal,
      keepalive: true,
    }).catch(() => null);

    return () => controller.abort();
  }, [propertyId, enabled]);

  return null;
}
