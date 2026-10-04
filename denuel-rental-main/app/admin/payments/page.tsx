'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';

type PlatformPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  transactionRef?: string | null;
  phoneNumber?: string | null;
  description?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  createdAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
};

type RentPayment = {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
  paidDate?: string | null;
  lateFee?: number | null;
  paymentMethod?: string | null;
  transactionId?: string | null;
  tenant: {
    id: string;
    name?: string | null;
    email: string;
  };
  lease: {
    id: string;
    landlord: {
      id: string;
      name?: string | null;
      email: string;
    };
    property: {
      id: string;
      title: string;
    };
  };
};

type Stats = {
  completedVolume: number;
  thisMonthCompletedVolume: number;
  pendingVolume: number;
  completedPayments: number;
  recordedPaidRent: number;
};

type Tab = 'platform' | 'rent';
type Filter = 'all' | 'completed' | 'pending' | 'failed' | 'refunded';

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
  if (status === 'COMPLETED' || status === 'PAID') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (status === 'FAILED') {
    return 'border-red-200 bg-red-50 text-red-800';
  }
  if (status === 'REFUNDED' || status === 'WAIVED') {
    return 'border-slate-300 bg-slate-100 text-slate-700';
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

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [stats, setStats] = useState<Stats>({
    completedVolume: 0,
    thisMonthCompletedVolume: 0,
    pendingVolume: 0,
    completedPayments: 0,
    recordedPaidRent: 0,
  });
  const [tab, setTab] = useState<Tab>('platform');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PlatformPayment | null>(null);
  const [selectedRentPayment, setSelectedRentPayment] = useState<RentPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadPayments() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);

      const res = await fetch('/api/admin/payments?' + params.toString(), {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401 || res.status === 403) {
        window.location.href =
          '/auth/login?redirect=' + encodeURIComponent('/admin/payments');
        return;
      }

      if (!res.ok) {
        throw new Error(
          data?.error || text || 'Unable to load payment records.'
        );
      }

      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setRentPayments(
        Array.isArray(data.rentPayments) ? data.rentPayments : []
      );
      setStats(
        data.stats || {
          completedVolume: 0,
          thisMonthCompletedVolume: 0,
          pendingVolume: 0,
          completedPayments: 0,
          recordedPaidRent: 0,
        }
      );
    } catch (err) {
      setPayments([]);
      setRentPayments([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load payment records.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const filteredPlatform = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;

    return payments.filter((payment) =>
      [
        payment.id,
        payment.transactionRef,
        payment.user.name,
        payment.user.email,
        payment.description,
        payment.paymentMethod,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [payments, query]);

  const filteredRent = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rentPayments;

    return rentPayments.filter((payment) =>
      [
        payment.id,
        payment.transactionId,
        payment.tenant.name,
        payment.tenant.email,
        payment.lease.landlord.name,
        payment.lease.landlord.email,
        payment.lease.property.title,
        payment.paymentMethod,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [rentPayments, query]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <Link href="/admin" className="text-sm font-semibold text-blue-700">
              ← Admin dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">
              Payment records
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review payment records that actually exist in DENUEL. This page does not create fallback transactions, revenue or refund actions when a gateway is unavailable.
            </p>
          </div>

          <button
            type="button"
            onClick={loadPayments}
            className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Refresh
          </button>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        )}

        <section className="mt-7 grid grid-cols-2 border-l border-t border-slate-200 bg-white lg:grid-cols-5">
          {[
            ['Completed platform volume', money(stats.completedVolume)],
            ['This month completed', money(stats.thisMonthCompletedVolume)],
            ['Pending platform volume', money(stats.pendingVolume)],
            ['Completed platform payments', stats.completedPayments.toLocaleString()],
            ['Recorded paid rent', money(stats.recordedPaidRent)],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-4">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-2 text-xl font-bold">
                {loading ? '—' : value}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 flex flex-col gap-3 border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
          <div className="flex gap-2">
            {([
              ['platform', 'Platform payments'],
              ['rent', 'Rent records'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTab(value);
                  setSelectedPayment(null);
                  setSelectedRentPayment(null);
                }}
                className={
                  'border px-3 py-2 text-sm font-semibold ' +
                  (tab === value
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-300 bg-white text-slate-600')
                }
              >
                {label}
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ID, reference, user, property or method"
            className="h-10 min-w-0 flex-1 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950"
          />

          {tab === 'platform' && (
            <div className="flex flex-wrap gap-2">
              {([
                ['all', 'All'],
                ['completed', 'Completed'],
                ['pending', 'Pending'],
                ['failed', 'Failed'],
                ['refunded', 'Refunded'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={
                    'border px-3 py-2 text-xs font-semibold ' +
                    (filter === value
                      ? 'border-blue-700 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-600')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="overflow-hidden border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold">
                {tab === 'platform'
                  ? 'Platform Payment records'
                  : 'Lease rent-payment records'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest stored records only.
              </p>
            </div>

            {loading ? (
              <div className="space-y-4 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse bg-slate-100" />
                ))}
              </div>
            ) : tab === 'platform' ? (
              filteredPlatform.length ? (
                <div className="divide-y divide-slate-100">
                  {filteredPlatform.map((payment) => (
                    <button
                      key={payment.id}
                      type="button"
                      onClick={() => setSelectedPayment(payment)}
                      className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_130px_130px_120px] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {payment.user.name || payment.user.email}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {payment.description || 'No description'}
                        </div>
                        <div className="mt-1 truncate text-xs text-slate-400">
                          {payment.transactionRef || payment.id}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Amount</div>
                        <div className="mt-1 text-sm font-semibold">
                          {money(payment.amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Method</div>
                        <div className="mt-1 text-sm font-semibold">
                          {humanize(payment.paymentMethod)}
                        </div>
                      </div>
                      <span
                        className={
                          'w-fit border px-2.5 py-1 text-xs font-semibold ' +
                          statusClass(payment.status)
                        }
                      >
                        {humanize(payment.status)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <h3 className="font-semibold">No platform payments found</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    No real Payment records match this view.
                  </p>
                </div>
              )
            ) : filteredRent.length ? (
              <div className="divide-y divide-slate-100">
                {filteredRent.map((payment) => (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => setSelectedRentPayment(payment)}
                    className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_130px_150px_120px] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {payment.lease.property.title}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        Tenant: {payment.tenant.name || payment.tenant.email}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Scheduled amount</div>
                      <div className="mt-1 text-sm font-semibold">
                        {money(payment.amount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Due</div>
                      <div className="mt-1 text-sm font-semibold">
                        {new Date(payment.dueDate).toLocaleDateString('en-ZM')}
                      </div>
                    </div>
                    <span
                      className={
                        'w-fit border px-2.5 py-1 text-xs font-semibold ' +
                        statusClass(payment.status)
                      }
                    >
                      {humanize(payment.status)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center">
                <h3 className="font-semibold">No rent-payment records found</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Lease schedules will appear here when they exist.
                </p>
              </div>
            )}
          </section>

          <aside className="border border-slate-200 bg-white p-5 xl:sticky xl:top-24 xl:h-fit">
            {tab === 'platform' && selectedPayment ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Platform payment
                </div>
                <div className="mt-2 text-3xl font-bold">
                  {money(selectedPayment.amount)}
                </div>
                <span
                  className={
                    'mt-3 inline-flex border px-2.5 py-1 text-xs font-semibold ' +
                    statusClass(selectedPayment.status)
                  }
                >
                  {humanize(selectedPayment.status)}
                </span>

                <div className="mt-6 space-y-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">User</div>
                    <div className="mt-1 font-semibold">
                      {selectedPayment.user.name || selectedPayment.user.email}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {selectedPayment.user.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Payment method</div>
                    <div className="mt-1 font-semibold">
                      {humanize(selectedPayment.paymentMethod)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Reference</div>
                    <div className="mt-1 break-all font-mono text-xs">
                      {selectedPayment.transactionRef || 'No external reference recorded'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Created</div>
                    <div className="mt-1 font-semibold">
                      {new Date(selectedPayment.createdAt).toLocaleString('en-ZM')}
                    </div>
                  </div>
                  {selectedPayment.paidAt && (
                    <div>
                      <div className="text-xs text-slate-400">Paid at</div>
                      <div className="mt-1 font-semibold">
                        {new Date(selectedPayment.paidAt).toLocaleString('en-ZM')}
                      </div>
                    </div>
                  )}
                  {selectedPayment.failureReason && (
                    <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {selectedPayment.failureReason}
                    </div>
                  )}
                </div>
              </div>
            ) : tab === 'rent' && selectedRentPayment ? (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rent record
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {selectedRentPayment.lease.property.title}
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {money(selectedRentPayment.amount)}
                </div>
                <span
                  className={
                    'mt-3 inline-flex border px-2.5 py-1 text-xs font-semibold ' +
                    statusClass(selectedRentPayment.status)
                  }
                >
                  {humanize(selectedRentPayment.status)}
                </span>

                <div className="mt-6 space-y-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-400">Tenant</div>
                    <div className="mt-1 font-semibold">
                      {selectedRentPayment.tenant.name ||
                        selectedRentPayment.tenant.email}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {selectedRentPayment.tenant.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Landlord</div>
                    <div className="mt-1 font-semibold">
                      {selectedRentPayment.lease.landlord.name ||
                        selectedRentPayment.lease.landlord.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Due date</div>
                    <div className="mt-1 font-semibold">
                      {new Date(selectedRentPayment.dueDate).toLocaleDateString('en-ZM')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Recorded method</div>
                    <div className="mt-1 font-semibold">
                      {humanize(selectedRentPayment.paymentMethod)}
                    </div>
                  </div>
                  {selectedRentPayment.transactionId && (
                    <div>
                      <div className="text-xs text-slate-400">Reference</div>
                      <div className="mt-1 break-all font-mono text-xs">
                        {selectedRentPayment.transactionId}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="font-semibold">Select a record</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Choose a real payment record to inspect its stored details.
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold">Gateway actions</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Refund and online settlement buttons are intentionally unavailable until DENUEL has a production gateway integration that can verify those actions.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
