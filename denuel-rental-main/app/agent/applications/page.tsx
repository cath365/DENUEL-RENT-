'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' });
}

function tone(status?: string) {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

export default function AgentApplicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [busyId, setBusyId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/applications?role=landlord');
      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/agent/applications';
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to load applications.');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load applications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filter === 'ALL' ? items : items.filter((item) => item.status === filter),
    [items, filter]
  );

  async function decide(id: string, status: 'APPROVED' | 'REJECTED') {
    if (!window.confirm(status === 'APPROVED'
      ? 'Approve this application? No lease or payment will be created automatically.'
      : 'Reject this application?')) return;

    setBusyId(id);
    setError('');

    try {
      const response = await csrfFetch('/api/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.application) throw new Error(data.error || 'Unable to update this application.');
      setItems((current) => current.map((item) => item.id === id ? data.application : item));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update this application.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="border-b border-slate-200 pb-6">
          <Link href="/agent" className="text-sm font-semibold text-slate-500">← Agent dashboard</Link>
          <div className="mt-4 text-sm font-semibold text-[#16A34A]">Listing applications</div>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">Rental applications</h1>
          <p className="mt-2 text-sm text-slate-600">Applications submitted to rental properties you manage.</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`border px-3 py-2 text-sm font-semibold ${
                filter === status ? 'border-[#0F2B46] bg-[#0F2B46] text-white' : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {error && <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="mt-6 h-72 animate-pulse border border-slate-200 bg-white" />
        ) : filtered.length === 0 ? (
          <div className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No applications in this status.
          </div>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((item) => (
              <article key={item.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-950">{item.user?.name || item.user?.email || 'Applicant'}</h2>
                    <span className={`px-2.5 py-1 text-xs font-semibold ${tone(item.status)}`}>{item.status}</span>
                  </div>
                  <Link href={'/property/' + item.property.id} className="mt-2 block text-sm font-medium text-[#0F2B46] hover:text-[#16A34A]">
                    {item.property?.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span>Applied {formatDate(item.appliedAt)}</span>
                    {item.user?.phone && <span>{item.user.phone}</span>}
                    {item.user?.email && <span>{item.user.email}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    {item.user?.isIdVerified && <span className="bg-emerald-50 px-2 py-1 text-emerald-700">ID verified</span>}
                    {item.user?.isPhoneVerified && <span className="bg-emerald-50 px-2 py-1 text-emerald-700">Phone verified</span>}
                    {item.user?.isEmailVerified && <span className="bg-emerald-50 px-2 py-1 text-emerald-700">Email verified</span>}
                  </div>
                </div>

                {item.status === 'PENDING' ? (
                  <div className="grid gap-2">
                    <button disabled={busyId === item.id} onClick={() => decide(item.id, 'APPROVED')} className="bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                      Approve application
                    </button>
                    <button disabled={busyId === item.id} onClick={() => decide(item.id, 'REJECTED')} className="border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50">
                      Reject application
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Decision recorded. No lease or payment was created automatically.</div>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
