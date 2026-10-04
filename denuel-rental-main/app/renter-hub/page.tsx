'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

type Application = {
  id: string;
  status: string;
  appliedAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    area?: string | null;
    price: number;
    status: string;
    images?: Array<{ url: string }>;
  };
};

type Lease = {
  id: string;
  status: string;
  monthlyRent: number;
  deposit?: number | null;
  startDate: string;
  endDate: string;
  landlordSigned: boolean;
  tenantSigned: boolean;
  property: {
    id: string;
    title: string;
    addressText?: string | null;
    city: string;
    area?: string | null;
  };
  landlord: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
  };
};

type RentPayment = {
  id: string;
  status: string;
  amount: number;
  lateFee?: number | null;
  dueDate: string;
  paidDate?: string | null;
  lease: {
    id: string;
    property: {
      id: string;
      title: string;
    };
  };
};

type TransportRequest = {
  id: string;
  status: string;
  pickupAddressText: string;
  dropoffAddressText: string;
  lockedPriceZmw?: number | null;
  priceEstimateZmw: number;
  createdAt: string;
};

type Overview = {
  profile: {
    id: string;
    name?: string | null;
    email: string;
  };
  stats: {
    applications: number;
    pendingApplications: number;
    activeLeases: number;
    pendingPayments: number;
    overduePayments: number;
    amountDue: number;
    savedProperties: number;
    savedSearches: number;
    unreadNotifications: number;
    activeTransport: number;
  };
  applications: Application[];
  leases: Lease[];
  payments: RentPayment[];
  transportRequests: TransportRequest[];
};

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
  if (['APPROVED', 'ACTIVE', 'PAID', 'COMPLETED'].includes(status)) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (['REJECTED', 'CANCELED'].includes(status)) {
    return 'border-red-200 bg-red-50 text-red-800';
  }
  if (['IN_PROGRESS', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING'].includes(status)) {
    return 'border-blue-200 bg-blue-50 text-blue-800';
  }
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

export default function RenterHub() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadOverview(initial = false) {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError('');

    try {
      const res = await fetch('/api/renter/overview', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        window.location.href =
          '/auth/login?redirect=' + encodeURIComponent('/renter-hub');
        return;
      }

      if (!res.ok) {
        throw new Error(
          data?.error || text || 'Unable to load your renter workspace.'
        );
      }

      setOverview(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your renter workspace.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOverview(true);
  }, []);

  const activeLeases = useMemo(
    () => overview?.leases.filter((lease) => lease.status === 'ACTIVE') || [],
    [overview]
  );

  const pendingPayments = useMemo(
    () =>
      overview?.payments.filter(
        (payment) =>
          payment.status === 'PENDING' || payment.status === 'PARTIAL'
      ) || [],
    [overview]
  );

  const now = Date.now();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">Renter workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
              {overview?.profile?.name
                ? overview.profile.name + ' · Renter Hub'
                : 'Renter Hub'}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Track property applications, leases, rent payments, saved activity and transport requests using records already stored in DENUEL.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadOverview(false)}
              disabled={refreshing}
              className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <Link
              href="/rent"
              className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Browse rentals
            </Link>
          </div>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        )}

        <section className="mt-7 grid grid-cols-2 border-l border-t border-slate-200 bg-white lg:grid-cols-4">
          {[
            ['Applications', overview?.stats.applications ?? 0, overview?.stats.pendingApplications ? overview.stats.pendingApplications + ' pending' : 'No pending applications'],
            ['Active leases', overview?.stats.activeLeases ?? 0, 'Tenant-side lease records'],
            ['Amount currently due', money(overview?.stats.amountDue), overview?.stats.overduePayments ? overview.stats.overduePayments + ' overdue' : 'No overdue payment'],
            ['Active transport', overview?.stats.activeTransport ?? 0, 'Current transport requests'],
          ].map(([label, value, note]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold">
                {loading ? '—' : value}
              </div>
              <div className="mt-1 text-xs text-slate-400">{note}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Quick access</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Saved properties', '/favorites', overview?.stats.savedProperties ?? 0],
              ['Saved searches', '/saved-search', overview?.stats.savedSearches ?? 0],
              ['Notifications', '/notifications', overview?.stats.unreadNotifications ?? 0],
              ['Transport requests', '/transport/requests', overview?.stats.activeTransport ?? 0],
              ['Property inquiries', '/inquiries', null],
              ['Rent payment centre', '/rent-payment', overview?.stats.pendingPayments ?? 0],
              ['Budget calculator', '/business-tools/budget-calculator', null],
              ['Renter safety guide', '/safety-tips', null],
            ].map(([label, href, count]) => (
              <Link
                key={String(href)}
                href={String(href)}
                className="border-b border-r border-slate-200 p-4 transition hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-800">{label}</div>
                {count !== null && (
                  <div className="mt-2 text-xl font-bold text-slate-950">
                    {loading ? '—' : Number(count).toLocaleString()}
                  </div>
                )}
                <div className="mt-3 text-xs font-semibold text-blue-700">Open →</div>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div className="space-y-6">
            <section id="applications" className="border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-semibold">Property applications</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Applications you submitted through DENUEL.
                  </p>
                </div>
                <Link href="/rent" className="text-sm font-semibold text-blue-700">
                  Find rentals
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse bg-slate-100" />
                  ))}
                </div>
              ) : overview?.applications.length ? (
                <div className="divide-y divide-slate-100">
                  {overview.applications.slice(0, 8).map((application) => (
                    <Link
                      key={application.id}
                      href={'/property/' + application.property.id}
                      className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {application.property.title}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {[application.property.area, application.property.city]
                            .filter(Boolean)
                            .join(', ')}
                          {' · '}Applied{' '}
                          {new Date(application.appliedAt).toLocaleDateString('en-ZM')}
                        </div>
                      </div>
                      <span
                        className={
                          'w-fit border px-2.5 py-1 text-xs font-semibold sm:justify-self-end ' +
                          statusClass(application.status)
                        }
                      >
                        {humanize(application.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8">
                  <h3 className="font-semibold">No applications yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Approved rental listings now include a real application action.
                  </p>
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold">Lease records</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Lease agreements where your account is the tenant.
                </p>
              </div>

              {loading ? (
                <div className="p-5 text-sm text-slate-500">Loading leases…</div>
              ) : overview?.leases.length ? (
                <div className="divide-y divide-slate-100">
                  {overview.leases.slice(0, 6).map((lease) => (
                    <article key={lease.id} className="p-5">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{lease.property.title}</h3>
                            <span
                              className={
                                'border px-2 py-0.5 text-xs font-semibold ' +
                                statusClass(lease.status)
                              }
                            >
                              {humanize(lease.status)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            {[lease.property.area, lease.property.city]
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                          <div className="mt-2 text-xs text-slate-400">
                            {new Date(lease.startDate).toLocaleDateString('en-ZM')} –{' '}
                            {new Date(lease.endDate).toLocaleDateString('en-ZM')}
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <div className="text-xs text-slate-400">Monthly rent</div>
                          <div className="mt-1 text-lg font-bold">
                            {money(lease.monthlyRent)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Landlord: {lease.landlord.name || lease.landlord.email}</span>
                        <span>Tenant signed: {lease.tenantSigned ? 'Yes' : 'No'}</span>
                        <span>Landlord signed: {lease.landlordSigned ? 'Yes' : 'No'}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-sm text-slate-500">
                  No tenant lease is recorded for this account yet.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-semibold">Rent due</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Pending and partial rent-payment records.
                  </p>
                </div>
                <Link href="/rent-payment" className="text-sm font-semibold text-blue-700">
                  Payment centre
                </Link>
              </div>

              {loading ? (
                <div className="p-5 text-sm text-slate-500">Loading payments…</div>
              ) : pendingPayments.length ? (
                <div className="divide-y divide-slate-100">
                  {pendingPayments.slice(0, 8).map((payment) => {
                    const overdue = new Date(payment.dueDate).getTime() < now;
                    return (
                      <div key={payment.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold">
                              {payment.lease.property.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Due {new Date(payment.dueDate).toLocaleDateString('en-ZM')}
                            </div>
                            {overdue && (
                              <div className="mt-2 text-xs font-semibold text-red-700">
                                Overdue
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold">
                              {money(Number(payment.amount || 0) + Number(payment.lateFee || 0))}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {humanize(payment.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-500">
                  No pending rent payment is recorded.
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-semibold">Recent transport</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Latest requests created by your account.
                  </p>
                </div>
                <Link
                  href="/transport/requests"
                  className="text-sm font-semibold text-blue-700"
                >
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="p-5 text-sm text-slate-500">Loading transport…</div>
              ) : overview?.transportRequests.length ? (
                <div className="divide-y divide-slate-100">
                  {overview.transportRequests.slice(0, 5).map((request) => (
                    <Link
                      href="/transport/requests"
                      key={request.id}
                      className="block p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={
                            'border px-2 py-0.5 text-xs font-semibold ' +
                            statusClass(request.status)
                          }
                        >
                          {humanize(request.status)}
                        </span>
                        <span className="text-sm font-semibold">
                          {money(request.lockedPriceZmw || request.priceEstimateZmw)}
                        </span>
                      </div>
                      <div className="mt-3 truncate text-sm font-medium">
                        {request.pickupAddressText}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        to {request.dropoffAddressText}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-sm text-slate-500">
                    No transport request is recorded yet.
                  </p>
                  <Link
                    href="/transport"
                    className="mt-3 inline-flex text-sm font-semibold text-blue-700"
                  >
                    Request transport →
                  </Link>
                </div>
              )}
            </section>

            {activeLeases.length === 0 && (
              <section className="border border-blue-200 bg-blue-50 p-5">
                <h2 className="font-semibold">Still looking for a home?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Browse approved rental listings and apply directly from the property page.
                </p>
                <Link
                  href="/rent"
                  className="mt-4 inline-flex bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Browse rentals
                </Link>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
