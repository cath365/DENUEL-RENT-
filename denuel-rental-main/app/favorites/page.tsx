'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import ListingCard from '@/components/ListingCard';

export default function FavoritesPage() {
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [mostViewed, setMostViewed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState('');
  const [mostViewedError, setMostViewedError] = useState('');

  async function load() {
    setLoading(true);
    setFavoritesError('');
    setMostViewedError('');

    const [favoritesResult, mostViewedResult] = await Promise.allSettled([
      fetch('/api/favorites'),
      fetch('/api/properties/most-viewed?limit=8'),
    ]);

    try {
      if (favoritesResult.status === 'rejected') {
        throw new Error('Unable to load saved properties.');
      }

      const response = favoritesResult.value;

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/favorites';
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to load saved properties.'
        );
      }

      setSavedProperties(
        Array.isArray(data.items)
          ? data.items.map((item: any) => item.property)
          : []
      );
    } catch (error) {
      setFavoritesError(
        error instanceof Error
          ? error.message
          : 'Unable to load saved properties.'
      );
      setSavedProperties([]);
    }

    try {
      if (mostViewedResult.status === 'rejected') {
        throw new Error('Unable to load most viewed properties.');
      }

      const response = mostViewedResult.value;
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to load most viewed properties.'
        );
      }

      setMostViewed(
        Array.isArray(data.items) ? data.items : []
      );
    } catch (error) {
      setMostViewedError(
        error instanceof Error
          ? error.message
          : 'Unable to load most viewed properties.'
      );
      setMostViewed([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const savedIds = useMemo(
    () => new Set(savedProperties.map((property) => property.id)),
    [savedProperties]
  );

  const totalViewers = useMemo(
    () =>
      mostViewed.reduce(
        (sum, property) =>
          sum + Number(property.viewerCount || 0),
        0
      ),
    [mostViewed]
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">
              Property shortlist
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Saved properties
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Properties you genuinely saved to your Ng&apos;anda account.
            </p>
          </div>

          <Link
            href="/rent"
            className="inline-flex w-fit bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Browse properties
          </Link>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-3">
          <div className="border-b border-r border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">Saved properties</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {savedProperties.length}
            </div>
          </div>

          <div className="border-b border-r border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">Most-viewed listings shown</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {mostViewed.length}
            </div>
          </div>

          <div className="border-b border-r border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">Recorded viewers across these listings</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {totalViewers.toLocaleString()}
            </div>
          </div>
        </section>

        {favoritesError && (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-800">
              Saved properties are temporarily unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-700">
              {favoritesError}
            </p>
            <button
              type="button"
              onClick={load}
              className="mt-4 bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-[-0.025em] text-slate-950">
                Your saved properties
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Remove a property by selecting the heart again.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : !favoritesError && savedProperties.length === 0 ? (
            <div className="mt-6 border border-slate-200 bg-white p-10">
              <h3 className="text-xl font-semibold text-slate-950">
                No saved properties yet
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Your shortlist starts empty. Save a real approved property and it
                will appear here.
              </p>
              <Link
                href="/rent"
                className="mt-5 inline-flex bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Find a property
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {savedProperties.map((property) => (
                <ListingCard
                  key={property.id}
                  property={property}
                  listingType={
                    property.listingType === 'SALE'
                      ? 'SALE'
                      : 'RENT'
                  }
                  initialFavorited
                  onFavoriteChange={(isFavorited) => {
                    if (!isFavorited) {
                      setSavedProperties((current) =>
                        current.filter(
                          (item) => item.id !== property.id
                        )
                      );
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-14 border-t border-slate-200 pt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="text-sm font-semibold text-[#16A34A]">
                Real viewing activity
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">
                Most viewed properties
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Ranked only from recorded visits to approved listings. Each
                privacy-safe visitor signature counts once per property.
              </p>
            </div>

            <Link
              href="/rent"
              className="w-fit text-sm font-semibold text-[#16A34A]"
            >
              Explore all properties
            </Link>
          </div>

          {mostViewedError ? (
            <div className="mt-6 border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              {mostViewedError}
            </div>
          ) : loading ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-80 animate-pulse border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : mostViewed.length === 0 ? (
            <div className="mt-6 border border-slate-200 bg-white p-8">
              <h3 className="font-semibold text-slate-950">
                No viewer data yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                This section will populate naturally when real visitors open
                approved property pages.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {mostViewed.map((property) => (
                <ListingCard
                  key={property.id}
                  property={property}
                  listingType={
                    property.listingType === 'SALE'
                      ? 'SALE'
                      : 'RENT'
                  }
                  initialFavorited={
                    savedIds.has(property.id) ? true : undefined
                  }
                  showViewerCount
                  onFavoriteChange={(isFavorited) => {
                    if (isFavorited) {
                      setSavedProperties((current) => {
                        if (
                          current.some(
                            (item) => item.id === property.id
                          )
                        ) {
                          return current;
                        }

                        return [...current, property];
                      });
                    } else {
                      setSavedProperties((current) =>
                        current.filter(
                          (item) => item.id !== property.id
                        )
                      );
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
