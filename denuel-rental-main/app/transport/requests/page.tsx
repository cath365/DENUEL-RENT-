'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';
import { csrfFetch } from '../../../lib/csrf';

type TransportRequest = {
  id: string;
  status: string;
  vehicleType: string;
  pickupAddressText: string;
  dropoffAddressText: string;
  distanceKmEstimated: number;
  durationMinEstimated: number;
  priceEstimateZmw: number;
  lockedPriceZmw?: number | null;
  expiresAt?: string | null;
  createdAt: string;
  assignedDriver?: {
    id: string;
    vehicleType: string;
    vehiclePlate: string;
    vehicleMake?: string | null;
    vehicleModel?: string | null;
    ratingAvg: number;
    ratingCount: number;
    user?: {
      name?: string | null;
      phone?: string | null;
      profileImage?: string | null;
    } | null;
  } | null;
  Rating?: {
    id: string;
    stars: number;
    comment?: string | null;
    createdAt: string;
  } | null;
  property?: {
    id: string;
    title: string;
  } | null;
};

type Filter =
  | 'ALL'
  | 'REQUESTED'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'EXPIRED';

const CANCELABLE = new Set([
  'REQUESTED',
  'SEARCHING',
  'DRIVER_ASSIGNED',
  'DRIVER_ARRIVING',
]);

function money(value?: number | null) {
  return 'K' + Number(value || 0).toLocaleString();
}

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  if (status === 'COMPLETED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'CANCELED' || status === 'EXPIRED') return 'border-slate-300 bg-slate-100 text-slate-700';
  if (status === 'IN_PROGRESS') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'DRIVER_ASSIGNED' || status === 'DRIVER_ARRIVING') return 'border-violet-200 bg-violet-50 text-violet-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
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

function RatingForm({
  request,
  onSaved,
}: {
  request: TransportRequest;
  onSaved: () => Promise<void>;
}) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submitRating() {
    setSaving(true);
    setError('');

    try {
      const res = await csrfFetch('/api/transport/' + request.id + '/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stars,
          comment: comment.trim() || undefined,
        }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/transport/requests&reason=session';
        return;
      }

      if (!res.ok) {
        const validation = Array.isArray(data?.error)
          ? data.error.map((item: any) => item.message).filter(Boolean).join(' ')
          : data?.error;
        throw new Error(validation || text || 'Unable to save rating.');
      }

      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save rating.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-semibold">Rate this completed trip</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStars(value)}
            className={
              'flex h-10 w-10 items-center justify-center border text-lg ' +
              (value <= stars
                ? 'border-amber-300 bg-amber-50 text-amber-500'
                : 'border-slate-300 bg-white text-slate-300')
            }
            aria-label={value + ' stars'}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Optional review"
        className="mt-3 w-full border border-slate-300 bg-white p-3 text-sm"
      />

      {error && <div className="mt-3 text-sm text-red-700">{error}</div>}

      <button
        type="button"
        onClick={submitRating}
        disabled={saving}
        className="mt-3 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Saving rating…' : 'Submit rating'}
      </button>
    </div>
  );
}

