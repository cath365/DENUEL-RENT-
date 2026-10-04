'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

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
  if (status === 'CONFIRMED' || status === 'COMPLETED') {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (status === 'CANCELED' || status === 'NO_SHOW') {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-amber-50 text-amber-700';
}

function toLocalInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

export default function LandlordViewingsPage() {
  const [viewings, setViewings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState('');
  const [rescheduleId, setRescheduleId] = useState('');
  const [rescheduleAt, setRescheduleAt] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        '/api/viewings?role=owner&upcoming=false'
      );

      if (response.status === 401) {
        window.location.href =
          '/auth/login?redirect=/landlord/viewings';
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to load viewing requests.'
        );
      }

      setViewings(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load viewing requests.'
      );
      setViewings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: viewings.length,
      pending: viewings.filter(
        (viewing) => viewing.status === 'PENDING'
      ).length,
      confirmed: viewings.filter(
        (viewing) => viewing.status === 'CONFIRMED'
      ).length,
      completed: viewings.filter(
        (viewing) => viewing.status === 'COMPLETED'
      ).length,
    }),
    [viewings]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return viewings.filter((viewing) => {
      if (
        statusFilter !== 'ALL' &&
        viewing.status !== statusFilter
      ) {
        return false;
      }

      if (!needle) return true;

      return [
        viewing.visitor?.name,
        viewing.visitor?.email,
        viewing.visitor?.phone,
        viewing.property?.title,
        viewing.property?.city,
        viewing.property?.area,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        );
    });
  }, [viewings, query, statusFilter]);

  async function updateViewing(
    viewing: any,
    payload: Record<string, unknown>
  ) {
    setBusyId(viewing.id);
    setError('');

    try {
      const response = await csrfFetch('/api/viewings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: viewing.id,
          ...payload,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.id) {
        throw new Error(
          data.error || 'Unable to update this viewing.'
        );
      }

      setViewings((current) =>
        current.map((item) =>
          item.id === viewing.id
            ? {
                ...item,
                ...data,
                property: data.property || item.property,
                visitor: data.visitor || item.visitor,
              }
            : item
        )
      );

      setRescheduleId('');
      setRescheduleAt('');
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Unable to update this viewing.'
      );
    } finally {
      setBusyId('');
    }
  }

  async function confirmViewing(viewing: any) {
    await updateViewing(viewing, { status: 'CONFIRMED' });
  }

  async function cancelViewing(viewing: any) {
    if (!window.confirm('Cancel this viewing request?')) return;
    await updateViewing(viewing, { status: 'CANCELED' });
  }

  async function completeViewing(viewing: any) {
    if (!window.confirm('Mark this viewing as completed?')) return;
    await updateViewing(viewing, { status: 'COMPLETED' });
  }

  async function markNoShow(viewing: any) {
    if (!window.confirm('Mark this visitor as a no-show?')) return;
    await updateViewing(viewing, { status: 'NO_SHOW' });
  }

  async function reschedule(viewing: any) {
    if (!rescheduleAt) {
      setError('Choose the new viewing date and time.');
      return;
    }

    const date = new Date(rescheduleAt);

    if (
      Number.isNaN(date.getTime()) ||
      date.getTime() <= Date.now()
    ) {
      setError('Choose a valid future date and time.');
      return;
    }

    await updateViewing(viewing, {
      scheduledAt: date.toISOString(),
    });
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/landlord"
              className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]"
            >
              ← Landlord dashboard
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">
              Property appointments
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Viewing requests
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Confirm, reschedule and close real viewing requests for properties
              you manage.
            </p>
          </div>

          <Link
            href="/dashboard/properties"
            className="w-fit border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            My properties
          </Link>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['All requests', stats.total],
            ['Pending', stats.pending],
            ['Confirmed', stats.confirmed],
            ['Completed', stats.completed],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="border-b border-r border-slate-200 bg-white p-5"
            >
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">
                {Number(value).toLocaleString()}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search visitor, property or location"
            className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-11 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELED">Canceled</option>
            <option value="NO_SHOW">No-show</option>
          </select>
        </section>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-80 animate-pulse border border-slate-200 bg-white" />
        ) : viewings.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">
              No viewing requests yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Requests will appear here only after a real user asks to view one
              of your approved properties.
            </p>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No viewing request matches the current filters.
          </section>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((viewing) => {
              const active = ['PENDING', 'CONFIRMED'].includes(
                viewing.status
              );
              const canComplete =
                viewing.status === 'CONFIRMED';
              const image = viewing.property?.images?.[0]?.url;

              return (
                <article
                  key={viewing.id}
                  className="grid gap-5 p-5 lg:grid-cols-[110px_minmax(0,1fr)_280px] lg:items-start"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={viewing.property?.title || ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">
                        {viewing.visitor?.name ||
                          viewing.visitor?.email ||
                          'Visitor'}
                      </h2>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold ${statusTone(
                          viewing.status
                        )}`}
                      >
                        {viewing.status}
                      </span>
                    </div>

                    <Link
                      href={'/property/' + viewing.property.id}
                      className="mt-2 block text-sm font-medium text-[#0F2B46] hover:text-[#16A34A]"
                    >
                      {viewing.property?.title || 'Property'}
                    </Link>

                    <p className="mt-1 text-sm text-slate-500">
                      {[viewing.property?.area, viewing.property?.city]
                        .filter(Boolean)
                        .join(', ')}
                    </p>

                    <div className="mt-3 text-base font-semibold text-slate-900">
                      {formatDateTime(viewing.scheduledAt)}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      {viewing.visitor?.phone && (
                        <span>{viewing.visitor.phone}</span>
                      )}
                      {viewing.visitor?.email && (
                        <span>{viewing.visitor.email}</span>
                      )}
                    </div>

                    {viewing.notes && (
                      <div className="mt-4 border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                        {viewing.notes}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    {viewing.status === 'PENDING' && (
                      <button
                        type="button"
                        disabled={busyId === viewing.id}
                        onClick={() => confirmViewing(viewing)}
                        className="bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {busyId === viewing.id
                          ? 'Saving…'
                          : 'Confirm viewing'}
                      </button>
                    )}

                    {active && (
                      <>
                        {rescheduleId === viewing.id ? (
                          <div className="border border-slate-200 bg-slate-50 p-3">
                            <label className="mb-2 block text-xs font-semibold text-slate-600">
                              New date and time
                            </label>
                            <input
                              type="datetime-local"
                              value={rescheduleAt}
                              min={toLocalInput(
                                new Date(
                                  Date.now() + 5 * 60 * 1000
                                ).toISOString()
                              )}
                              onChange={(event) =>
                                setRescheduleAt(event.target.value)
                              }
                              className="h-11 w-full border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#16A34A]"
                            />

                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={
                                  busyId === viewing.id ||
                                  !rescheduleAt
                                }
                                onClick={() => reschedule(viewing)}
                                className="bg-[#0F2B46] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Save new time
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRescheduleId('');
                                  setRescheduleAt('');
                                }}
                                className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setRescheduleId(viewing.id);
                              setRescheduleAt(
                                toLocalInput(viewing.scheduledAt)
                              );
                            }}
                            className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                          >
                            Reschedule
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={busyId === viewing.id}
                          onClick={() => cancelViewing(viewing)}
                          className="border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                        >
                          Cancel viewing
                        </button>
                      </>
                    )}

                    {canComplete && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busyId === viewing.id}
                          onClick={() => completeViewing(viewing)}
                          className="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                        >
                          Completed
                        </button>
                        <button
                          type="button"
                          disabled={busyId === viewing.id}
                          onClick={() => markNoShow(viewing)}
                          className="border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          No-show
                        </button>
                      </div>
                    )}

                    {!active &&
                      !canComplete &&
                      viewing.status !== 'CONFIRMED' && (
                        <div className="border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                          This viewing is part of the appointment history.
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
