'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ListingCard from './ListingCard';

export default function PersonalizedDiscovery() {
  const [items, setItems] = useState<any[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/api/properties/recently-viewed?limit=4')
      .then(async (res) => res.ok ? res.json() : [])
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setReady(true));
  }, []);

  if (!ready || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.2em] text-violet-600">For you</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Continue where you left off</h2>
          <p className="mt-2 text-slate-600">Properties you recently viewed while signed in.</p>
        </div>
        <Link href="/favorites" className="hidden text-sm font-bold text-blue-600 sm:block">Saved properties →</Link>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((property) => <ListingCard key={property.id} property={property} listingType={property.listingType === 'SALE' ? 'SALE' : 'RENT'} />)}
      </div>
    </section>
  );
}
