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

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function LandlordDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const responses = await Promise.all([
        fetch('/api/landlord/maintenance?role=landlord', { credentials: 'same-origin' }),
        fetch('/api/landlord/rent-payments?role=landlord', { credentials: 'same-origin' }),
        fetch('/api/properties/mine', { credentials: 'same-origin' }),
        fetch('/api/landlord/leases', { credentials: 'same-origin' }),
        fetch('/api/landlord/screening?role=landlord', { credentials: 'same-origin' }),
      ]);

      if (responses.some((response) => response.status === 401)) {
        window.location.href = '/auth/login?redirect=/landlord&reason=session';
        return;
      }

      const payloads = await Promise.all(
        responses.map(async (response) => {
          const text = await response.text();
          let data: any = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch {
            data = {};
          }
          return { ok: response.ok, status: response.status, text, data };
        }),
      );

      const failed = payloads.find((item) => !item.ok);
      if (failed) {
        throw new Error(failed.data?.error || failed.text || 'Unable to load landlord data.');
      }

      const [maintenancePayload, paymentsPayload, propertiesPayload, leasesPayload, screeningsPayload] = payloads;
      const requests = Array.isArray(maintenancePayload.data?.requests) ? maintenancePayload.data.requests : [];
      const paymentRows = Array.isArray(paymentsPayload.data?.payments) ? paymentsPayload.data.payments : [];
      const properties = Array.isArray(propertiesPayload.data?.items) ? propertiesPayload.data.items : [];
      const leases = Array.isArray(leasesPayload.data) ? leasesPayload.data : [];
      const screenings = Array.isArray(screeningsPayload.data) ? screeningsPayload.data : [];

      setMaintenance(
        requests.filter((request: any) => ['OPEN', 'IN_PROGRESS', 'SCHEDULED'].includes(request.status)).slice(0, 6),
      );
      setPayments(paymentRows.filter((payment: any) => payment.status === 'PENDING').slice(0, 6));
      setStats({
        totalProperties: properties.length,
        activeLeases: leases.filter((lease: any) => lease.status === 'ACTIVE').length,
        pendingRentAmount: Number(paymentsPayload.data?.stats?.totalDue || 0),
        maintenanceRequests: requests.filter((request: any) => ['OPEN', 'IN_PROGRESS', 'SCHEDULED'].includes(request.status)).length,
        rentCollected: Number(paymentsPayload.data?.stats?.totalPaid || 0),
        screeningRequests: screenings.filter((screening: any) => screening.status === 'PENDING').length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load landlord dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const money = (amount: number) => 'K' + Number(amount || 0).toLocaleString();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">Property management</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Landlord dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track your properties, leases, rent, maintenance and tenant workflows from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/properties" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
              My properties
            </Link>
            <Link href="/dashboard/properties/new" className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              Add property
            </Link>
          </div>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Landlord data could not be loaded</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">{error}</p>
            <button type="button" onClick={loadDashboard} className="mt-4 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800">
              Try again
            </button>
          </section>
        )}

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse border border-slate-200 bg-white" />
            ))}
          </div>
        ) : !error ? (
          <>
            <section className="mt-8 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Properties', stats?.totalProperties || 0, '/dashboard/properties'],
                ['Active leases', stats?.activeLeases || 0, '/landlord/leases'],
                ['Pending rent', money(stats?.pendingRentAmount || 0), '/landlord/payments'],
                ['Rent collected', money(stats?.rentCollected || 0), '/landlord/payments'],
                ['Maintenance open', stats?.maintenanceRequests || 0, '/landlord/maintenance'],
                ['Screenings pending', stats?.screeningRequests || 0, '/landlord/screening'],
              ].map(([label, value, href]) => (
                <Link key={String(label)} href={String(href)} className="border-b border-r border-slate-200 bg-white p-5 transition hover:bg-slate-50">
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="mt-2 text-2xl font-bold tracking-[-0.02em]">{value}</div>
                  <div className="mt-3 text-xs font-semibold text-blue-700">Open →</div>
                </Link>
              ))}
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <section className="border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <h2 className="font-semibold">Maintenance requiring attention</h2>
                      <p className="mt-1 text-xs text-slate-500">Open, scheduled and in-progress requests.</p>
                    </div>
                    <Link href="/landlord/maintenance" className="text-sm font-semibold text-blue-700">View all</Link>
                  </div>

                  {maintenance.length ? (
                    <div className="divide-y divide-slate-100">
                      {maintenance.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{item.title}</div>
                            <div className="mt-1 truncate text-sm text-slate-500">{item.property?.title || 'Property'}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-xs font-semibold text-slate-700">{humanize(item.priority)}</div>
                            <div className="mt-1 text-xs text-slate-400">{humanize(item.status)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-8">
                      <p className="text-sm text-slate-500">No open maintenance requests.</p>
                    </div>
                  )}
                </section>

                <section className="border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <h2 className="font-semibold">Upcoming rent payments</h2>
                      <p className="mt-1 text-xs text-slate-500">Pending rent from recorded lease schedules.</p>
                    </div>
                    <Link href="/landlord/payments" className="text-sm font-semibold text-blue-700">View all</Link>
                  </div>

                  {payments.length ? (
                    <div className="divide-y divide-slate-100">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex items-start justify-between gap-4 px-5 py-4">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{payment.lease?.tenant?.name || 'Tenant'}</div>
                            <div className="mt-1 truncate text-sm text-slate-500">{payment.lease?.property?.title || 'Property'}</div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-sm font-semibold">{money(payment.amount)}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('en-ZM') : 'No due date'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-8">
                      <p className="text-sm text-slate-500">No pending rent payments.</p>
                    </div>
                  )}
                </section>
              </div>

              <aside className="h-fit border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
                <h2 className="font-semibold">Property management</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Open a focused workspace for each landlord task.</p>

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

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <Link href="/services" className="text-sm font-semibold text-blue-700">
                    Find property service providers →
                  </Link>
                </div>
              </aside>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
