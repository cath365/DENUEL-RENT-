import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Header from '@/components/Header';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function Metric({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="border-b border-r border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-[-0.025em] text-slate-950">{value}</div>
      {note && <div className="mt-1 text-xs text-slate-400">{note}</div>}
    </div>
  );
}

export default async function AdminPage() {
  const store = await cookies();
  const token = store.get('denuel_token')?.value;

  if (!token) redirect('/auth/login?redirect=/admin');

  let user: any = null;
  try {
    user = await requireAuth(
      new Request('http://localhost', { headers: { cookie: `denuel_token=${token}` } })
    );
  } catch {
    redirect('/auth/login?redirect=/admin');
  }

  if (!user || user.role !== 'ADMIN') redirect('/dashboard');

  const [
    totalUsers,
    totalProperties,
    pendingProperties,
    totalProviders,
    pendingProviders,
    verifiedProviders,
    openReports,
    supportOpen,
    bookings,
    recentProviders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.property.count({ where: { status: 'PENDING' } }),
    prisma.serviceProvider.count(),
    prisma.serviceProvider.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.serviceProvider.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.listingReport.count({ where: { status: 'OPEN' } }),
    prisma.supportMessage.count({ where: { isResolved: false } }),
    prisma.booking.count(),
    prisma.serviceProvider.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        businessName: true,
        providerType: true,
        category: true,
        city: true,
        verificationStatus: true,
        createdAt: true,
        _count: { select: { documents: true } },
      },
    }),
  ]);

  const reviewQueue = pendingProperties + pendingProviders + openReports;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm font-semibold text-blue-700">DENUEL administration</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">Operations dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review trust and safety work, property approvals, users, providers and platform operations from one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/settings" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Settings</Link>
            <Link href="/" className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">View marketplace</Link>
          </div>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Review queue" value={reviewQueue} note="Providers + properties + reports" />
          <Metric label="Users" value={totalUsers.toLocaleString()} />
          <Metric label="Properties" value={totalProperties.toLocaleString()} note={pendingProperties + ' pending approval'} />
          <Metric label="Service providers" value={totalProviders.toLocaleString()} note={verifiedProviders + ' verified'} />
          <Metric label="Provider verification" value={pendingProviders} note="Waiting for review" />
          <Metric label="Open listing reports" value={openReports} />
          <Metric label="Open support work" value={supportOpen} />
          <Metric label="Bookings" value={bookings.toLocaleString()} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-slate-950">Trust & safety queue</h2>
                  <p className="mt-1 text-xs text-slate-500">Highest-priority work requiring admin decisions.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3">
                <Link href="/admin/service-providers" className="border-b border-slate-200 p-5 transition hover:bg-slate-50 sm:border-b-0 sm:border-r">
                  <div className="text-3xl font-bold text-slate-950">{pendingProviders}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">Provider verifications</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">Review companies, individuals and supporting documents.</div>
                  <div className="mt-4 text-sm font-semibold text-blue-700">Open queue →</div>
                </Link>

                <Link href="/admin/properties/pending" className="border-b border-slate-200 p-5 transition hover:bg-slate-50 sm:border-b-0 sm:border-r">
                  <div className="text-3xl font-bold text-slate-950">{pendingProperties}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">Property approvals</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">Review listings before they become publicly approved.</div>
                  <div className="mt-4 text-sm font-semibold text-blue-700">Review listings →</div>
                </Link>

                <Link href="/admin/reports" className="p-5 transition hover:bg-slate-50">
                  <div className="text-3xl font-bold text-slate-950">{openReports}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">Listing reports</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">Investigate reports and marketplace safety concerns.</div>
                  <div className="mt-4 text-sm font-semibold text-blue-700">Open reports →</div>
                </Link>
              </div>
            </div>

            <div className="border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-slate-950">Recent service-provider registrations</h2>
                  <p className="mt-1 text-xs text-slate-500">Latest companies and individual professionals.</p>
                </div>
                <Link href="/admin/service-providers" className="text-sm font-semibold text-blue-700">View all</Link>
              </div>

              {recentProviders.length ? (
                <div className="divide-y divide-slate-100">
                  {recentProviders.map((provider) => (
                    <Link key={provider.id} href="/admin/service-providers" className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[1fr_130px_130px] sm:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{provider.businessName}</span>
                          <span className="border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{provider.providerType === 'COMPANY' ? 'Company' : 'Individual'}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{provider.category.replaceAll('_', ' ')} · {provider.city}</div>
                      </div>
                      <div className="text-sm text-slate-500">{provider._count.documents} documents</div>
                      <div>
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold ${
                          provider.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : provider.verificationStatus === 'REJECTED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {provider.verificationStatus}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-10 text-sm text-slate-500">No service providers registered yet.</div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">Admin workspace</h2>
              <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                {[
                  ['Service providers', '/admin/service-providers'],
                  ['User verification', '/admin/verifications'],
                  ['Property approvals', '/admin/properties/pending'],
                  ['Users', '/admin/users'],
                  ['Reports & moderation', '/admin/reports'],
                  ['Payments', '/admin/payments'],
                  ['Revenue', '/admin/revenue'],
                  ['Subscriptions', '/admin/subscriptions'],
                  ['Analytics', '/admin/analytics'],
                  ['Support', '/admin/support'],
                  ['System', '/admin/system'],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="flex items-center justify-between py-3 text-sm font-medium text-slate-700 hover:text-blue-700">
                    {label}<span>→</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="border border-blue-200 bg-blue-50 p-5">
              <h2 className="font-semibold text-slate-950">Verification rule</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">A service provider can only receive the DENUEL verified badge after every required document for its provider type and category has been verified.</p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
