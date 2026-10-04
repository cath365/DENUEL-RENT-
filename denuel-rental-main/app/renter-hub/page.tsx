'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

type LoadState = 'loading' | 'ready' | 'error';

function statusTone(status?: string) {
  if (!status) return 'bg-slate-100 text-slate-600';
  if (['APPROVED', 'ACTIVE', 'CONFIRMED', 'PAID', 'COMPLETED'].includes(status)) {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (['REJECTED', 'CANCELED', 'TERMINATED', 'FAILED'].includes(status)) {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-amber-50 text-amber-700';
}

function money(value: unknown) {
  return 'K' + Number(value || 0).toLocaleString();
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

export default function RenterHub() {
  const [applications, setApplications] = useState<any[]>([]);
  const [viewings, setViewings] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function loadJson(url: string) {
    const response = await fetch(url);

    if (response.status === 401) {
      window.location.href = '/auth/login?redirect=/renter-hub';
      throw new Error('AUTH_REDIRECT');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        typeof data?.error === 'string'
          ? data.error
          : 'Unable to load renter information.'
      );
    }

    return data;
  }

  async function loadHub() {
    setState('loading');
    setError('');

    try {
      const results = await Promise.allSettled([
        loadJson('/api/applications'),
        loadJson('/api/viewings?role=visitor&upcoming=false'),
        loadJson('/api/landlord/leases?role=tenant'),
        loadJson('/api/landlord/rent-payments?role=tenant'),
        loadJson('/api/messages'),
        loadJson('/api/favorites'),
      ]);

      const failures = results.filter((result) => result.status === 'rejected');

      const [applicationsResult, viewingsResult, leasesResult, paymentsResult, messagesResult, favoritesResult] = results;

      if (applicationsResult.status === 'fulfilled') {
        setApplications(Array.isArray(applicationsResult.value) ? applicationsResult.value : []);
      }

      if (viewingsResult.status === 'fulfilled') {
        setViewings(Array.isArray(viewingsResult.value) ? viewingsResult.value : []);
      }

      if (leasesResult.status === 'fulfilled') {
        setLeases(Array.isArray(leasesResult.value) ? leasesResult.value : []);
      }

      if (paymentsResult.status === 'fulfilled') {
        setPayments(
          Array.isArray(paymentsResult.value?.payments)
            ? paymentsResult.value.payments
            : []
        );
      }

      if (messagesResult.status === 'fulfilled') {
        setThreads(
          Array.isArray(messagesResult.value?.threads)
            ? messagesResult.value.threads
            : []
        );
      }

      if (favoritesResult.status === 'fulfilled') {
        setFavorites(
          Array.isArray(favoritesResult.value?.items)
            ? favoritesResult.value.items
            : []
        );
      }

      if (failures.length === results.length) {
        throw new Error('Unable to load your renter account right now.');
      }

      if (failures.length > 0) {
        setError('Some renter information could not be loaded. The available records are shown below.');
      }

      setState('ready');
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message === 'AUTH_REDIRECT') return;
      setState('error');
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load your renter account right now.'
      );
    }
  }

  useEffect(() => {
    loadHub();
  }, []);

  const activeLeases = useMemo(
    () => leases.filter((lease) => lease.status === 'ACTIVE'),
    [leases]
  );

  const upcomingViewings = useMemo(
    () =>
      viewings.filter((viewing) => {
        const time = new Date(viewing.scheduledAt).getTime();
        return (
          Number.isFinite(time) &&
          time >= Date.now() &&
          !['CANCELED', 'COMPLETED', 'NO_SHOW'].includes(viewing.status)
        );
      }),
    [viewings]
  );

  const pendingPayments = useMemo(
    () =>
      payments.filter((payment) =>
        ['PENDING', 'PARTIAL', 'LATE'].includes(payment.status)
      ),
    [payments]
  );

  async function cancelViewing(viewingId: string) {
    if (!window.confirm('Cancel this viewing request?')) return;

    setBusyId(viewingId);
    setError('');

    try {
      const response = await csrfFetch(
        '/api/viewings?id=' + encodeURIComponent(viewingId),
        { method: 'DELETE' }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to cancel this viewing.');
      }

      setViewings((current) =>
        current.filter((viewing) => viewing.id !== viewingId)
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Unable to cancel this viewing.'
      );
    } finally {
      setBusyId('');
    }
  }

  async function signLease(leaseId: string) {
    if (!window.confirm('Sign this lease as the tenant?')) return;

    setBusyId(leaseId);
    setError('');

    try {
      const response = await csrfFetch('/api/landlord/leases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId,
          action: 'sign',
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to sign this lease.');
      }

      await loadHub();
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

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="h-44 animate-pulse border border-slate-200 bg-white" />
          <div className="mt-6 h-80 animate-pulse border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">My home</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Renter Hub
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track the real activity connected to your Ng&apos;anda account: applications, viewings, enquiries, leases and rent records.
            </p>
          </div>

          <Link
            href="/rent"
            className="inline-flex w-fit bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Find properties
          </Link>
        </div>

        {error && (
          <div className="mt-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {state === 'error' ? (
          <section className="mt-6 border border-slate-200 bg-white p-8">
            <h2 className="text-lg font-semibold text-slate-950">Renter Hub is temporarily unavailable</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your records have not been changed.
            </p>
            <button
              type="button"
              onClick={loadHub}
              className="mt-5 bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </section>
        ) : (
          <>
            <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-6">
              {[
                ['Applications', applications.length],
                ['Upcoming viewings', upcomingViewings.length],
                ['Enquiries', threads.length],
                ['Saved properties', favorites.length],
                ['Active leases', activeLeases.length],
                ['Rent records due', pendingPayments.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="border-b border-r border-slate-200 bg-white p-5">
                  <div className="text-xs leading-5 text-slate-500">{label}</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
                </div>
              ))}
            </section>

            <section id="applications" className="mt-8 border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Rental applications</h2>
                  <p className="mt-1 text-xs text-slate-500">Only applications you actually submitted appear here.</p>
                </div>
                <Link href="/rent" className="text-sm font-semibold text-[#16A34A]">
                  Browse rentals
                </Link>
              </div>

              {applications.length === 0 ? (
                <div className="p-8 text-sm text-slate-500">
                  You have not submitted any rental applications yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {applications.map((application) => {
                    const property = application.property;
                    const image = property?.images?.[0]?.url;

                    return (
                      <div key={application.id} className="grid gap-4 p-5 sm:grid-cols-[120px_minmax(0,1fr)_150px] sm:items-center">
                        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                          {image ? (
                            <img src={image} alt={property?.title || ''} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <Link
                            href={'/property/' + property.id}
                            className="font-semibold text-slate-950 hover:text-[#16A34A]"
                          >
                            {property?.title || 'Property'}
                          </Link>
                          <p className="mt-1 text-sm text-slate-500">
                            {[property?.area, property?.city].filter(Boolean).join(', ')}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            Applied {formatDate(application.appliedAt)}
                          </p>
                        </div>

                        <div className="sm:text-right">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${statusTone(application.status)}`}>
                            {application.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section id="viewings" className="mt-6 border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-950">Viewing requests</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Requested times are not confirmed until the property lister accepts them.
                </p>
              </div>

              {viewings.length === 0 ? (
                <div className="p-8 text-sm text-slate-500">
                  You have not requested any property viewings yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {viewings.map((viewing) => {
                    const property = viewing.property;
                    const image = property?.images?.[0]?.url;
                    const canCancel =
                      ['PENDING', 'CONFIRMED'].includes(viewing.status) &&
                      new Date(viewing.scheduledAt).getTime() > Date.now();

                    return (
                      <div key={viewing.id} className="grid gap-4 p-5 sm:grid-cols-[110px_minmax(0,1fr)_190px] sm:items-center">
                        <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                          {image ? (
                            <img src={image} alt={property?.title || ''} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                          )}
                        </div>

                        <div>
                          <Link
                            href={'/property/' + property.id}
                            className="font-semibold text-slate-950 hover:text-[#16A34A]"
                          >
                            {property?.title || 'Property'}
                          </Link>
                          <p className="mt-1 text-sm text-slate-500">
                            {[property?.area, property?.city].filter(Boolean).join(', ')}
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-800">
                            {formatDateTime(viewing.scheduledAt)}
                          </p>
                          {viewing.notes && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">{viewing.notes}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                          <span className={`inline-flex w-fit px-2.5 py-1 text-xs font-semibold ${statusTone(viewing.status)}`}>
                            {viewing.status}
                          </span>

                          {canCancel && (
                            <button
                              type="button"
                              disabled={busyId === viewing.id}
                              onClick={() => cancelViewing(viewing.id)}
                              className="text-sm font-semibold text-red-600 disabled:opacity-50"
                            >
                              {busyId === viewing.id ? 'Cancelling…' : 'Cancel request'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Property enquiries</h2>
                    <p className="mt-1 text-xs text-slate-500">Your real conversations with property listers.</p>
                  </div>
                  <Link href="/inquiries" className="text-sm font-semibold text-[#16A34A]">
                    Open messages
                  </Link>
                </div>

                {threads.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">
                    You have not started any property enquiries yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {threads.slice(0, 6).map((thread) => (
                      <Link
                        key={thread.id}
                        href={'/inquiries/' + thread.id}
                        className="block px-5 py-4 hover:bg-slate-50"
                      >
                        <div className="font-semibold text-slate-950">
                          {thread.property?.title || 'Property enquiry'}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {[thread.property?.area, thread.property?.city].filter(Boolean).join(', ')}
                        </div>
                        {thread.messages?.[0]?.body && (
                          <div className="mt-2 line-clamp-1 text-xs text-slate-500">
                            {thread.messages[0].body}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">Saved properties</h2>
                    <p className="mt-1 text-xs text-slate-500">Only approved properties currently saved to your account.</p>
                  </div>
                  <Link href="/favorites" className="text-sm font-semibold text-[#16A34A]">
                    View saved
                  </Link>
                </div>

                {favorites.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">
                    You have not saved any approved properties yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {favorites.slice(0, 5).map((favorite) => {
                      const property = favorite.property;
                      return (
                        <Link
                          key={favorite.id}
                          href={'/property/' + property.id}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50"
                        >
                          <div className="h-16 w-20 overflow-hidden bg-slate-100">
                            {property?.images?.[0]?.url ? (
                              <img src={property.images[0].url} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-950">{property.title}</div>
                            <div className="mt-1 text-sm text-slate-500">
                              {money(property.price)}
                              {property.listingType === 'RENT' ? ' / month' : ''}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            <section id="leases" className="mt-6 border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-950">Lease agreements</h2>
                <p className="mt-1 text-xs text-slate-500">Only lease records where you are the tenant appear here.</p>
              </div>

              {leases.length === 0 ? (
                <div className="p-8 text-sm text-slate-500">
                  No lease agreement is recorded for your account yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {leases.map((lease) => {
                    const property = lease.property;
                    const canSign =
                      !lease.tenantSigned &&
                      ['DRAFT', 'PENDING_SIGNATURES'].includes(lease.status);

                    return (
                      <div key={lease.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">{property?.title || 'Lease'}</h3>
                            <span className={`px-2.5 py-1 text-xs font-semibold ${statusTone(lease.status)}`}>
                              {lease.status}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {[property?.area, property?.city].filter(Boolean).join(', ')}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                            <span>{money(lease.monthlyRent)} / month</span>
                            <span>{formatDate(lease.startDate)} → {formatDate(lease.endDate)}</span>
                          </div>

                          <div className="mt-2 text-xs text-slate-500">
                            Landlord signed: <strong>{lease.landlordSigned ? 'Yes' : 'No'}</strong>
                            {' · '}
                            Tenant signed: <strong>{lease.tenantSigned ? 'Yes' : 'No'}</strong>
                          </div>

                          {lease.documentUrl && (
                            <a
                              href={lease.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex text-sm font-semibold text-[#16A34A]"
                            >
                              Open lease document ↗
                            </a>
                          )}
                        </div>

                        <div className="lg:text-right">
                          {canSign ? (
                            <button
                              type="button"
                              onClick={() => signLease(lease.id)}
                              disabled={busyId === lease.id}
                              className="bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              {busyId === lease.id ? 'Signing…' : 'Sign as tenant'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {lease.status === 'ACTIVE'
                                ? 'Lease active'
                                : lease.tenantSigned
                                  ? 'Tenant signature recorded'
                                  : 'No tenant action available'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section id="payments" className="mt-6 border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-950">Rent payment records</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  These are actual rent records generated from signed leases. Ng&apos;anda does not add automatic late fees or invented payment entries.
                </p>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-sm text-slate-500">
                  No rent payment records are connected to your account yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Property</th>
                        <th className="px-5 py-3 font-semibold">Due date</th>
                        <th className="px-5 py-3 font-semibold">Amount</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Recorded payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-5 py-4 font-medium text-slate-900">
                            {payment.lease?.property?.title || 'Property'}
                          </td>
                          <td className="px-5 py-4 text-slate-600">{formatDate(payment.dueDate)}</td>
                          <td className="px-5 py-4 font-semibold text-slate-900">{money(payment.amount)}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 text-xs font-semibold ${statusTone(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600">
                            {payment.paidDate ? formatDate(payment.paidDate) : 'Not recorded'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
