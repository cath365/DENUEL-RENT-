'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-ZM', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function tone(status?: string) {
  if (['CONFIRMED', 'COMPLETED'].includes(status || '')) return 'bg-emerald-50 text-emerald-700';
  if (['CANCELED', 'NO_SHOW'].includes(status || '')) return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

function localInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function AgentViewingsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [busyId, setBusyId] = useState('');
  const [rescheduleId, setRescheduleId] = useState('');
  const [newTime, setNewTime] = useState('');

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/viewings?role=owner&upcoming=false');
      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/agent/viewings';
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to load viewings.');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load viewings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => filter === 'ALL' ? items : items.filter((item) => item.status === filter),
    [items, filter]
  );

  async function update(item: any, payload: any) {
    setBusyId(item.id);
    setError('');
    try {
      const response = await csrfFetch('/api/viewings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: item.id, ...payload }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.id) throw new Error(data.error || 'Unable to update this viewing.');
      setItems((current) => current.map((row) => row.id === item.id ? { ...row, ...data, property: data.property || row.property, visitor: data.visitor || row.visitor } : row));
      setRescheduleId('');
      setNewTime('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to update this viewing.');
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
          <div className="mt-4 text-sm font-semibold text-[#16A34A]">Client appointments</div>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">Viewing requests</h1>
          <p className="mt-2 text-sm text-slate-600">Confirm and manage real viewing requests for properties you manage.</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED', 'NO_SHOW'].map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`border px-3 py-2 text-sm font-semibold ${filter === status ? 'border-[#0F2B46] bg-[#0F2B46] text-white' : 'border-slate-300 bg-white text-slate-600'}`}>
              {status}
            </button>
          ))}
        </div>

        {error && <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="mt-6 h-72 animate-pulse border border-slate-200 bg-white" />
        ) : filtered.length === 0 ? (
          <div className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">No viewing requests in this status.</div>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((item) => {
              const active = ['PENDING', 'CONFIRMED'].includes(item.status);

              return (
                <article key={item.id} className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">{item.visitor?.name || item.visitor?.email || 'Visitor'}</h2>
                      <span className={`px-2.5 py-1 text-xs font-semibold ${tone(item.status)}`}>{item.status}</span>
                    </div>
                    <Link href={'/property/' + item.property.id} className="mt-2 block text-sm font-medium text-[#0F2B46] hover:text-[#16A34A]">{item.property?.title}</Link>
                    <div className="mt-3 font-semibold text-slate-900">{formatDateTime(item.scheduledAt)}</div>
                    <div className="mt-2 text-xs text-slate-500">{[item.visitor?.phone, item.visitor?.email].filter(Boolean).join(' · ')}</div>
                    {item.notes && <div className="mt-4 border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">{item.notes}</div>}
                  </div>

                  <div className="grid gap-2">
                    {item.status === 'PENDING' && (
                      <button disabled={busyId === item.id} onClick={() => update(item, { status: 'CONFIRMED' })} className="bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                        Confirm viewing
                      </button>
                    )}

                    {active && rescheduleId !== item.id && (
                      <button
                        onClick={() => { setRescheduleId(item.id); setNewTime(localInput(item.scheduledAt)); }}
                        className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        Reschedule
                      </button>
                    )}

                    {rescheduleId === item.id && (
                      <div className="border border-slate-200 bg-slate-50 p-3">
                        <input type="datetime-local" value={newTime} onChange={(event) => setNewTime(event.target.value)} className="h-11 w-full border border-slate-300 bg-white px-2 text-sm" />
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            disabled={!newTime || busyId === item.id}
                            onClick={() => {
                              const date = new Date(newTime);
                              if (date.getTime() <= Date.now()) {
                                setError('Choose a future viewing time.');
                                return;
                              }
                              update(item, { scheduledAt: date.toISOString() });
                            }}
                            className="bg-[#0F2B46] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button onClick={() => { setRescheduleId(''); setNewTime(''); }} className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold">Close</button>
                        </div>
                      </div>
                    )}

                    {item.status === 'CONFIRMED' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button disabled={busyId === item.id} onClick={() => update(item, { status: 'COMPLETED' })} className="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">Completed</button>
                        <button disabled={busyId === item.id} onClick={() => update(item, { status: 'NO_SHOW' })} className="border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold">No-show</button>
                      </div>
                    )}

                    {active && (
                      <button disabled={busyId === item.id} onClick={() => update(item, { status: 'CANCELED' })} className="border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                        Cancel viewing
                      </button>
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
