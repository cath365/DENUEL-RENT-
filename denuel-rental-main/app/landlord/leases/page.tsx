'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';

type LeaseFilter = 'ALL' | 'DRAFT' | 'PENDING_SIGNATURES' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

function money(value: number) {
  return 'K' + Number(value || 0).toLocaleString();
}

function statusClass(status: string) {
  if (status === 'ACTIVE') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'DRAFT') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'PENDING_SIGNATURES') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'EXPIRED') return 'border-slate-200 bg-slate-50 text-slate-600';
  if (status === 'TERMINATED') return 'border-red-200 bg-red-50 text-red-800';
  return 'border-slate-200 bg-white text-slate-600';
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<LeaseFilter>('ALL');

  async function loadLeases() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/landlord/leases', { credentials: 'same-origin' });
      const text = await res.text();
      let data: any = [];
      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        data = [];
      }

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/leases&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load leases.');
      }

      setLeases(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load leases.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeases();
  }, []);

  const counts = useMemo(() => ({
    ALL: leases.length,
    DRAFT: leases.filter((lease) => lease.status === 'DRAFT').length,
    ACTIVE: leases.filter((lease) => lease.status === 'ACTIVE').length,
    PENDING_SIGNATURES: leases.filter((lease) => lease.status === 'PENDING_SIGNATURES').length,
    EXPIRED: leases.filter((lease) => lease.status === 'EXPIRED').length,
    TERMINATED: leases.filter((lease) => lease.status === 'TERMINATED').length,
  }), [leases]);

  const visible = useMemo(
    () => filter === 'ALL' ? leases : leases.filter((lease) => lease.status === filter),
    [filter, leases],
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="border-b border-slate-200 pb-6">
          <Link href="/landlord" className="text-sm font-semibold text-blue-700">← Landlord dashboard</Link>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">Leases</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review lease terms, signing progress and current agreement status for leases recorded in DENUEL.
          </p>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Leases could not be loaded</h2>
            <p className="mt-2 text-sm text-red-800">{error}</p>
            <button type="button" onClick={loadLeases} className="mt-4 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800">
              Try again
            </button>
          </section>
        )}

        <section className="mt-6 flex flex-wrap gap-2">
          {([
            ['ALL', 'All'],
            ['ACTIVE', 'Active'],
            ['PENDING_SIGNATURES', 'Awaiting signatures'],
            ['DRAFT', 'Draft'],
            ['EXPIRED', 'Expired'],
            ['TERMINATED', 'Terminated'],
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
                <div key={index} className="h-40 animate-pulse border border-slate-200 bg-white" />
              ))}
            </div>
          ) : visible.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {visible.map((lease) => (
                <article key={lease.id} className="border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{lease.property?.title || 'Property'}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Tenant: {lease.tenant?.name || lease.tenant?.email || 'Not recorded'}
                      </p>
                    </div>

                    <span className={'shrink-0 border px-2.5 py-1 text-xs font-semibold ' + statusClass(lease.status)}>
                      {String(lease.status || 'UNKNOWN').replaceAll('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-400">Monthly rent</div>
                      <div className="mt-1 font-semibold">{money(lease.monthlyRent)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Deposit</div>
                      <div className="mt-1 font-semibold">{lease.deposit != null ? money(lease.deposit) : 'Not recorded'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Starts</div>
                      <div className="mt-1 font-medium">{lease.startDate ? new Date(lease.startDate).toLocaleDateString('en-ZM') : '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Ends</div>
                      <div className="mt-1 font-medium">{lease.endDate ? new Date(lease.endDate).toLocaleDateString('en-ZM') : '—'}</div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <div className="border border-slate-200 p-3">
                      <div className="text-xs text-slate-400">Landlord signature</div>
                      <div className="mt-1 text-sm font-semibold">
                        {lease.landlordSigned ? 'Signed' : 'Awaiting signature'}
                      </div>
                    </div>
                    <div className="border border-slate-200 p-3">
                      <div className="text-xs text-slate-400">Tenant signature</div>
                      <div className="mt-1 text-sm font-semibold">
                        {lease.tenantSigned ? 'Signed' : 'Awaiting signature'}
                      </div>
                    </div>
                  </div>

                  {Array.isArray(lease.rentPayments) && lease.rentPayments.length > 0 && (
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent rent schedule</div>
                      <div className="mt-3 space-y-2">
                        {lease.rentPayments.slice(0, 3).map((payment: any) => (
                          <div key={payment.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-slate-500">{new Date(payment.dueDate).toLocaleDateString('en-ZM')}</span>
                            <span className="font-medium">{money(payment.amount)} · {payment.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-slate-200 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold">
                {leases.length ? 'No leases in this status' : 'No lease agreements recorded yet'}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {leases.length
                  ? 'Choose another status above to review the rest of your lease agreements.'
                  : 'Lease agreements will appear here when they are created through the landlord workflow.'}
              </p>
              {!leases.length && (
                <Link href="/dashboard/properties" className="mt-5 inline-flex text-sm font-semibold text-blue-700">
                  Review your properties →
                </Link>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
