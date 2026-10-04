'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ListingCard from './ListingCard';

const MapSplitView = dynamic(() => import('./MapSplitView'), {
  ssr: false,
  loading: () => <div className="h-[560px] border border-slate-200 bg-slate-100" />,
});

type Mode = 'RENT' | 'SALE';

type Props = {
  mode: Mode;
  title: string;
  description: string;
};

const cities = ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe', 'Chipata', 'Chingola', 'Mufulira', 'Solwezi'];
const propertyTypes = [
  ['HOUSE', 'House'],
  ['APARTMENT', 'Apartment'],
  ['DUPLEX', 'Duplex'],
  ['STUDIO', 'Studio'],
  ['ROOM', 'Room'],
  ['OFFICE', 'Office space'],
  ['SHOP', 'Shop'],
  ['WAREHOUSE', 'Warehouse'],
  ['LAND', 'Land'],
  ['OTHER', 'Other'],
] as const;

export default function PropertySearchMarketplace({ mode, title, description }: Props) {
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState('');
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    furnished: false,
    petsAllowed: false,
    hasParking: false,
    sort: 'newest',
  });

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    setQuery(url.get('q') || '');
    setFilters((current) => ({
      ...current,
      city: url.get('city') || '',
      minPrice: url.get('priceMin') || '',
      maxPrice: url.get('priceMax') || '',
      bedrooms: url.get('bedrooms') || '',
      bathrooms: url.get('bathrooms') || '',
      propertyType: url.get('propertyType') || '',
      furnished: url.get('furnished') === 'true',
      petsAllowed: url.get('petsAllowed') === 'true',
      hasParking: url.get('hasParking') === 'true',
    }));
  }, []);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set('listingType', mode);
    if (query.trim()) p.set('q', query.trim());
    if (filters.city) p.set('city', filters.city);
    if (filters.minPrice) p.set('priceMin', filters.minPrice);
    if (filters.maxPrice) p.set('priceMax', filters.maxPrice);
    if (filters.bedrooms) p.set('bedrooms', filters.bedrooms);
    if (filters.bathrooms) p.set('bathrooms', filters.bathrooms);
    if (filters.propertyType) p.set('propertyType', filters.propertyType);
    if (filters.furnished) p.set('furnished', 'true');
    if (filters.petsAllowed) p.set('petsAllowed', 'true');
    if (filters.hasParking) p.set('hasParking', 'true');
    p.set('sort', filters.sort);
    p.set('page', String(page));
    p.set('pageSize', '12');
    return p;
  }, [mode, query, filters, page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    setSearchError('');
    fetch('/api/search?' + params.toString())
      .then(async (res) => {
        const text = await res.text();
        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }

        if (!res.ok) {
          throw new Error(data?.error || text || 'Property search is temporarily unavailable.');
        }

        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setProperties(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total || 0));
      })
      .catch((error) => {
        console.error('Property search failed', error);
        if (!cancelled) {
          setProperties([]);
          setTotal(0);
          setSearchError(error instanceof Error ? error.message : 'Property search is temporarily unavailable.');
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [params]);

  const clearFilters = () => {
    setQuery('');
    setFilters({
      city: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      propertyType: '',
      furnished: false,
      petsAllowed: false,
      hasParking: false,
      sort: 'newest',
    });
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / 12));
  const activeCount = [
    filters.city,
    filters.minPrice,
    filters.maxPrice,
    filters.bedrooms,
    filters.bathrooms,
    filters.propertyType,
    filters.furnished,
    filters.petsAllowed,
    filters.hasParking,
  ].filter(Boolean).length;

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
          </div>

          <div className="mt-7 grid gap-2 border border-slate-300 bg-white p-3 md:grid-cols-[1fr_190px_auto]">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search area, city or property name"
              className="h-12 border border-slate-300 px-4 text-sm outline-none focus:border-slate-950"
            />
            <select
              value={filters.city}
              onChange={(e) => {
                setFilters({ ...filters, city: e.target.value });
                setPage(1);
              }}
              className="h-12 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950"
            >
              <option value="">All cities</option>
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 border border-slate-950 bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              Filters{activeCount ? ` (${activeCount})` : ''}
            </button>
          </div>

          {showFilters && (
            <div className="grid gap-3 border-x border-b border-slate-300 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
              <input value={filters.minPrice} onChange={(e) => { setFilters({ ...filters, minPrice: e.target.value }); setPage(1); }} type="number" placeholder="Minimum price (K)" className="h-11 border border-slate-300 px-3 text-sm" />
              <input value={filters.maxPrice} onChange={(e) => { setFilters({ ...filters, maxPrice: e.target.value }); setPage(1); }} type="number" placeholder="Maximum price (K)" className="h-11 border border-slate-300 px-3 text-sm" />
              <select value={filters.bedrooms} onChange={(e) => { setFilters({ ...filters, bedrooms: e.target.value }); setPage(1); }} className="h-11 border border-slate-300 px-3 text-sm">
                <option value="">Any bedrooms</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option>
              </select>
              <select value={filters.bathrooms} onChange={(e) => { setFilters({ ...filters, bathrooms: e.target.value }); setPage(1); }} className="h-11 border border-slate-300 px-3 text-sm">
                <option value="">Any bathrooms</option><option value="1">1+</option><option value="2">2+</option><option value="3">3+</option>
              </select>
              <select value={filters.propertyType} onChange={(e) => { setFilters({ ...filters, propertyType: e.target.value }); setPage(1); }} className="h-11 border border-slate-300 px-3 text-sm">
                <option value="">Any property type</option>
                {propertyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <label className="flex h-11 items-center gap-2 border border-slate-300 px-3 text-sm text-slate-700"><input type="checkbox" checked={filters.furnished} onChange={(e) => { setFilters({ ...filters, furnished: e.target.checked }); setPage(1); }} /> Furnished</label>
              <label className="flex h-11 items-center gap-2 border border-slate-300 px-3 text-sm text-slate-700"><input type="checkbox" checked={filters.petsAllowed} onChange={(e) => { setFilters({ ...filters, petsAllowed: e.target.checked }); setPage(1); }} /> Pets allowed</label>
              <label className="flex h-11 items-center gap-2 border border-slate-300 px-3 text-sm text-slate-700"><input type="checkbox" checked={filters.hasParking} onChange={(e) => { setFilters({ ...filters, hasParking: e.target.checked }); setPage(1); }} /> Parking</label>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="text-lg font-semibold text-slate-950">{loading ? 'Searching…' : `${total.toLocaleString()} properties`}</div>
            <div className="mt-1 text-sm text-slate-500">{mode === 'RENT' ? 'Available rental listings' : 'Property listed for sale'}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeCount > 0 && (
              <button onClick={clearFilters} className="border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-950">
                Clear filters
              </button>
            )}
            <Link href="/saved-search" className="border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-950">
              Saved searches
            </Link>
            <select value={filters.sort} onChange={(e) => { setFilters({ ...filters, sort: e.target.value }); setPage(1); }} className="h-10 border border-slate-300 bg-white px-3 text-sm">
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="relevance">Relevance</option>
            </select>
            <div className="flex border border-slate-300">
              <button onClick={() => setView('grid')} className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-slate-950 text-white' : 'bg-white text-slate-700'}`}>List</button>
              <button onClick={() => setView('map')} className={`border-l border-slate-300 px-3 py-2 text-sm ${view === 'map' ? 'bg-slate-950 text-white' : 'bg-white text-slate-700'}`}>Map</button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 py-7 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse border border-slate-200 bg-slate-100" />)}
          </div>
        ) : searchError ? (
          <div className="my-10 border border-red-200 bg-red-50 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-red-900">We could not load the property results</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-red-800">{searchError}</p>
            <button onClick={() => window.location.reload()} className="mt-5 border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-800">
              Try again
            </button>
          </div>
        ) : properties.length === 0 ? (
          <div className="my-10 border border-slate-200 bg-slate-50 p-10">
            <h2 className="text-xl font-semibold text-slate-950">No matching properties</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">Try a different area or remove one of the filters. New listings can be added at any time.</p>
            <button onClick={clearFilters} className="mt-5 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Clear filters</button>
          </div>
        ) : view === 'map' ? (
          <div className="mt-7"><MapSplitView properties={properties} listingType={mode} /></div>
        ) : (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {properties.map((property) => (
              <ListingCard key={property.id} property={property} listingType={mode === 'RENT' ? 'RENT' : 'SALE'} />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5">
            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40">Previous</button>
            <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40">Next</button>
          </div>
        )}
      </section>
    </main>
  );
}
