'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Intent = 'rent' | 'buy' | 'land' | 'commercial';

export default function SearchBar() {
  const router = useRouter();
  const [intent, setIntent] = useState<Intent>('rent');
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [furnished, setFurnished] = useState(false);
  const [parking, setParking] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);

  const target = useMemo(() => {
    if (intent === 'buy') return '/buy';
    if (intent === 'land') return '/land';
    if (intent === 'commercial') return '/commercial';
    return '/rent';
  }, [intent]);

  const search = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (minPrice) p.set('priceMin', minPrice);
    if (maxPrice) p.set('priceMax', maxPrice);
    if (bedrooms) p.set('bedrooms', bedrooms);
    if (bathrooms) p.set('bathrooms', bathrooms);
    if (propertyType) p.set('propertyType', propertyType);
    if (furnished) p.set('furnished', 'true');
    if (parking) p.set('hasParking', 'true');
    if (petsAllowed) p.set('petsAllowed', 'true');
    router.push(`${target}${p.toString() ? `?${p.toString()}` : ''}`);
  };

  return (
    <div className="rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-black/5 sm:p-4">
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1">
        {([
          ['rent', 'Rent'], ['buy', 'Buy'], ['land', 'Land'], ['commercial', 'Commercial']
        ] as const).map(([value, label]) => (
          <button key={value} onClick={() => setIntent(value)} className={`min-w-[86px] flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${intent === value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Search Lusaka, Ibex Hill, Kabulonga, Ndola..." className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="h-14 rounded-2xl border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50">Filters</button>
        <button onClick={search} className="h-14 rounded-2xl bg-blue-600 px-7 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">Search properties</button>
      </div>

      {showFilters && (
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="Min price (ZMW)" className="rounded-xl border border-slate-200 px-4 py-3" />
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Max price (ZMW)" className="rounded-xl border border-slate-200 px-4 py-3" />
          <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3"><option value="">Bedrooms</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select>
          <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3"><option value="">Bathrooms</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option></select>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3"><option value="">Property type</option><option value="HOUSE">House</option><option value="APARTMENT">Apartment</option><option value="TOWNHOUSE">Townhouse</option><option value="STUDIO">Studio</option></select>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm"><input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} /> Furnished</label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm"><input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} /> Parking</label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm"><input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} /> Pet friendly</label>
        </div>
      )}
    </div>
  );
}
