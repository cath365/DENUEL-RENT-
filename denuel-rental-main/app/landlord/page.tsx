'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

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
  if (!status) return 'bg-slate-100 text-slate-600';

  if (['APPROVED', 'ACTIVE', 'PAID', 'CONFIRMED', 'COMPLETED'].includes(status)) {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (['REJECTED', 'LATE', 'FAILED', 'CANCELED', 'TERMINATED'].includes(status)) {
    return 'bg-red-50 text-red-700';
  }

  return 'bg-amber-50 text-amber-700';
}

function personName(person: any) {
  return person?.companyName || person?.name || 'User';
}

export default function LandlordDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/landlord/dashboard');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord';
        return;
      }

      if (response.status === 403) {
        throw new Error('This dashboard is available to landlord, agent and administrator accounts.');
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error || 'Unable to load the landlord dashboard.'
        );
      }

      setData(json);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load the landlord dashboard.'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = data?.stats || {};
  const mostViewed = Array.isArray(data?.mostViewedProperties)
    ? data.mostViewedProperties
    : [];
  const applications = Array.isArray(data?.recentApplications)
    ? data.recentApplications
    : [];
  const viewings = Array.isArray(data?.upcomingViewings)
    ? data.upcomingViewings
    : [];
  const messages = Array.isArray(data?.recentMessages)
    ? data.recentMessages
    : [];
  const maintenance = Array.isArray(data?.openMaintenance)
    ? data.openMaintenance
    : [];
  const payments = Array.isArray(data?.outstandingPayments)
    ? data.outstandingPayments
    : [];
  const leases = Array.isArray(data?.activeLeases)
    ? data.activeLeases
    : [];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">
              Property operations
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Landlord dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Real activity from the properties you manage on Ng&apos;anda.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/properties"
              className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              My properties
            </Link>
            <Link
              href="/dashboard/properties/new"
              className="bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add property
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-800">
              Dashboard unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={load}
              className="mt-4 bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <>
            <section className="mt-7 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse bg-white"
                />
              ))}
            </section>
            <div className="mt-6 h-96 animate-pulse border border-slate-200 bg-white" />
          </>
        ) : data ? (
          <>
            <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Properties', stats.totalProperties || 0],
                ['Unique viewers', stats.uniquePropertyViewers || 0],
                ['Pending applications', stats.pendingApplications || 0],
                ['Upcoming viewings', stats.upcomingViewings || 0],
                ['Unread messages', stats.unreadMessages || 0],
                ['Active leases', stats.activeLeases || 0],
                ['Outstanding rent', money(stats.outstandingRentAmount || 0)],
                ['Rent collected', money(stats.rentCollected || 0)],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="border-b border-r border-slate-200 bg-white p-5"
                >
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">
                    {typeof value === 'number'
                      ? value.toLocaleString()
                      : value}
                  </div>
                </div>
              ))}
            </section>

            <section className="mt-6 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Approved listings', stats.approvedProperties || 0, '/dashboard/properties'],
                ['Pending property reviews', stats.pendingProperties || 0, '/dashboard/properties'],
                ['Open maintenance', stats.openMaintenance || 0, '/landlord/maintenance'],
                ['Pending screenings', stats.pendingScreenings || 0, '/landlord/screening'],
              ].map(([label, value, href]) => (
                <Link
                  key={String(label)}
                  href={String(href)}
                  className="border-b border-r border-slate-200 bg-white p-4 transition hover:bg-slate-50"
                >
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <div className="text-xl font-bold text-slate-950">
                      {Number(value).toLocaleString()}
                    </div>
                    <span className="text-sm font-semibold text-[#16A34A]">
                      Open →
                    </span>
                  </div>
                </Link>
              ))}
            </section>

            <section className="mt-10">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <div className="text-sm font-semibold text-[#16A34A]">
                    Real viewing activity
                  </div>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">
                    Most viewed properties
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Unique viewer counts are calculated from recorded approved-property visits.
                  </p>
                </div>

                <Link
                  href="/dashboard/properties"
                  className="text-sm font-semibold text-[#16A34A]"
                >
                  Manage all properties
                </Link>
              </div>

              {mostViewed.length === 0 ? (
                <div className="mt-6 border border-slate-200 bg-white p-8">
                  <h3 className="font-semibold text-slate-950">
                    No property viewer data yet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Viewer rankings will appear after real visitors open your approved listings.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {mostViewed.map((property: any, index: number) => {
                    const image = property.images?.[0]?.url;

                    return (
                      <article
                        key={property.id}
                        className="overflow-hidden border border-slate-200 bg-white"
                      >
                        <Link href={'/property/' + property.id}>
                          <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                            {image ? (
                              <img
                                src={image}
                                alt={property.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                No image
                              </div>
                            )}

                            <div className="absolute left-3 top-3 bg-white px-2.5 py-1 text-xs font-bold text-slate-900">
                              #{index + 1}
                            </div>
                          </div>
                        </Link>

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <Link
                                href={'/property/' + property.id}
                                className="line-clamp-1 font-semibold text-slate-950 hover:text-[#16A34A]"
                              >
                                {property.title}
                              </Link>
                              <p className="mt-1 text-sm text-slate-500">
                                {[property.area, property.city]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            </div>

                            <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold ${statusTone(property.status)}`}>
                              {property.status}
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-2 border-l border-t border-slate-200">
                            <div className="border-b border-r border-slate-200 p-3">
                              <div className="text-xs text-slate-500">
                                Viewers
                              </div>
                              <div className="mt-1 text-xl font-bold text-[#0F2B46]">
                                {Number(property.viewerCount || 0).toLocaleString()}
                              </div>
                            </div>

                            <div className="border-b border-r border-slate-200 p-3">
                              <div className="text-xs text-slate-500">
                                Saves
                              </div>
                              <div className="mt-1 text-xl font-bold text-[#0F2B46]">
                                {Number(property.saveCount || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mt-10 grid gap-6 xl:grid-cols-2">
              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Recent rental applications
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Applications submitted to your approved rental properties.
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">
                    {stats.pendingApplications || 0} pending
                  </span>
                </div>

                {applications.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">
                    No rental applications have been received yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {applications.map((application: any) => (
                      <div
                        key={application.id}
                        className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_120px] sm:items-center"
                      >
                        <div>
                          <div className="font-semibold text-slate-950">
                            {personName(application.user)}
                          </div>
                          <Link
                            href={'/property/' + application.property.id}
                            className="mt-1 block text-sm text-slate-500 hover:text-[#16A34A]"
                          >
                            {application.property.title}
                          </Link>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            {application.user?.isIdVerified && (
                              <span>ID verified</span>
                            )}
                            {application.user?.isPhoneVerified && (
                              <span>Phone verified</span>
                            )}
                            <span>
                              Applied {formatDate(application.appliedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${statusTone(application.status)}`}>
                            {application.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Upcoming viewings
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Real viewing requests waiting or already confirmed.
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">
                    {stats.upcomingViewings || 0}
                  </span>
                </div>

                {viewings.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">
                    No upcoming viewing requests.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {viewings.map((viewing: any) => (
                      <div
                        key={viewing.id}
                        className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center"
                      >
                        <div>
                          <div className="font-semibold text-slate-950">
                            {personName(viewing.visitor)}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {viewing.property.title}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {formatDateTime(viewing.scheduledAt)}
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${statusTone(viewing.status)}`}>
                            {viewing.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Property enquiries
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Recent client conversations about your properties.
                    </p>
                  </div>

                  <Link
                    href="/inquiries"
                    className="text-sm font-semibold text-[#16A34A]"
                  >
                    Open messages
                  </Link>
                </div>

                {messages.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">
                    No property enquiries yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {messages.map((thread: any) => (
                      <Link
                        key={thread.id}
                        href={'/inquiries/' + thread.id}
                        className="block px-5 py-4 transition hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-950">
                              {personName(thread.client)}
                            </div>
                            <div className="mt-1 text-sm text-slate-500">
                              {thread.property.title}
                            </div>
                            {thread.lastMessage?.body && (
                              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                                {thread.lastMessage.body}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-xs text-slate-400">
                            {formatDateTime(thread.lastMessage?.createdAt)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Outstanding rent
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Rent records from active lease schedules.
                    </p>
                  </div>

                  <Link
                    href="/landlord/payments"
                    className="text-sm font-semibold text-[#16A34A]"
                  >
                    Payment records
                  </Link>
                </div>

                {payments.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">
                    No outstanding rent records.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {payments.map((payment: any) => (
                      <div
                        key={payment.id}
                        className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-center"
                      >
                        <div>
                          <div className="font-semibold text-slate-950">
                            {personName(payment.lease?.tenant)}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {payment.lease?.property?.title || 'Property'}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            Due {formatDate(payment.dueDate)}
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <div className="font-bold text-[#0F2B46]">
                            {money(
                              Number(payment.amount || 0) +
                                Math.max(0, Number(payment.lateFee || 0))
                            )}
                          </div>
                          <span className={`mt-1 inline-flex px-2.5 py-1 text-xs font-semibold ${statusTone(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-2">
              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Open maintenance
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Repair requests connected to your properties.
                    </p>
                  </div>

                  <Link
                    href="/landlord/maintenance"
                    className="text-sm font-semibold text-[#16A34A]"
                  >
                    Manage maintenance
                  </Link>
                </div>

                {maintenance.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">
                    No open maintenance requests.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {maintenance.map((request: any) => (
                      <div
                        key={request.id}
                        className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_140px] sm:items-center"
                      >
                        <div>
                          <div className="font-semibold text-slate-950">
                            {request.title}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {request.property?.title || 'Property'}
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {request.category} · {request.priority}
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${statusTone(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Active leases
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Current signed lease agreements.
                    </p>
                  </div>

                  <Link
                    href="/landlord/leases"
                    className="text-sm font-semibold text-[#16A34A]"
                  >
                    Manage leases
                  </Link>
                </div>

                {leases.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">
                    No active leases yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {leases.map((lease: any) => (
                      <div key={lease.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-slate-950">
                              {lease.property?.title || 'Property'}
                            </div>
                            <div className="mt-1 text-sm text-slate-500">
                              Tenant: {personName(lease.tenant)}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              {formatDate(lease.startDate)} →{' '}
                              {formatDate(lease.endDate)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-[#0F2B46]">
                              {money(lease.monthlyRent)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              per month
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="mt-8 border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">
                Property management
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Open the full management areas for the real records behind this dashboard.
              </p>

              <div className="mt-5 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Properties', '/dashboard/properties'],
                  ['Messages', '/inquiries'],
                  ['Leases', '/landlord/leases'],
                  ['Rent payments', '/landlord/payments'],
                  ['Maintenance', '/landlord/maintenance'],
                  ['Tenant screening', '/landlord/screening'],
                  ['Expenses', '/landlord/expenses'],
                  ['Service providers', '/services'],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between border-b border-r border-slate-200 p-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#16A34A]"
                  >
                    {label}
                    <span>→</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
