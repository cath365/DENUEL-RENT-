'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

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
  if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'FAILED') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

export default function ScreeningPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/landlord/screening?role=landlord');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/screening';
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load screening records.');
      }

      setItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load screening records.'
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((item) => item.status === 'PENDING').length,
    completed: items.filter((item) => item.status === 'COMPLETED').length,
    failed: items.filter((item) => item.status === 'FAILED').length,
  }), [items]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return items.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!needle) return true;

      return [
        item.applicant?.name,
        item.applicant?.email,
        item.applicant?.phone,
      ].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(needle)
      );
    });
  }, [items, query, statusFilter]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link href="/landlord" className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]">
              ← Landlord dashboard
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">Applicant checks</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Tenant screening
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track real screening requests. Ng&apos;anda does not generate credit scores, background checks or income results without a verified screening provider.
            </p>
          </div>

          <Link
            href="/landlord/applications"
            className="w-fit border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Rental applications
          </Link>
        </div>

        <div className="mt-6 border border-blue-200 bg-blue-50 p-5">
          <div className="font-semibold text-slate-950">Screening integrity</div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Manual or simulated screening results are disabled. Until a verified screening provider is connected, this page records request status only.
          </p>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Requests', stats.total],
            ['Pending', stats.pending],
            ['Completed', stats.completed],
            ['Failed', stats.failed],
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
            placeholder="Search applicant name, email or phone"
            className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </section>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-72 animate-pulse border border-slate-200 bg-white" />
        ) : items.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">No screening requests yet</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Screening requests will appear only when you deliberately create one for a real applicant.
            </p>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No screening record matches the current filters.
          </section>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((item) => {
              const applicant = item.applicant || {};

              return (
                <article key={item.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">
                        {applicant.name || applicant.email || 'Applicant'}
                      </h2>
                      <span className={`px-2.5 py-1 text-xs font-semibold ${tone(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {applicant.isIdVerified && (
                        <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">ID verified</span>
                      )}
                      {applicant.isPhoneVerified && (
                        <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">Phone verified</span>
                      )}
                      {applicant.isEmailVerified && (
                        <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">Email verified</span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span>Requested {formatDate(item.createdAt)}</span>
                      {applicant.email && <span>{applicant.email}</span>}
                      {applicant.phone && <span>{applicant.phone}</span>}
                    </div>
                  </div>

                  <div className="border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-500">
                    {item.status === 'PENDING'
                      ? 'Waiting for a verified screening process.'
                      : item.reportUrl
                        ? 'A screening report reference is attached to this record.'
                        : 'No detailed verified report is available in Ng\'anda.'}
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
