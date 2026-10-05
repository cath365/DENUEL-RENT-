'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';

type StatusFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'SCHEDULED' | 'COMPLETED' | 'CANCELED';
type PriorityFilter = 'ALL' | 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  if (status === 'COMPLETED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'IN_PROGRESS') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'SCHEDULED') return 'border-violet-200 bg-violet-50 text-violet-800';
  if (status === 'CANCELED') return 'border-slate-200 bg-slate-50 text-slate-500';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function priorityClass(priority: string) {
  if (priority === 'EMERGENCY') return 'border-red-200 bg-red-50 text-red-800';
  if (priority === 'HIGH') return 'border-orange-200 bg-orange-50 text-orange-800';
  if (priority === 'MEDIUM') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

const priorityRank: Record<string, number> = {
  EMERGENCY: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export default function MaintenancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');

  async function loadMaintenance() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/landlord/maintenance?role=landlord', {
        credentials: 'same-origin',
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/maintenance&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load maintenance requests.');
      }

      setItems(Array.isArray(data.requests) ? data.requests : []);
      setStats(data.stats || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaintenance();
  }, []);

  const counts = useMemo(() => ({
    ALL: items.length,
    OPEN: items.filter((item) => item.status === 'OPEN').length,
    IN_PROGRESS: items.filter((item) => item.status === 'IN_PROGRESS').length,
    SCHEDULED: items.filter((item) => item.status === 'SCHEDULED').length,
    COMPLETED: items.filter((item) => item.status === 'COMPLETED').length,
    CANCELED: items.filter((item) => item.status === 'CANCELED').length,
  }), [items]);

  const visibleItems = useMemo(() => {
    return [...items]
      .filter((item) => statusFilter === 'ALL' || item.status === statusFilter)
      .filter((item) => priorityFilter === 'ALL' || item.priority === priorityFilter)
      .sort((a, b) => {
        const priorityDifference =
          (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
        if (priorityDifference !== 0) return priorityDifference;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [items, priorityFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link href="/landlord" className="text-sm font-semibold text-blue-700">← Landlord dashboard</Link>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">Maintenance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review repair requests across your properties and identify issues that need attention first.
            </p>
          </div>

          <Link
            href="/services"
            className="inline-flex w-fit items-center justify-center bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Find a service provider
          </Link>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Maintenance data could not be loaded</h2>
            <p className="mt-2 text-sm text-red-800">{error}</p>
            <button
              type="button"
              onClick={loadMaintenance}
              className="mt-4 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800"
            >
              Try again
            </button>
          </section>
        )}

        <section className="mt-8 grid grid-cols-2 border-l border-t border-slate-200 bg-white sm:grid-cols-5">
          {[
            ['Open', stats.open || 0],
            ['In progress', stats.inProgress || 0],
            ['Scheduled', stats.scheduled || 0],
            ['Completed', stats.completed || 0],
            ['Emergency', stats.emergency || 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold">{loading ? '—' : Number(value).toLocaleString()}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex flex-wrap gap-2">
            {([
              ['ALL', 'All'],
              ['OPEN', 'Open'],
              ['IN_PROGRESS', 'In progress'],
              ['SCHEDULED', 'Scheduled'],
              ['COMPLETED', 'Completed'],
              ['CANCELED', 'Canceled'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={
                  'border px-3 py-2 text-sm font-medium transition ' +
                  (statusFilter === value
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950')
                }
              >
                {label} <span className="ml-1 opacity-70">({counts[value]})</span>
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            Priority
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              className="h-10 border border-slate-300 bg-white px-3 text-sm text-slate-800"
            >
              <option value="ALL">All priorities</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </label>
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Repair requests</h2>
            <p className="mt-1 text-xs text-slate-500">
              Requests are prioritised by urgency, then by the most recent activity.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : visibleItems.length ? (
            <div className="divide-y divide-slate-100">
              {visibleItems.map((item) => (
                <article key={item.id} className="p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">{item.title}</h3>
                        <span className={'border px-2.5 py-1 text-xs font-semibold ' + statusClass(item.status)}>
                          {humanize(item.status)}
                        </span>
                        <span className={'border px-2.5 py-1 text-xs font-semibold ' + priorityClass(item.priority)}>
                          {humanize(item.priority)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>{item.property?.title || 'Property not recorded'}</span>
                        <span>{humanize(item.category)}</span>
                        {item.createdAt && (
                          <span>Reported {new Date(item.createdAt).toLocaleDateString('en-ZM')}</span>
                        )}
                      </div>

                      <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-700">
                        {item.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        {item.tenant?.name && <span>Tenant: {item.tenant.name}</span>}
                        {item.assignedTo && <span>Assigned to: {item.assignedTo}</span>}
                        {item.scheduledAt && (
                          <span>Scheduled: {new Date(item.scheduledAt).toLocaleString('en-ZM')}</span>
                        )}
                        {item.completedAt && (
                          <span>Completed: {new Date(item.completedAt).toLocaleDateString('en-ZM')}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 lg:text-right">
                      <div className="text-xs text-slate-400">Recorded cost</div>
                      <div className="mt-1 text-lg font-bold">
                        {item.cost != null ? 'K' + Number(item.cost).toLocaleString() : 'Not recorded'}
                      </div>
                      {item.tenant?.phone && (
                        <a href={'tel:' + item.tenant.phone} className="mt-3 inline-flex text-sm font-semibold text-blue-700">
                          Contact tenant
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <h3 className="text-lg font-semibold">
                {items.length ? 'No requests match these filters' : 'No maintenance requests yet'}
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {items.length
                  ? 'Change the status or priority filters to see other requests.'
                  : 'Tenant maintenance requests will appear here when they are submitted.'}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
