import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Header from '../../components/Header';
import prisma from '../../lib/prisma';
import { requireAuth } from '../../lib/auth';

export const dynamic = 'force-dynamic';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-r border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-950">{value}</div>
    </div>
  );
}

function Actions({ items }: { items: [string, string][] }) {
  return (
    <div className="border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-950">Quick access</h2>
      <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
        {items.map(([label, href]) => (
          <Link key={href} href={href} className="flex items-center justify-between py-3 text-sm font-medium text-slate-700 hover:text-blue-700">
            {label}<span>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('denuel_token')?.value;
  let user: any = null;

  if (token) {
    try {
      user = await requireAuth(
        new Request('http://localhost', { headers: { cookie: `denuel_token=${token}` } })
      );
    } catch {
      user = null;
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">Sign in to your dashboard</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">Your dashboard contains saved properties, listings, applications and account tools.</p>
          <Link href="/auth/login?redirect=/dashboard" className="mt-6 inline-flex bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Sign in</Link>
        </main>
      </div>
    );
  }

  if (user.role === 'ADMIN') {
    const [properties, users, applications, bookings, pendingProperties, openReports, revenue, recentUsers] = await Promise.all([
      prisma.property.count(),
      prisma.user.count(),
      prisma.application.count(),
      prisma.booking.count(),
      prisma.property.count({ where: { status: 'PENDING' } }),
      prisma.listingReport.count({ where: { status: 'OPEN' } }),
      prisma.booking.aggregate({ where: { status: 'CONFIRMED' }, _sum: { amountZmw: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">Administration</h1>
              <p className="mt-2 text-sm text-slate-500">Live platform activity and moderation tools.</p>
            </div>
            <Link href="/admin/settings" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">System settings</Link>
          </div>

          <section className="mt-8 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Users" value={users} />
            <Stat label="Properties" value={properties} />
            <Stat label="Applications" value={applications} />
            <Stat label="Confirmed booking value" value={'K' + Number(revenue._sum.amountZmw || 0).toLocaleString()} />
            <Stat label="Bookings" value={bookings} />
            <Stat label="Pending properties" value={pendingProperties} />
            <Stat label="Open listing reports" value={openReports} />
            <Stat label="Environment" value="Production" />
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-950">Recent registrations</h2>
                <Link href="/admin/users" className="text-sm font-semibold text-blue-700">All users</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {recentUsers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{item.name || 'Unnamed user'}</div>
                      <div className="mt-1 truncate text-sm text-slate-500">{item.email} · {item.role}</div>
                    </div>
                    <Link href={'/admin/users/' + item.id} className="text-sm font-semibold text-blue-700">View</Link>
                  </div>
                ))}
              </div>
            </div>

            <Actions items={[
              ['Pending property approvals', '/admin/properties/pending'],
              ['Verification reviews', '/admin/verifications'],
              ['Reports & moderation', '/admin/reports'],
              ['Service providers', '/admin/service-providers'],
              ['Subscriptions', '/admin/subscriptions'],
              ['Revenue', '/admin/revenue'],
              ['Analytics', '/admin/analytics'],
              ['Support', '/admin/support'],
            ]} />
          </section>
        </main>
      </div>
    );
  }

  if (user.role === 'LANDLORD') {
    redirect('/landlord');
  }

  if (user.role === 'AGENT') {
    redirect('/agent');
  }

  const [applicationCount, recentApplications, favorites, notifications, savedSearches] = await Promise.all([
    prisma.application.count({ where: { userId: user.id } }),
    prisma.application.findMany({
      where: { userId: user.id },
      include: { property: { select: { id: true, title: true, city: true, area: true } } },
      orderBy: { appliedAt: 'desc' },
      take: 5,
    }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.savedSearch.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">My property account</h1>
          <p className="mt-2 text-sm text-slate-500">Welcome back{user.name ? ', ' + user.name : ''}. Keep track of your property activity.</p>
        </div>

        <section className="mt-8 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Applications" value={applicationCount} />
          <Stat label="Saved properties" value={favorites} />
          <Stat label="Saved searches" value={savedSearches} />
          <Stat label="Unread notifications" value={notifications} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-950">Recent applications</h2>
              <Link href="/renter-hub" className="text-sm font-semibold text-blue-700">Renter hub</Link>
            </div>
            {recentApplications.length ? (
              <div className="divide-y divide-slate-100">
                {recentApplications.map((application) => (
                  <Link key={application.id} href={'/property/' + application.property.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{application.property.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{[application.property.area, application.property.city].filter(Boolean).join(', ')}</div>
                    </div>
                    <div className="text-xs font-semibold text-slate-600">{application.status}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10">
                <p className="text-sm text-slate-500">You have not submitted any property applications yet.</p>
                <Link href="/rent" className="mt-4 inline-flex text-sm font-semibold text-blue-700">Browse rentals →</Link>
              </div>
            )}
          </div>

          <Actions items={[
            ['Find properties', '/rent'],
            ['Saved properties', '/favorites'],
            ['Saved searches', '/saved-search'],
            ['Notifications', '/notifications'],
            ['Renter hub', '/renter-hub'],
            ['My leases', '/my-leases'],
            ['Rent payments', '/rent-payment'],
          ]} />
        </section>
      </main>
    </div>
  );
}
