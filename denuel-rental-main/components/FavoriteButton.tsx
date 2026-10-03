"use client";
import React, { useState } from 'react';
import { csrfFetch } from '../lib/csrf';

export default function FavoriteButton({ propertyId }: { propertyId: string }) {
  const [saved, setSaved] = useState(false);
  async function toggle() {
    const res = await csrfFetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId }) });
    const json = await res.json();
    if (json?.favorite || json?.removed !== undefined) setSaved(!saved);
  }
  return (
    <button onClick={toggle} className="p-2 rounded border">
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
