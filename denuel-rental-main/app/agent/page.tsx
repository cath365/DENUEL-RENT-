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

function tone(status?: string) {
  if (['APPROVED', 'ACTIVE', 'CONFIRMED', 'COMPLETED'].includes(status || '')) {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (['REJECTED', 'CANCELED', 'TERMINATED'].includes(status || '')) {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-amber-50 text-amber-700';
}

export default function AgentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/agent/dashboard');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/agent';
        return;
      }

      if (response.status === 403) {
        throw new Error('This workspace is available to agent accounts.');
      }

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json.error || 'Unable to load the agent workspace.');
      }

      setData(json);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load the agent workspace.'
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
  const topProperties = Array.isArray(data?.mostViewedProperties)
    ? data.mostViewedProperties
    : [];
  const applications = Array.isArray(data?.recentApplications)
    ? data.recentApplications
    : [];
  const viewings = Array.isArray(data?.upcomingViewings)
    ? data.upcomingViewings
    : [];
  const threads = Array.isArray(data?.recentThreads)
    ? data.recentThreads
    : [];
  const clients = Array.isArray(data?.clients) ? data.clients : [];
  const reviews = Array.isArray(data?.recentReviews) ? data.recentReviews : [];

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">Agent operations</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Agent dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Listings, clients, applications, viewings, conversations and real property performance in one workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/agent/profile"
              className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Agent profile
            </Link>
            <Link
              href="/dashboard/properties/new"
              className="bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white"
            >
              List property
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <div className="font-semibold text-red-800">Agent workspace unavailable</div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
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
            <div className="mt-7 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse bg-white" />
              ))}
            </div>
            <div className="mt-6 h-96 animate-pulse border border-slate-200 bg-white" />
          </>
        ) : data ? (
          <>
            {!data.profile && (
              <section className="mt-6 border border-amber-200 bg-amber-50 p-5">
                <div className="font-semibold text-amber-900">Complete your public agent profile</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Your agent account is active, but no professional profile is published yet. Add your bio, specialties, service areas and profile photo.
                </p>
                <Link
                  href="/agent/profile"
                  className="mt-4 inline-flex bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Set up profile
                </Link>
              </section>
            )}

            <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Managed properties', stats.totalProperties || 0],
                ['Unique viewers', stats.uniqueViewers || 0],
                ['Property saves', stats.totalSaves || 0],
                ['Real clients', stats.clients || 0],
                ['Pending applications', stats.pendingApplications || 0],
                ['Upcoming viewings', stats.upcomingViewings || 0],
                ['Unread messages', stats.unreadMessages || 0],
                ['Active leases', stats.activeLeases || 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="border-b border-r border-slate-200 bg-white p-5">
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">
                    {Number(value).toLocaleString()}
                  </div>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="border border-slate-200 bg-white p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="text-sm font-semibold text-[#16A34A]">Professional profile</div>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">
                      {data.agent?.companyName || data.agent?.name || 'Agent'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Profile completion: {data.profileCompletion || 0}%
                    </p>
                  </div>

                  {data.profile && (
                    <Link
                      href={'/agents/' + data.profile.id}
                      className="text-sm font-semibold text-[#16A34A]"
                    >
                      View public profile
                    </Link>
                  )}
                </div>

                <div className="mt-5 h-2 bg-slate-100">
                  <div
                    className="h-2 bg-[#16A34A]"
                    style={{ width: Math.min(100, Math.max(0, data.profileCompletion || 0)) + '%' }}
                  />
                </div>

                <div className="mt-6 grid border-l border-t border-slate-200 sm:grid-cols-3">
                  <div className="border-b border-r border-slate-200 p-4">
                    <div className="text-xs text-slate-500">Rating</div>
                    <div className="mt-1 text-xl font-bold text-slate-950">
                      {stats.reviews ? Number(stats.rating || 0).toFixed(1) + '/5' : 'No reviews'}
                    </div>
                  </div>
                  <div className="border-b border-r border-slate-200 p-4">
                    <div className="text-xs text-slate-500">Reviews</div>
                    <div className="mt-1 text-xl font-bold text-slate-950">{stats.reviews || 0}</div>
                  </div>
                  <div className="border-b border-r border-slate-200 p-4">
                    <div className="text-xs text-slate-500">Trust score</div>
                    <div className="mt-1 text-xl font-bold text-slate-950">
                      {Math.round(Number(data.agent?.trustScore || 0))}/100
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-950">Verification</h2>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ['Email', data.agent?.isEmailVerified],
                    ['Phone', data.agent?.isPhoneVerified],
                    ['Identity', data.agent?.isIdVerified],
                    ['Business', data.agent?.isBusinessVerified],
                  ].map(([label, verified]) => (
                    <div key={String(label)} className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-slate-600">{label}</span>
                      <span className={verified ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-400'}>
                        {verified ? 'Verified' : 'Not verified'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  {data.verification?.pendingDocuments || 0} document(s) pending review · {data.verification?.approvedDocuments || 0} approved.
                </p>
                <Link
                  href="/profile/verification"
                  className="mt-4 inline-flex text-sm font-semibold text-[#16A34A]"
                >
                  Manage verification →
                </Link>
              </div>
            </section>

            <section className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[#16A34A]">Property performance</div>
                  <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">
                    Most viewed properties
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Unique viewers from real visits to your approved listings.
                  </p>
                </div>
                <Link href="/dashboard/properties" className="text-sm font-semibold text-[#16A34A]">
                  Manage listings
                </Link>
              </div>

              {topProperties.length === 0 ? (
                <div className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
                  No approved property viewer data yet.
                </div>
              ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {topProperties.map((property: any, index: number) => (
                    <article key={property.id} className="overflow-hidden border border-slate-200 bg-white">
                      <Link href={'/property/' + property.id}>
                        <div className="relative aspect-[16/9] bg-slate-100">
                          {property.images?.[0]?.url ? (
                            <img src={property.images[0].url} alt={property.title} className="h-full w-full object-cover" />
                          ) : null}
                          <span className="absolute left-3 top-3 bg-white px-2 py-1 text-xs font-bold text-slate-900">
                            #{index + 1}
                          </span>
                        </div>
                      </Link>
                      <div className="p-4">
                        <Link href={'/property/' + property.id} className="font-semibold text-slate-950 hover:text-[#16A34A]">
                          {property.title}
                        </Link>
                        <div className="mt-1 text-sm text-slate-500">
                          {[property.area, property.city].filter(Boolean).join(', ')}
                        </div>
                        <div className="mt-4 grid grid-cols-2 border-l border-t border-slate-200">
                          <div className="border-b border-r border-slate-200 p-3">
                            <div className="text-xs text-slate-500">Viewers</div>
                            <div className="mt-1 text-lg font-bold">{property.viewerCount || 0}</div>
                          </div>
                          <div className="border-b border-r border-slate-200 p-3">
                            <div className="text-xs text-slate-500">Saves</div>
                            <div className="mt-1 text-lg font-bold">{property.saveCount || 0}</div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10 grid gap-6 xl:grid-cols-2">
              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">Applications</h2>
                    <p className="mt-1 text-xs text-slate-500">Recent rental applications to your listings.</p>
                  </div>
                  <Link href="/agent/applications" className="text-sm font-semibold text-[#16A34A]">Manage</Link>
                </div>
                {applications.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">No applications received yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {applications.map((application: any) => (
                      <div key={application.id} className="flex items-start justify-between gap-4 px-5 py-4">
                        <div>
                          <div className="font-semibold text-slate-950">
                            {application.user?.name || application.user?.email || 'Applicant'}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">{application.property?.title}</div>
                          <div className="mt-2 text-xs text-slate-400">{formatDate(application.appliedAt)}</div>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-semibold ${tone(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">Upcoming viewings</h2>
                    <p className="mt-1 text-xs text-slate-500">Real property viewing requests.</p>
                  </div>
                  <Link href="/agent/viewings" className="text-sm font-semibold text-[#16A34A]">Manage</Link>
                </div>
                {viewings.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">No upcoming viewing requests.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {viewings.map((viewing: any) => (
                      <div key={viewing.id} className="flex items-start justify-between gap-4 px-5 py-4">
                        <div>
                          <div className="font-semibold text-slate-950">
                            {viewing.visitor?.name || viewing.visitor?.email || 'Visitor'}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">{viewing.property?.title}</div>
                          <div className="mt-2 text-xs text-slate-400">{formatDateTime(viewing.scheduledAt)}</div>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-semibold ${tone(viewing.status)}`}>
                          {viewing.status}
                        </span>
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
                    <h2 className="font-bold text-slate-950">Client conversations</h2>
                    <p className="mt-1 text-xs text-slate-500">Recent messages tied to your properties.</p>
                  </div>
                  <Link href="/inquiries" className="text-sm font-semibold text-[#16A34A]">Messages</Link>
                </div>
                {threads.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">No client conversations yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {threads.map((thread: any) => (
                      <Link key={thread.id} href={'/inquiries/' + thread.id} className="block px-5 py-4 hover:bg-slate-50">
                        <div className="font-semibold text-slate-950">
                          {thread.client?.name || thread.client?.email || 'Client'}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">{thread.property?.title}</div>
                        {thread.lastMessage?.body && (
                          <p className="mt-2 line-clamp-1 text-sm text-slate-600">{thread.lastMessage.body}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-bold text-slate-950">Recent clients</h2>
                    <p className="mt-1 text-xs text-slate-500">People with real activity on your listings.</p>
                  </div>
                  <Link href="/agent/clients" className="text-sm font-semibold text-[#16A34A]">All clients</Link>
                </div>
                {clients.length === 0 ? (
                  <div className="p-8 text-sm text-slate-500">No client activity yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {clients.slice(0, 5).map((client: any) => (
                      <div key={client.id} className="px-5 py-4">
                        <div className="font-semibold text-slate-950">{client.name || client.email || 'Client'}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {client.applications} applications · {client.viewings} viewings · {client.conversations} conversations · {client.leases} leases
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="mt-8 border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">Agent workspace</h2>
              <div className="mt-5 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Properties', '/dashboard/properties'],
                  ['Applications', '/agent/applications'],
                  ['Viewings', '/agent/viewings'],
                  ['Clients', '/agent/clients'],
                  ['Messages', '/inquiries'],
                  ['Leases', '/landlord/leases'],
                  ['Rent payments', '/landlord/payments'],
                  ['Profile & verification', '/agent/profile'],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between border-b border-r border-slate-200 p-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#16A34A]"
                  >
                    {label}<span>→</span>
                  </Link>
                ))}
              </div>
            </section>

            {reviews.length > 0 && (
              <section className="mt-6 border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h2 className="font-bold text-slate-950">Recent agent reviews</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-semibold text-slate-950">{review.reviewer?.name || 'Reviewer'}</div>
                        <div className="text-sm font-semibold text-slate-700">{review.rating}/5</div>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{review.review}</p>
                      <div className="mt-2 text-xs text-slate-400">
                        {review.isVerified ? 'Verified interaction · ' : ''}{formatDate(review.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {stats.recordedTransactions > 0 && (
              <section className="mt-6 border border-slate-200 bg-white p-5">
                <div className="text-sm font-semibold text-[#16A34A]">Recorded transactions only</div>
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-slate-500">Transaction records</div>
                    <div className="mt-1 text-2xl font-bold">{stats.recordedTransactions}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Recorded value</div>
                    <div className="mt-1 text-2xl font-bold">{money(stats.recordedTransactionValue)}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  These figures are shown only when actual AgentTransaction records exist. Ng&apos;anda does not infer sales or commission from listings.
                </p>
              </section>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
