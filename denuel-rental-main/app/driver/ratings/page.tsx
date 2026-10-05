'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

type Rating = {
  id: string;
  stars: number;
  comment?: string | null;
  createdAt: string;
  tenant?: {
    name?: string | null;
  } | null;
  transportRequest?: {
    pickupAddressText?: string | null;
    dropoffAddressText?: string | null;
    createdAt?: string | null;
  } | null;
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

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={value + ' out of 5 stars'}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? 'text-amber-500' : 'text-slate-200'}>★</span>
      ))}
    </div>
  );
}

export default function DriverRatingsPage() {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadRatings() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/driver/ratings', { credentials: 'same-origin' });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/driver/ratings&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load driver ratings.');
      }

      setRatings(Array.isArray(data) ? data : []);
    } catch (err) {
      setRatings([]);
      setError(err instanceof Error ? err.message : 'Unable to load driver ratings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRatings();
  }, []);

  const stats = useMemo(() => {
    const valid = ratings.filter((rating) => rating.stars >= 1 && rating.stars <= 5);
    const average = valid.length
      ? valid.reduce((sum, rating) => sum + rating.stars, 0) / valid.length
      : 0;

    const distribution = [1, 2, 3, 4, 5].map(
      (star) => valid.filter((rating) => rating.stars === star).length,
    );

    return {
      average,
      total: valid.length,
      distribution,
    };
  }, [ratings]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link href="/driver" className="text-sm font-semibold text-blue-700">← Driver dashboard</Link>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">Ratings & reviews</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              These ratings come only from recorded transport trips. DENUEL does not generate placeholder reviews or estimated scores.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRatings}
            className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Refresh
          </button>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div>{error}</div>
            <button type="button" onClick={loadRatings} className="mt-3 font-semibold underline underline-offset-4">
              Try again
            </button>
          </section>
        )}

        <section className="mt-7 grid gap-6 border border-slate-200 bg-white p-5 sm:p-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Average rating</div>
            <div className="mt-2 text-5xl font-bold tracking-[-0.04em]">
              {loading ? '—' : stats.total ? stats.average.toFixed(1) : '—'}
            </div>
            <div className="mt-3">
              <Stars value={Math.round(stats.average)} />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {stats.total ? stats.total + ' recorded rating' + (stats.total === 1 ? '' : 's') : 'No ratings yet'}
            </div>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star - 1] || 0;
              const percentage = stats.total ? (count / stats.total) * 100 : 0;

              return (
                <div key={star} className="grid grid-cols-[24px_1fr_44px] items-center gap-3 text-sm">
                  <span className="font-medium">{star}</span>
                  <div className="h-2 overflow-hidden bg-slate-100">
                    <div className="h-full bg-amber-400" style={{ width: percentage + '%' }} />
                  </div>
                  <span className="text-right text-slate-500">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Customer reviews</h2>
            <p className="mt-1 text-xs text-slate-500">Most recent ratings first.</p>
          </div>

          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : ratings.length ? (
            <div className="divide-y divide-slate-100">
              {ratings.map((rating) => (
                <article key={rating.id} className="p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="font-semibold">{rating.tenant?.name || 'Customer'}</div>
                        <Stars value={rating.stars} />
                      </div>

                      {rating.comment && (
                        <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-700">
                          {rating.comment}
                        </p>
                      )}

                      {rating.transportRequest && (
                        <div className="mt-4 border-l-2 border-slate-200 pl-3 text-xs leading-5 text-slate-500">
                          <div>{rating.transportRequest.pickupAddressText || 'Pickup not recorded'}</div>
                          <div>to {rating.transportRequest.dropoffAddressText || 'Drop-off not recorded'}</div>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-xs text-slate-400">
                      {new Date(rating.createdAt).toLocaleDateString('en-ZM', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <h3 className="font-semibold">No ratings yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Customer ratings will appear here after completed trips are reviewed.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
