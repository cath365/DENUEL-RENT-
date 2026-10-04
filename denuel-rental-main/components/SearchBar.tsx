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
    const query = p.toString();
    router.push(query ? target + '?' + query : target);
  };

  return (
    <div className="bg-white">
      <div className="flex border-b border-slate-200">
        {([
          ['rent', 'Rent'],
          ['buy', 'Buy'],
          ['land', 'Land'],
          ['commercial', 'Commercial'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setIntent(value)}
            className={
              'relative px-5 py-3 text-sm font-semibold transition ' +
              (intent === value ? 'text-slate-950' : 'text-slate-500 hover:text-slate-800')
            }
          >
            {label}
            {intent === value && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 p-3 md:flex-row">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 20l-4.5-4.5m2-5A7 7 0 113.5 10.5a7 7 0 0114 0z" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="City, area or property name"
            className="h-12 w-full border border-slate-300 bg-white pl-12 pr-4 text-[15px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="h-12 border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
        >
          {showFilters ? 'Hide filters' : 'Filters'}
        </button>

        <button
          onClick={search}
          className="h-12 bg-blue-600 px-7 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {showFilters && (
        <div className="grid gap-3 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} type="number" placeholder="Minimum price" className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950" />
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} type="number" placeholder="Maximum price" className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950" />
          <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950">
            <option value="">Any bedrooms</option>
            <option value="1">1+ bedroom</option>
            <option value="2">2+ bedrooms</option>
            <option value="3">3+ bedrooms</option>
            <option value="4">4+ bedrooms</option>
          </select>
          <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950">
            <option value="">Any bathrooms</option>
            <option value="1">1+ bathroom</option>
            <option value="2">2+ bathrooms</option>
            <option value="3">3+ bathrooms</option>
          </select>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950">
            <option value="">Any property type</option>
            <option value="HOUSE">House</option>
            <option value="APARTMENT">Apartment</option>
            <option value="TOWNHOUSE">Townhouse</option>
            <option value="STUDIO">Studio</option>
          </select>
          <label className="flex h-11 items-center gap-2 border border-slate-300 px-3 text-sm text-slate-700">
            <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} />
            Furnished
          </label>
          <label className="flex h-11 items-center gap-2 border border-slate-300 px-3 text-sm text-slate-700">
            <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} />
            Parking
          </label>
          <label className="flex h-11 items-center gap-2 border border-slate-300 px-3 text-sm text-slate-700">
            <input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} />
            Pets allowed
          </label>
        </div>
      )}
    </div>
  );
}
