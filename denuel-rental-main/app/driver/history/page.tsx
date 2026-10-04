'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

type Filter = 'all' | 'completed' | 'cancelled';

type Trip = {
  id: string;
  status: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
  distance: number;
  duration: number;
  createdAt: string;
  tenant: {
    name: string;
    phone?: string | null;
  };
  rating?: number | null;
  ratingComment?: string | null;
  earning?: {
    grossZmw: number;
    platformFeeZmw: number;
    netZmw: number;
  } | null;
};

function money(value?: number | null) {
  return 'K' + Number(value || 0).toLocaleString();
}

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  if (status === 'COMPLETED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'CANCELED') return 'border-red-200 bg-red-50 text-red-800';
  if (status === 'IN_PROGRESS') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'DRIVER_ARRIVING' || status === 'DRIVER_ASSIGNED') return 'border-violet-200 bg-violet-50 text-violet-800';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

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

export default function DriverHistoryPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTrips() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/driver/trips?status=' + filter, {
        credentials: 'same-origin',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/driver/history&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load trip history.');
      }

      setTrips(Array.isArray(data.trips) ? data.trips : []);
    } catch (err) {
      setTrips([]);
      setError(err instanceof Error ? err.message : 'Unable to load trip history.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, [filter]);

  const stats = useMemo(() => {
    const completed = trips.filter((trip) => trip.status === 'COMPLETED');
    const canceled = trips.filter((trip) => trip.status === 'CANCELED');
    const netEarnings = completed.reduce(
      (sum, trip) => sum + Number(trip.earning?.netZmw || 0),
      0,
    );
    const rated = trips.filter((trip) => Number(trip.rating || 0) > 0);
    const averageRating = rated.length
      ? rated.reduce((sum, trip) => sum + Number(trip.rating || 0), 0) / rated.length
      : 0;

    return {
      total: trips.length,
      completed: completed.length,
      canceled: canceled.length,
      netEarnings,
      averageRating,
      ratedTrips: rated.length,
    };
  }, [trips]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="border-b border-slate-200 pb-6">
          <Link href="/driver" className="text-sm font-semibold text-blue-700">← Driver dashboard</Link>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">Trip history</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review transport requests assigned to your driver profile. Net earnings are shown only when a real DriverEarning record exists for a completed trip.
          </p>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div>{error}</div>
            <button type="button" onClick={loadTrips} className="mt-3 font-semibold underline underline-offset-4">
              Try again
            </button>
          </section>
        )}

        <section className="mt-7 grid grid-cols-2 border-l border-t border-slate-200 bg-white sm:grid-cols-3 lg:grid-cols-5">
          {[
            ['Trips in view', stats.total],
            ['Completed', stats.completed],
            ['Canceled', stats.canceled],
            ['Net earnings', money(stats.netEarnings)],
            ['Average rating', stats.ratedTrips ? stats.averageRating.toFixed(1) : 'No ratings'],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-4">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-2 text-xl font-bold">{loading ? '—' : value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 flex flex-wrap gap-2">
          {([
            ['all', 'All trips'],
            ['completed', 'Completed'],
            ['cancelled', 'Canceled'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                'border px-3 py-2 text-sm font-semibold ' +
                (filter === value
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-950')
              }
            >
              {label}
            </button>
          ))}
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : trips.length ? (
            <div className="divide-y divide-slate-100">
              {trips.map((trip) => (
                <article key={trip.id} className="p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={'border px-2.5 py-1 text-xs font-semibold ' + statusClass(trip.status)}>
                          {humanize(trip.status)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(trip.createdAt).toLocaleString('en-ZM')}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm font-semibold">{trip.pickupLocation}</div>
                        <div className="mt-1 text-sm text-slate-500">to {trip.dropoffLocation}</div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{Number(trip.distance || 0).toFixed(1)} km</span>
                        <span>{Number(trip.duration || 0)} min estimated</span>
                        <span>{trip.tenant?.name || 'Customer'}</span>
                        {trip.rating ? <span>Rating: {trip.rating}/5</span> : <span>Not rated</span>}
                      </div>

                      {trip.ratingComment && (
                        <div className="mt-3 border-l-2 border-slate-200 pl-3 text-sm italic text-slate-600">
                          “{trip.ratingComment}”
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 lg:text-right">
                      <div className="text-xs text-slate-400">Trip fare</div>
                      <div className="mt-1 text-lg font-bold">{money(trip.fare)}</div>

                      {trip.earning ? (
                        <div className="mt-3 text-sm">
                          <div className="text-xs text-slate-400">Driver net earning</div>
                          <div className="mt-1 font-semibold text-emerald-700">{money(trip.earning.netZmw)}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            Fee: {money(trip.earning.platformFeeZmw)}
                          </div>
                        </div>
                      ) : trip.status === 'COMPLETED' ? (
                        <div className="mt-3 text-xs text-amber-700">No DriverEarning record found</div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <h2 className="font-semibold">No trips found</h2>
              <p className="mt-2 text-sm text-slate-500">
                {filter === 'all'
                  ? 'Trips assigned to your driver profile will appear here.'
                  : 'No trips match the selected status.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
