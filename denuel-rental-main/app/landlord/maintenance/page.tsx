'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

function money(value: unknown) {
  return 'K' + Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-ZM', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status?: string) {
  if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'CANCELED') return 'bg-red-50 text-red-700';
  if (status === 'IN_PROGRESS') return 'bg-blue-50 text-blue-700';
  return 'bg-amber-50 text-amber-700';
}

function priorityTone(priority?: string) {
  if (priority === 'EMERGENCY') return 'bg-red-50 text-red-700';
  if (priority === 'HIGH') return 'bg-orange-50 text-orange-700';
  return 'bg-slate-100 text-slate-600';
}

export default function MaintenancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [busyId, setBusyId] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/landlord/maintenance?role=landlord');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/maintenance';
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load maintenance requests.');
      }

      setItems(Array.isArray(data.requests) ? data.requests : []);
      setStats(data.stats || {});
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load maintenance requests.'
      );
      setItems([]);
      setStats({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
      if (!needle) return true;

      return [
        item.title,
        item.description,
        item.category,
        item.property?.title,
        item.tenant?.name,
        item.tenant?.email,
      ].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(needle)
      );
    });
  }, [items, query, statusFilter, priorityFilter]);

  async function updateStatus(item: any, status: string) {
    const label =
      status === 'COMPLETED'
        ? 'mark this maintenance request completed'
        : status === 'CANCELED'
          ? 'cancel this maintenance request'
          : status === 'IN_PROGRESS'
            ? 'start work on this maintenance request'
            : 'update this maintenance request';

    if (!window.confirm(`Are you sure you want to ${label}?`)) return;

    setBusyId(item.id);
    setError('');

    try {
      const response = await csrfFetch('/api/landlord/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: item.id,
          status,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.id) {
        throw new Error(data.error || 'Unable to update this maintenance request.');
      }

      setItems((current) =>
        current.map((request) =>
          request.id === item.id
            ? { ...request, ...data, property: request.property, tenant: request.tenant }
            : request
        )
      );

      await load();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Unable to update this maintenance request.'
      );
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link href="/landlord" className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]">
              ← Landlord dashboard
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">Property repairs</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Maintenance
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track real maintenance requests raised by tenants on active leases.
            </p>
          </div>

          <Link
            href="/services"
            className="w-fit bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Find a service provider
          </Link>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Open', stats.open || 0],
            ['In progress', stats.inProgress || 0],
            ['Scheduled', stats.scheduled || 0],
            ['Completed', stats.completed || 0],
            ['Emergency', stats.emergency || 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 bg-white p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">{loading ? '—' : Number(value).toLocaleString()}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-3 border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_190px_190px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search request, tenant or property"
            className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELED">Canceled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="h-11 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
          >
            <option value="ALL">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </section>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-80 animate-pulse border border-slate-200 bg-white" />
        ) : items.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">No maintenance requests yet</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Requests appear only when a tenant on an active lease reports a real property issue.
            </p>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No maintenance request matches the current filters.
          </section>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((item) => {
              const active = !['COMPLETED', 'CANCELED'].includes(item.status);

              return (
                <article key={item.id} className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">{item.title}</h2>
                      <span className={`px-2.5 py-1 text-xs font-semibold ${statusTone(item.status)}`}>
                        {item.status}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-semibold ${priorityTone(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-500">
                      {item.property?.title || 'Property'} · {item.category}
                    </div>

                    <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-700">
                      {item.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span>Tenant: {item.tenant?.name || item.tenant?.email || 'Tenant'}</span>
                      <span>Created {formatDateTime(item.createdAt)}</span>
                      {item.scheduledAt && <span>Scheduled {formatDateTime(item.scheduledAt)}</span>}
                      {item.assignedTo && <span>Assigned to {item.assignedTo}</span>}
                    </div>

                    {item.cost != null && (
                      <div className="mt-3 text-sm font-semibold text-[#0F2B46]">
                        Recorded cost: {money(item.cost)}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    {item.status === 'OPEN' && (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => updateStatus(item, 'IN_PROGRESS')}
                        className="bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {busyId === item.id ? 'Saving…' : 'Start work'}
                      </button>
                    )}

                    {['OPEN', 'IN_PROGRESS', 'SCHEDULED'].includes(item.status) && (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => updateStatus(item, 'COMPLETED')}
                        className="border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 disabled:opacity-50"
                      >
                        Mark completed
                      </button>
                    )}

                    {active && (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => updateStatus(item, 'CANCELED')}
                        className="border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                      >
                        Cancel request
                      </button>
                    )}

                    {!active && (
                      <div className="border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                        This request is part of the maintenance history.
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