export default function MyTransportRequestsPage() {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadRequests(showLoader = false) {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);

      const res = await fetch('/api/transport/my?' + params.toString(), {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/transport/requests&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load transport requests.');
      }

      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      setRequests([]);
      setError(err instanceof Error ? err.message : 'Unable to load transport requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    setError('');
    loadRequests(true);
  }, [filter]);

  useEffect(() => {
    const hasActive = requests.some((request) =>
      ['REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'IN_PROGRESS'].includes(request.status),
    );

    if (!hasActive) return;

    const timer = window.setInterval(() => {
      loadRequests(false);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [requests, filter]);

  const stats = useMemo(() => {
    const active = requests.filter((request) =>
      ['REQUESTED', 'SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'IN_PROGRESS'].includes(request.status),
    ).length;
    const completed = requests.filter((request) => request.status === 'COMPLETED').length;
    const canceled = requests.filter((request) => request.status === 'CANCELED').length;
    const expired = requests.filter((request) => request.status === 'EXPIRED').length;

    return { active, completed, canceled, expired };
  }, [requests]);

  async function cancelRequest(requestId: string) {
    if (!window.confirm('Cancel this transport request?')) return;

    setProcessing('cancel-' + requestId);
    setError('');
    setNotice('');

    try {
      const res = await csrfFetch('/api/transport/' + requestId + '/cancel', {
        method: 'POST',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/transport/requests&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to cancel transport request.');
      }

      setNotice('Transport request canceled.');
      await loadRequests(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel transport request.');
    } finally {
      setProcessing('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">DENUEL Transport</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">My transport requests</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Track real request status, assigned-driver details, trip completion and ratings. Active requests refresh automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadRequests(false)}
              disabled={refreshing}
              className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link href="/transport" className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              New request
            </Link>
          </div>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        )}

        {notice && (
          <section className="mt-6 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </section>
        )}

        <section className="mt-7 grid grid-cols-2 border-l border-t border-slate-200 bg-white sm:grid-cols-4">
          {[
            ['Active', stats.active],
            ['Completed', stats.completed],
            ['Canceled', stats.canceled],
            ['Expired', stats.expired],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-4">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-2 text-xl font-bold">{loading ? '—' : Number(value).toLocaleString()}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 flex flex-wrap gap-2">
          {([
            ['ALL', 'All'],
            ['REQUESTED', 'Requested'],
            ['DRIVER_ASSIGNED', 'Assigned'],
            ['DRIVER_ARRIVING', 'Driver arriving'],
            ['IN_PROGRESS', 'In progress'],
            ['COMPLETED', 'Completed'],
            ['CANCELED', 'Canceled'],
            ['EXPIRED', 'Expired'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                'border px-3 py-2 text-sm font-semibold ' +
                (filter === value
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-300 bg-white text-slate-600')
              }
            >
              {label}
            </button>
          ))}
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : requests.length ? (
            <div className="divide-y divide-slate-100">
              {requests.map((request) => (
                <article key={request.id} className="p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={'border px-2.5 py-1 text-xs font-semibold ' + statusClass(request.status)}>
                          {humanize(request.status)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(request.createdAt).toLocaleString('en-ZM')}
                        </span>
                      </div>

                      <div className="mt-4 text-sm font-semibold">{request.pickupAddressText}</div>
                      <div className="mt-1 text-sm text-slate-600">to {request.dropoffAddressText}</div>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{humanize(request.vehicleType)}</span>
                        <span>{Number(request.distanceKmEstimated || 0).toFixed(1)} km</span>
                        <span>{Math.round(Number(request.durationMinEstimated || 0))} min estimated</span>
                        {request.property?.title && <span>Property: {request.property.title}</span>}
                      </div>

                      {request.assignedDriver && (
                        <div className="mt-5 border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assigned driver</div>
                          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white font-bold text-slate-500">
                                {request.assignedDriver.user?.profileImage ? (
                                  <img
                                    src={request.assignedDriver.user.profileImage}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  (request.assignedDriver.user?.name || 'D').slice(0, 1).toUpperCase()
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-semibold">{request.assignedDriver.user?.name || 'Assigned driver'}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {[request.assignedDriver.vehicleMake, request.assignedDriver.vehicleModel]
                                    .filter(Boolean)
                                    .join(' ') || humanize(request.assignedDriver.vehicleType)}
                                  {' · '}{request.assignedDriver.vehiclePlate}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {request.assignedDriver.ratingCount
                                    ? Number(request.assignedDriver.ratingAvg || 0).toFixed(1) + '/5 from ' + request.assignedDriver.ratingCount + ' rating' + (request.assignedDriver.ratingCount === 1 ? '' : 's')
                                    : 'No recorded ratings yet'}
                                </div>
                              </div>
                            </div>

                            {request.assignedDriver.user?.phone && (
                              <a
                                href={'tel:' + request.assignedDriver.user.phone}
                                className="border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
                              >
                                Call driver
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {request.status === 'COMPLETED' && request.Rating && (
                        <div className="mt-4 border border-emerald-200 bg-emerald-50 p-4">
                          <div className="text-sm font-semibold text-emerald-900">Your rating: {request.Rating.stars}/5</div>
                          {request.Rating.comment && (
                            <p className="mt-2 text-sm leading-6 text-emerald-800">{request.Rating.comment}</p>
                          )}
                        </div>
                      )}

                      {request.status === 'COMPLETED' && !request.Rating && (
                        <RatingForm request={request} onSaved={() => loadRequests(false)} />
                      )}
                    </div>

                    <div className="shrink-0 lg:w-48 lg:text-right">
                      <div className="text-xs text-slate-400">Locked fare</div>
                      <div className="mt-1 text-xl font-bold">{money(request.lockedPriceZmw || request.priceEstimateZmw)}</div>

                      {request.expiresAt && request.status === 'REQUESTED' && (
                        <div className="mt-2 text-xs text-slate-500">
                          Expires {new Date(request.expiresAt).toLocaleTimeString('en-ZM', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}

                      {CANCELABLE.has(request.status) && (
                        <button
                          type="button"
                          onClick={() => cancelRequest(request.id)}
                          disabled={processing === 'cancel-' + request.id}
                          className="mt-4 w-full border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                        >
                          {processing === 'cancel-' + request.id ? 'Canceling…' : 'Cancel request'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <h2 className="font-semibold">No transport requests found</h2>
              <p className="mt-2 text-sm text-slate-500">
                {filter === 'ALL'
                  ? 'Your real transport requests will appear here after you create one.'
                  : 'No requests match this status.'}
              </p>
              <Link href="/transport" className="mt-5 inline-flex bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                Create transport request
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
