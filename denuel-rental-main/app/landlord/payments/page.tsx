'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';

type Filter = 'ALL' | 'PENDING' | 'PAID' | 'PARTIAL' | 'LATE' | 'WAIVED';

function money(value: number) {
  return 'K' + Number(value || 0).toLocaleString();
}

function statusClass(status: string, overdue: boolean) {
  if (status === 'PAID') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'PARTIAL') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'WAIVED') return 'border-slate-200 bg-slate-50 text-slate-600';
  if (status === 'LATE' || overdue) return 'border-red-200 bg-red-50 text-red-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

export default function PaymentsPage() {
  const [data, setData] = useState<any>({ payments: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  async function loadPayments() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/landlord/rent-payments?role=landlord', {
        credentials: 'same-origin',
      });
      const text = await res.text();
      let payload: any = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = {};
      }

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/landlord/payments&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(payload?.error || text || 'Unable to load rent payments.');
      }

      setData({
        payments: Array.isArray(payload.payments) ? payload.payments : [],
        stats: payload.stats || {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load rent payments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const payments = Array.isArray(data.payments) ? data.payments : [];
    if (filter === 'ALL') return payments;
    if (filter === 'LATE') {
      return payments.filter((payment: any) => {
        const overdue = payment.status === 'PENDING' && new Date(payment.dueDate) < new Date();
        return payment.status === 'LATE' || overdue;
      });
    }
    return payments.filter((payment: any) => payment.status === filter);
  }, [data.payments, filter]);

  const counts = useMemo(() => {
    const payments = Array.isArray(data.payments) ? data.payments : [];
    return {
      ALL: payments.length,
      PENDING: payments.filter((payment: any) => payment.status === 'PENDING' && new Date(payment.dueDate) >= new Date()).length,
      PAID: payments.filter((payment: any) => payment.status === 'PAID').length,
      PARTIAL: payments.filter((payment: any) => payment.status === 'PARTIAL').length,
      LATE: payments.filter((payment: any) => payment.status === 'LATE' || (payment.status === 'PENDING' && new Date(payment.dueDate) < new Date())).length,
      WAIVED: payments.filter((payment: any) => payment.status === 'WAIVED').length,
    };
  }, [data.payments]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="border-b border-slate-200 pb-6">
          <Link href="/landlord" className="text-sm font-semibold text-blue-700">← Landlord dashboard</Link>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">Rent payments</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review rent that is due, paid, partial or overdue from the lease schedules recorded in DENUEL.
          </p>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Payments could not be loaded</h2>
            <p className="mt-2 text-sm text-red-800">{error}</p>
            <button type="button" onClick={loadPayments} className="mt-4 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800">
              Try again
            </button>
          </section>
        )}

        <section className="mt-8 grid border-l border-t border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Pending rent', data.stats?.totalDue, 'money'],
            ['Recorded collected', data.stats?.totalPaid, 'money'],
            ['Overdue payments', data.stats?.overdue, 'count'],
            ['Due within 7 days', data.stats?.upcoming, 'count'],
          ].map(([label, value, type]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold">
                {loading ? '—' : type === 'money' ? money(Number(value || 0)) : Number(value || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 flex flex-wrap gap-2">
          {([
            ['ALL', 'All'],
            ['PENDING', 'Upcoming'],
            ['LATE', 'Overdue'],
            ['PAID', 'Paid'],
            ['PARTIAL', 'Partial'],
            ['WAIVED', 'Waived'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                'border px-3 py-2 text-sm font-medium transition ' +
                (filter === value
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-950')
              }
            >
              {label} <span className="ml-1 opacity-70">({counts[value]})</span>
            </button>
          ))}
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Payment schedule</h2>
            <p className="mt-1 text-xs text-slate-500">
              Values below come from recorded lease payment schedules. DENUEL does not invent missing payment records.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : filteredPayments.length ? (
            <div className="divide-y divide-slate-100">
              {filteredPayments.map((payment: any) => {
                const overdue =
                  payment.status === 'PENDING' &&
                  payment.dueDate &&
                  new Date(payment.dueDate) < new Date();

                const displayStatus = overdue ? 'OVERDUE' : payment.status;

                return (
                  <div key={payment.id} className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_150px_150px_120px] md:items-center">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{payment.lease?.property?.title || 'Property'}</div>
                      <div className="mt-1 truncate text-sm text-slate-500">
                        {payment.lease?.tenant?.name || 'Tenant'}
                        {payment.dueDate ? ' · Due ' + new Date(payment.dueDate).toLocaleDateString('en-ZM') : ''}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Rent amount</div>
                      <div className="mt-1 font-semibold">{money(payment.amount)}</div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Paid date</div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-ZM') : 'Not recorded'}
                      </div>
                    </div>

                    <span className={'w-fit border px-2.5 py-1 text-xs font-semibold ' + statusClass(payment.status, overdue)}>
                      {String(displayStatus).replaceAll('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <h3 className="font-semibold">No payments in this view</h3>
              <p className="mt-2 text-sm text-slate-500">
                Payment entries will appear after lease schedules have been created.
              </p>
              <Link href="/landlord/leases" className="mt-4 inline-flex text-sm font-semibold text-blue-700">
                Review leases →
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
