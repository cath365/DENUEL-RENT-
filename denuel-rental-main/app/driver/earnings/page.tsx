'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

type Period = 'today' | 'week' | 'month' | 'all';

type Summary = {
  gross: number;
  platformFees: number;
  net: number;
  trips: number;
};

type EarningRecord = {
  id: string;
  tripId: string;
  grossZmw: number;
  platformFeeZmw: number;
  netZmw: number;
  date: string;
  pickup: string;
  dropoff: string;
  distanceKm: number;
  customerName: string;
};

type EarningsPayload = {
  summaries: Record<Period, Summary>;
  earnings: EarningRecord[];
};

function money(value?: number | null) {
  return 'K' + Number(value || 0).toLocaleString();
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

export default function DriverEarningsPage() {
  const [data, setData] = useState<EarningsPayload | null>(null);
  const [period, setPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadEarnings() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/driver/earnings', { credentials: 'same-origin' });
      const { text, data: payload } = await readResponse(res);

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/driver/earnings&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(payload?.error || text || 'Unable to load driver earnings.');
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load driver earnings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEarnings();
  }, []);

  const selectedSummary = data?.summaries?.[period] || {
    gross: 0,
    platformFees: 0,
    net: 0,
    trips: 0,
  };

  const visibleEarnings = useMemo(() => {
    if (!data?.earnings) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return data.earnings.filter((earning) => {
      const date = new Date(earning.date);
      if (period === 'today') return date >= todayStart;
      if (period === 'week') return date >= weekStart;
      if (period === 'month') return date >= monthStart;
      return true;
    });
  }, [data, period]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link href="/driver" className="text-sm font-semibold text-blue-700">← Driver dashboard</Link>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">Earnings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Earnings shown here come only from completed trips recorded in DENUEL. Platform fees are taken from each real DriverEarning record.
            </p>
          </div>

          <button
            type="button"
            onClick={loadEarnings}
            className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Refresh
          </button>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div>{error}</div>
            <button type="button" onClick={loadEarnings} className="mt-3 font-semibold underline underline-offset-4">
              Try again
            </button>
          </section>
        )}

        <section className="mt-6 flex flex-wrap gap-2">
          {([
            ['today', 'Today'],
            ['week', 'This week'],
            ['month', 'This month'],
            ['all', 'All time'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={
                'border px-3 py-2 text-sm font-semibold ' +
                (period === value
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-950')
              }
            >
              {label}
            </button>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-2 border-l border-t border-slate-200 bg-white lg:grid-cols-4">
          {[
            ['Gross fares', money(selectedSummary.gross)],
            ['Platform fees', money(selectedSummary.platformFees)],
            ['Net earnings', money(selectedSummary.net)],
            ['Completed trips', selectedSummary.trips.toLocaleString()],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold">{loading ? '—' : value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold">What “net earnings” means</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Net earnings are the amount recorded for the driver after the platform fee stored for each completed trip. This page does not estimate withdrawal balances or invent payout amounts.
          </p>
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Completed-trip earnings</h2>
            <p className="mt-1 text-xs text-slate-500">
              Up to the latest 100 recorded DriverEarning entries are shown.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : visibleEarnings.length ? (
            <div className="divide-y divide-slate-100">
              {visibleEarnings.map((earning) => (
                <article
                  key={earning.id}
                  className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_130px_130px_130px] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{earning.pickup}</div>
                    <div className="mt-1 truncate text-sm text-slate-500">to {earning.dropoff}</div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>{Number(earning.distanceKm || 0).toFixed(1)} km</span>
                      <span>{earning.customerName}</span>
                      <span>{new Date(earning.date).toLocaleString('en-ZM')}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Gross</div>
                    <div className="mt-1 text-sm font-semibold">{money(earning.grossZmw)}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Platform fee</div>
                    <div className="mt-1 text-sm font-semibold">{money(earning.platformFeeZmw)}</div>
                  </div>

                  <div className="md:text-right">
                    <div className="text-xs text-slate-400">Net</div>
                    <div className="mt-1 text-lg font-bold text-emerald-700">{money(earning.netZmw)}</div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <h3 className="font-semibold">No completed-trip earnings in this period</h3>
              <p className="mt-2 text-sm text-slate-500">
                Real earnings will appear after a transport request reaches Completed and a DriverEarning record is created.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
