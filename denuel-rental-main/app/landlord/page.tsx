'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

interface Stats {
  totalProperties: number;
  activeLeases: number;
  pendingRentAmount: number;
  maintenanceRequests: number;
  rentCollected: number;
  screeningRequests: number;
}

export default function LandlordDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/landlord/maintenance'),
      fetch('/api/landlord/rent-payments?role=landlord'),
      fetch('/api/properties/mine'),
      fetch('/api/landlord/leases'),
      fetch('/api/landlord/screening?role=landlord'),
    ])
      .then(async ([maintenanceRes, paymentsRes, propertiesRes, leasesRes, screeningsRes]) => {
        const maintenanceData = maintenanceRes.ok ? await maintenanceRes.json() : { requests: [] };
        const paymentsData = paymentsRes.ok ? await paymentsRes.json() : { payments: [], stats: {} };
        const propertiesData = propertiesRes.ok ? await propertiesRes.json() : { items: [] };
        const leasesData = leasesRes.ok ? await leasesRes.json() : [];
        const screeningsData = screeningsRes.ok ? await screeningsRes.json() : [];

        const requests = Array.isArray(maintenanceData.requests) ? maintenanceData.requests : [];
        const paymentRows = Array.isArray(paymentsData.payments) ? paymentsData.payments : [];
        const properties = Array.isArray(propertiesData.items) ? propertiesData.items : [];
        const leases = Array.isArray(leasesData) ? leasesData : [];
        const screenings = Array.isArray(screeningsData) ? screeningsData : [];

        setMaintenance(requests.filter((r: any) => ['OPEN', 'IN_PROGRESS'].includes(r.status)).slice(0, 6));
        setPayments(paymentRows.filter((p: any) => p.status === 'PENDING').slice(0, 6));
        setStats({
          totalProperties: properties.length,
          activeLeases: leases.filter((l: any) => l.status === 'ACTIVE').length,
          pendingRentAmount: Number(paymentsData.stats?.totalDue || 0),
          maintenanceRequests: requests.filter((r: any) => ['OPEN', 'IN_PROGRESS'].includes(r.status)).length,
          rentCollected: Number(paymentsData.stats?.totalPaid || 0),
          screeningRequests: screenings.filter((x: any) => x.status === 'PENDING').length,
        });
      })
      .catch((error) => console.error('Landlord dashboard failed', error))
      .finally(() => setLoading(false));
  }, []);

  const money = (amount: number) => 'K' + Number(amount || 0).toLocaleString();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">Landlord dashboard</h1>
            <p className="mt-2 text-sm text-slate-500">Properties, rent, leases and maintenance in one place.</p>
          </div>
          <Link href="/dashboard/properties/new" className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
            Add property
          </Link>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse border border-slate-200 bg-white" />)}
          </div>
        ) : (
          <>
            <section className="mt-8 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Properties', stats?.totalProperties || 0],
                ['Active leases', stats?.activeLeases || 0],
                ['Pending rent', money(stats?.pendingRentAmount || 0)],
                ['Rent collected', money(stats?.rentCollected || 0)],
                ['Maintenance open', stats?.maintenanceRequests || 0],
                ['Screenings pending', stats?.screeningRequests || 0],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-r border-slate-200 bg-white p-5">
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-950">{value}</div>
                </div>
              ))}
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <div className="border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="font-semibold text-slate-950">Maintenance requests</h2>
                    <Link href="/landlord/maintenance" className="text-sm font-semibold text-blue-700">View all</Link>
                  </div>
                  {maintenance.length ? (
                    <div className="divide-y divide-slate-100">
                      {maintenance.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                            <div className="mt-1 text-sm text-slate-500">{item.property?.title || 'Property'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold text-slate-600">{item.priority}</div>
                            <div className="mt-1 text-xs text-slate-400">{item.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-5 py-8 text-sm text-slate-500">No open maintenance requests.</p>
                  )}
                </div>

                <div className="border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2 className="font-semibold text-slate-950">Upcoming rent payments</h2>
                    <Link href="/landlord/payments" className="text-sm font-semibold text-blue-700">View all</Link>
                  </div>
                  {payments.length ? (
                    <div className="divide-y divide-slate-100">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-start justify-between gap-4 px-5 py-4">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{payment.lease?.tenant?.name || 'Tenant'}</div>
                            <div className="mt-1 text-sm text-slate-500">{payment.lease?.property?.title || 'Property'}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-950">{money(payment.amount)}</div>
                            <div className="mt-1 text-xs text-slate-400">{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('en-ZM') : ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-5 py-8 text-sm text-slate-500">No pending rent payments.</p>
                  )}
                </div>
              </div>

              <aside className="border border-slate-200 bg-white p-5">
                <h2 className="font-semibold text-slate-950">Property management</h2>
                <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
                  {[
                    ['My properties', '/dashboard/properties'],
                    ['Leases', '/landlord/leases'],
                    ['Rent payments', '/landlord/payments'],
                    ['Maintenance', '/landlord/maintenance'],
                    ['Tenant screening', '/landlord/screening'],
                    ['Expenses', '/landlord/expenses'],
                  ].map(([label, href]) => (
                    <Link key={href} href={href} className="flex items-center justify-between py-3 text-sm font-medium text-slate-700 hover:text-blue-700">
                      {label}<span>→</span>
                    </Link>
                  ))}
                </div>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
