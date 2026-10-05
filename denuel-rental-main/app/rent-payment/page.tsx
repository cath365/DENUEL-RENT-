'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';

type Lease = {
  id: string;
  landlord: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
  };
  property: {
    id: string;
    title: string;
  };
};

type RentPayment = {
  id: string;
  leaseId: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: string;
  lateFee?: number | null;
  paymentMethod?: string | null;
  transactionId?: string | null;
  notes?: string | null;
  lease: {
    id: string;
    property: {
      id: string;
      title: string;
    };
  };
};

type Overview = {
  stats: {
    amountDue: number;
    pendingPayments: number;
    overduePayments: number;
  };
  leases: Lease[];
  payments: RentPayment[];
};

type Filter = 'ALL' | 'DUE' | 'PAID' | 'WAIVED';

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

function statusClass(status: string, overdue: boolean) {
  if (status === 'PAID') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (status === 'WAIVED') {
    return 'border-slate-300 bg-slate-100 text-slate-700';
  }
  if (overdue || status === 'LATE') {
    return 'border-red-200 bg-red-50 text-red-800';
  }
  if (status === 'PARTIAL') {
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

export default function RentPaymentPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [filter, setFilter] = useState<Filter>('DUE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  async function loadPayments(initial = false) {
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
          '/auth/login?redirect=' + encodeURIComponent('/rent-payment');
        return;
      }

      if (!res.ok) {
        throw new Error(
          data?.error || text || 'Unable to load rent payment records.'
        );
      }

      setOverview(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load rent payment records.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPayments(true);
  }, []);

  const now = Date.now();

  const payments = useMemo(() => overview?.payments || [], [overview]);

  const filteredPayments = useMemo(() => {
    if (filter === 'ALL') return payments;
    if (filter === 'PAID') {
      return payments.filter((payment) => payment.status === 'PAID');
    }
    if (filter === 'WAIVED') {
      return payments.filter((payment) => payment.status === 'WAIVED');
    }
    return payments.filter((payment) =>
      ['PENDING', 'PARTIAL', 'LATE'].includes(payment.status)
    );
  }, [payments, filter]);

  const paidTotal = useMemo(
    () =>
      payments
        .filter((payment) => payment.status === 'PAID')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [payments]
  );

  const nextDue = useMemo(
    () =>
      payments
        .filter(
          (payment) =>
            ['PENDING', 'PARTIAL', 'LATE'].includes(payment.status) &&
            new Date(payment.dueDate).getTime() >= now
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )[0] || null,
    [payments, now]
  );

  const leaseById = useMemo(() => {
    const map = new Map<string, Lease>();
    (overview?.leases || []).forEach((lease) => map.set(lease.id, lease));
    return map;
  }, [overview]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/renter-hub"
              className="text-sm font-semibold text-blue-700"
            >
              ← Renter Hub
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">
              Rent payments
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review rent-payment records generated from your DENUEL lease schedule. Payment status changes only when a landlord or administrator records a verified payment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadPayments(false)}
            disabled={refreshing}
            className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        )}

        <section className="mt-7 border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-950">
            Online rent settlement is not enabled yet
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">
            DENUEL does not currently have a payment-gateway webhook that can verify a successful charge and safely attach it to a rent record. This page therefore does not show a fake Pay button or generate fake receipts.
          </p>
        </section>

        <section className="mt-7 grid grid-cols-2 border-l border-t border-slate-200 bg-white lg:grid-cols-4">
          {[
            ['Scheduled amount due', money(overview?.stats.amountDue), 'Pending/Late schedule'],
            ['Pending records', overview?.stats.pendingPayments ?? 0, 'Pending or partial'],
            ['Overdue records', overview?.stats.overduePayments ?? 0, 'Based on stored due dates'],
            ['Recorded paid total', money(paidTotal), 'Payments marked PAID'],
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

        {nextDue && (
          <section className="mt-6 border border-blue-200 bg-blue-50 p-5">
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Next scheduled rent
                </div>
                <div className="mt-2 font-semibold">
                  {nextDue.lease.property.title}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Due {new Date(nextDue.dueDate).toLocaleDateString('en-ZM')}
                </div>
              </div>
              <div className="text-2xl font-bold">
                {money(
                  Number(nextDue.amount || 0) + Number(nextDue.lateFee || 0)
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 flex flex-wrap gap-2">
          {([
            ['DUE', 'Due'],
            ['PAID', 'Paid'],
            ['WAIVED', 'Waived'],
            ['ALL', 'All records'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                'border px-3 py-2 text-sm font-semibold ' +
                (filter === value
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-300 bg-white text-slate-600')
              }
            >
              {label}
            </button>
          ))}
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Rent-payment schedule</h2>
            <p className="mt-1 text-xs text-slate-500">
              These are stored lease payment records. Missing records are not estimated or created in the browser.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : filteredPayments.length ? (
            <div className="divide-y divide-slate-100">
              {filteredPayments.map((payment) => {
                const overdue =
                  ['PENDING', 'LATE'].includes(payment.status) &&
                  new Date(payment.dueDate).getTime() < now;
                const lease = leaseById.get(payment.leaseId);

                return (
                  <article
                    key={payment.id}
                    className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_160px_150px] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {payment.lease.property.title}
                        </span>
                        <span
                          className={
                            'border px-2 py-0.5 text-xs font-semibold ' +
                            statusClass(payment.status, overdue)
                          }
                        >
                          {overdue ? 'Overdue' : humanize(payment.status)}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-slate-500">
                        Due {new Date(payment.dueDate).toLocaleDateString('en-ZM')}
                      </div>

                      {payment.status === 'PAID' && (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            Paid date:{' '}
                            {payment.paidDate
                              ? new Date(payment.paidDate).toLocaleDateString('en-ZM')
                              : 'Not recorded'}
                          </span>
                          <span>
                            Method: {humanize(payment.paymentMethod)}
                          </span>
                          {payment.transactionId && (
                            <span>Reference: {payment.transactionId}</span>
                          )}
                        </div>
                      )}

                      {payment.notes && (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {payment.notes}
                        </p>
                      )}

                      {payment.status !== 'PAID' && lease && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {lease.landlord.phone && (
                            <a
                              href={'tel:' + lease.landlord.phone}
                              className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              Call landlord
                            </a>
                          )}
                          <a
                            href={'mailto:' + lease.landlord.email}
                            className="border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            Email landlord
                          </a>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Scheduled rent</div>
                      <div className="mt-1 font-semibold">
                        {money(payment.amount)}
                      </div>
                      {Number(payment.lateFee || 0) > 0 && (
                        <div className="mt-1 text-xs text-red-700">
                          Recorded late fee: {money(payment.lateFee)}
                        </div>
                      )}
                    </div>

                    <div className="md:text-right">
                      <div className="text-xs text-slate-400">Recorded total</div>
                      <div className="mt-1 text-lg font-bold">
                        {money(
                          Number(payment.amount || 0) +
                            Number(payment.lateFee || 0)
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="p-10 text-center">
              <h3 className="font-semibold">No payment records in this view</h3>
              <p className="mt-2 text-sm text-slate-500">
                Rent-payment records are generated from active lease schedules.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">What happens next</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            When DENUEL connects a production payment gateway, the payment flow should create a server-side payment reference, verify settlement through a webhook, then update the matching rent record and generate a real receipt. Until then, payment status remains based on recorded lease/payment data only.
          </p>
        </section>
      </main>
    </div>
  );
}
