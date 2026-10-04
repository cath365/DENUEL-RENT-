'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';

type ScreeningFilter = 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED';

function humanize(value?: string | null) {
  if (!value) return 'Not recorded';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  if (status === 'COMPLETED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'FAILED') return 'border-red-200 bg-red-50 text-red-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

export default function ScreeningPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<ScreeningFilter>('ALL');

  async function loadScreenings() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/landlord/screening?role=landlord', {
        credentials: 'same-origin',
      });
      const text = await res.text();
      let data: any = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/screening&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load tenant screenings.');
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load tenant screenings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScreenings();
  }, []);

  const counts = useMemo(() => ({
    ALL: items.length,
    PENDING: items.filter((item) => item.status === 'PENDING').length,
    COMPLETED: items.filter((item) => item.status === 'COMPLETED').length,
    FAILED: items.filter((item) => item.status === 'FAILED').length,
  }), [items]);

  const visible = useMemo(
    () => filter === 'ALL' ? items : items.filter((item) => item.status === filter),
    [filter, items],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="border-b border-slate-200 pb-6">
          <Link href="/landlord" className="text-sm font-semibold text-blue-700">← Landlord dashboard</Link>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">Tenant screening</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Review screening requests and recorded verification results. DENUEL does not make the tenancy decision for you, and this page does not generate or invent screening results.
          </p>
        </section>

        <section className="mt-6 border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-slate-950">Use screening information carefully</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Treat applicant information as private. Consider the full tenancy application and applicable housing requirements rather than relying on a single screening field.
          </p>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Screening records could not be loaded</h2>
            <p className="mt-2 text-sm text-red-800">{error}</p>
            <button
              type="button"
              onClick={loadScreenings}
              className="mt-4 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800"
            >
              Try again
            </button>
          </section>
        )}

        <section className="mt-6 flex flex-wrap gap-2">
          {([
            ['ALL', 'All'],
            ['PENDING', 'Pending'],
            ['COMPLETED', 'Completed'],
            ['FAILED', 'Failed'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                'border px-3 py-2 text-sm font-medium transition ' +
                (filter === value
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950')
              }
            >
              {label} <span className="ml-1 opacity-70">({counts[value]})</span>
            </button>
          ))}
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse border border-slate-200 bg-white" />
              ))}
            </div>
          ) : visible.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {visible.map((screening) => (
                <article key={screening.id} className="border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">
                        {screening.applicant?.name || screening.applicant?.email || 'Applicant'}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Requested {screening.createdAt ? new Date(screening.createdAt).toLocaleDateString('en-ZM') : 'date not recorded'}
                      </p>
                    </div>
                    <span className={'shrink-0 border px-2.5 py-1 text-xs font-semibold ' + statusClass(screening.status)}>
                      {humanize(screening.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">Property</div>
                      <div className="mt-1 text-sm font-semibold">
                        {screening.property?.title || 'Not linked to a property'}
                      </div>
                      {screening.property && (
                        <div className="mt-1 text-xs text-slate-500">
                          {[screening.property.area, screening.property.city].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">Report validity</div>
                      <div className="mt-1 text-sm font-semibold">
                        {screening.expiresAt
                          ? 'Until ' + new Date(screening.expiresAt).toLocaleDateString('en-ZM')
                          : 'No expiry recorded'}
                      </div>
                    </div>
                  </div>

                  {screening.status === 'COMPLETED' && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Recorded screening information
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="border border-slate-200 p-3">
                          <div className="text-xs text-slate-400">Credit status</div>
                          <div className="mt-1 text-sm font-semibold">{humanize(screening.creditStatus)}</div>
                        </div>
                        <div className="border border-slate-200 p-3">
                          <div className="text-xs text-slate-400">Background status</div>
                          <div className="mt-1 text-sm font-semibold">{humanize(screening.backgroundStatus)}</div>
                        </div>
                        <div className="border border-slate-200 p-3">
                          <div className="text-xs text-slate-400">Income verification</div>
                          <div className="mt-1 text-sm font-semibold">
                            {screening.incomeVerified ? 'Verified' : 'Not verified'}
                          </div>
                        </div>
                        <div className="border border-slate-200 p-3">
                          <div className="text-xs text-slate-400">Employment status</div>
                          <div className="mt-1 text-sm font-semibold">{humanize(screening.employmentStatus)}</div>
                        </div>
                      </div>

                      {screening.reportUrl && (
                        <a
                          href={screening.reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex text-sm font-semibold text-blue-700"
                        >
                          Open recorded screening report →
                        </a>
                      )}
                    </div>
                  )}

                  {screening.status === 'PENDING' && (
                    <div className="mt-5 border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                      This screening is still pending. No result should be inferred until a verified result is recorded.
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-slate-200 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold">
                {items.length ? 'No screenings in this status' : 'No screening requests recorded yet'}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {items.length
                  ? 'Choose another status above to review the rest of the screening records.'
                  : 'Screening requests will appear here after they are created through the tenancy workflow.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
