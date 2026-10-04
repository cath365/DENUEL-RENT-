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

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-ZM', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function tone(status?: string) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700';
  if (status === 'TERMINATED' || status === 'EXPIRED') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busyId, setBusyId] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/landlord/leases?role=landlord');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/leases';
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load lease agreements.');
      }

      setLeases(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load lease agreements.'
      );
      setLeases([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    total: leases.length,
    waiting: leases.filter((lease) => lease.status === 'PENDING_SIGNATURES').length,
    active: leases.filter((lease) => lease.status === 'ACTIVE').length,
    closed: leases.filter((lease) => ['EXPIRED', 'TERMINATED'].includes(lease.status)).length,
  }), [leases]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return leases.filter((lease) => {
      if (statusFilter !== 'ALL' && lease.status !== statusFilter) return false;
      if (!needle) return true;

      return [
        lease.property?.title,
        lease.property?.city,
        lease.property?.area,
        lease.tenant?.name,
        lease.tenant?.email,
      ].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(needle)
      );
    });
  }, [leases, query, statusFilter]);

  async function signLease(lease: any) {
    if (!window.confirm('Sign this lease as the landlord?')) return;

    setBusyId(lease.id);
    setError('');

    try {
      const response = await csrfFetch('/api/landlord/leases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId: lease.id,
          action: 'sign',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.id) {
        throw new Error(data.error || 'Unable to sign this lease.');
      }

      setLeases((current) =>
        current.map((item) =>
          item.id === lease.id
            ? {
                ...item,
                ...data,
                property: item.property,
                tenant: item.tenant,
                landlord: item.landlord,
                rentPayments: item.rentPayments,
              }
            : item
        )
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Unable to sign this lease.'
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
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">Tenancy agreements</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Leases
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review real lease agreements, signature status, rent and tenancy dates.
            </p>
          </div>

          <Link
            href="/landlord/applications"
            className="w-fit border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Approved applications
          </Link>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['All leases', stats.total],
            ['Waiting for signatures', stats.waiting],
            ['Active', stats.active],
            ['Expired / terminated', stats.closed],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 bg-white p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">{Number(value).toLocaleString()}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tenant, property or location"
            className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_SIGNATURES">Pending signatures</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </section>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-80 animate-pulse border border-slate-200 bg-white" />
        ) : leases.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">No lease agreements yet</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Lease records will appear here after a real tenancy agreement is created.
            </p>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No lease matches the current filters.
          </section>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((lease) => {
              const image = lease.property?.images?.[0]?.url;
              const canSign =
                !lease.landlordSigned &&
                ['DRAFT', 'PENDING_SIGNATURES'].includes(lease.status);

              return (
                <article
                  key={lease.id}
                  className="grid gap-5 p-5 lg:grid-cols-[120px_minmax(0,1fr)_240px] lg:items-center"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {image ? (
                      <img src={image} alt={lease.property?.title || ''} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={'/property/' + lease.property.id}
                        className="font-semibold text-slate-950 hover:text-[#16A34A]"
                      >
                        {lease.property?.title || 'Property'}
                      </Link>
                      <span className={`px-2.5 py-1 text-xs font-semibold ${tone(lease.status)}`}>
                        {lease.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Tenant: {lease.tenant?.name || lease.tenant?.email || 'Tenant'}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                      <span>{money(lease.monthlyRent)} / month</span>
                      {lease.deposit != null && <span>Deposit {money(lease.deposit)}</span>}
                      <span>{formatDate(lease.startDate)} → {formatDate(lease.endDate)}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className={lease.landlordSigned ? 'bg-emerald-50 px-2 py-1 text-emerald-700' : 'bg-amber-50 px-2 py-1 text-amber-700'}>
                        Landlord signed: {lease.landlordSigned ? 'Yes' : 'No'}
                      </span>
                      <span className={lease.tenantSigned ? 'bg-emerald-50 px-2 py-1 text-emerald-700' : 'bg-amber-50 px-2 py-1 text-amber-700'}>
                        Tenant signed: {lease.tenantSigned ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {lease.documentUrl && (
                      <a
                        href={lease.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
                      >
                        Open lease document
                      </a>
                    )}

                    {canSign && (
                      <button
                        type="button"
                        disabled={busyId === lease.id}
                        onClick={() => signLease(lease)}
                        className="bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {busyId === lease.id ? 'Signing…' : 'Sign as landlord'}
                      </button>
                    )}

                    {!canSign && !lease.documentUrl && (
                      <div className="border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                        No additional action is required here.
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
