'use client';

import { useEffect, useMemo, useState } from 'react';
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

function tone(status?: string) {
  if (status === 'PAID') return 'bg-emerald-50 text-emerald-700';
  if (status === 'LATE') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

export default function PaymentsPage() {
  const [data, setData] = useState<any>({ payments: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/landlord/rent-payments?role=landlord');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/payments';
        return;
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || 'Unable to load rent payment records.');
      }

      setData({
        payments: Array.isArray(json.payments) ? json.payments : [],
        stats: json.stats || {},
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load rent payment records.'
      );
      setData({ payments: [], stats: {} });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const payments = data.payments || [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return payments.filter((payment: any) => {
      if (statusFilter !== 'ALL' && payment.status !== statusFilter) return false;
      if (!needle) return true;

      return [
        payment.lease?.property?.title,
        payment.lease?.tenant?.name,
        payment.lease?.tenant?.email,
        payment.transactionId,
        payment.paymentMethod,
      ].filter(Boolean).some((value) =>
        String(value).toLowerCase().includes(needle)
      );
    });
  }, [payments, query, statusFilter]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link href="/landlord" className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]">
              ← Landlord dashboard
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">Rent ledger</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Rent payments
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Real payment records generated from signed lease schedules.
            </p>
          </div>

          <Link
            href="/landlord/leases"
            className="w-fit border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Lease management
          </Link>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Outstanding', money(data.stats?.totalDue || 0)],
            ['Collected', money(data.stats?.totalPaid || 0)],
            ['Overdue records', Number(data.stats?.overdue || 0).toLocaleString()],
            ['Due within 7 days', Number(data.stats?.upcoming || 0).toLocaleString()],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 bg-white p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">{loading ? '—' : value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tenant, property or transaction reference"
            className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#16A34A]"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="LATE">Late</option>
            <option value="PARTIAL">Partial</option>
            <option value="WAIVED">Waived</option>
          </select>
        </section>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <div className="font-semibold text-red-800">Payment records unavailable</div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button onClick={load} className="mt-4 bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white">
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-80 animate-pulse border border-slate-200 bg-white" />
        ) : payments.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">No rent payment records yet</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Payment records appear after a signed lease becomes active and generates its rent schedule.
            </p>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No rent record matches the current filters.
          </section>
        ) : (
          <section className="mt-6 overflow-x-auto border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Property / tenant</th>
                  <th className="px-5 py-3 font-semibold">Due</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Paid / method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((payment: any) => {
                  const lateFee = Math.max(0, Number(payment.lateFee || 0));
                  return (
                    <tr key={payment.id}>
                      <td className="px-5 py-4">
                        <Link href={'/property/' + payment.lease?.property?.id} className="font-semibold text-slate-950 hover:text-[#16A34A]">
                          {payment.lease?.property?.title || 'Property'}
                        </Link>
                        <div className="mt-1 text-xs text-slate-500">
                          {payment.lease?.tenant?.name || payment.lease?.tenant?.email || 'Tenant'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(payment.dueDate)}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-950">{money(payment.amount)}</div>
                        {lateFee > 0 && <div className="mt-1 text-xs text-red-600">Recorded late fee {money(lateFee)}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold ${tone(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{payment.paidDate ? formatDate(payment.paidDate) : 'Not recorded'}</div>
                        {(payment.paymentMethod || payment.transactionId) && (
                          <div className="mt-1 max-w-[260px] truncate text-xs text-slate-400">
                            {[payment.paymentMethod, payment.transactionId].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
