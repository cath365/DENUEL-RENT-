'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import { csrfFetch } from '../../../lib/csrf';

type Filter = 'ALL' | 'PENDING' | 'PAID' | 'PARTIAL' | 'LATE' | 'WAIVED';
type PaymentMethod = 'CASH' | 'BANK' | 'MOBILE_MONEY' | 'CARD';
type AdjustmentStatus = 'PENDING' | 'LATE' | 'WAIVED';

type RentPayment = {
  id: string;
  leaseId: string;
  tenantId: string;
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
      addressText?: string | null;
    };
    tenant: {
      id: string;
      name?: string | null;
      email: string;
    };
    landlord: {
      id: string;
      name?: string | null;
    };
  };
};

type PaymentData = {
  payments: RentPayment[];
  stats: {
    totalDue?: number;
    totalPaid?: number;
    overdue?: number;
    upcoming?: number;
  };
};

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
  if (status === 'PAID') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'PARTIAL') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'WAIVED') return 'border-slate-300 bg-slate-100 text-slate-700';
  if (status === 'LATE' || overdue) return 'border-red-200 bg-red-50 text-red-800';
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

export default function PaymentsPage() {
  const [data, setData] = useState<PaymentData>({
    payments: [],
    stats: {},
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<RentPayment | null>(null);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [adjustmentStatus, setAdjustmentStatus] =
    useState<AdjustmentStatus>('PENDING');
  const [lateFee, setLateFee] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  async function loadPayments(selectedId?: string) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/landlord/rent-payments?role=landlord', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const { text, data: payload } = await readResponse(res);

      if (res.status === 401) {
        window.location.href =
          '/auth/login?redirect=/landlord/payments&reason=session';
        return;
      }

      if (res.status === 403) {
        window.location.href = '/dashboard';
        return;
      }

      if (!res.ok) {
        throw new Error(
          payload?.error || text || 'Unable to load rent payments.'
        );
      }

      const next: PaymentData = {
        payments: Array.isArray(payload.payments) ? payload.payments : [],
        stats: payload.stats || {},
      };

      setData(next);

      const id = selectedId || selected?.id;
      if (id) {
        setSelected(next.payments.find((payment) => payment.id === id) || null);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load rent payments.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  function openPayment(payment: RentPayment) {
    setSelected(payment);
    setError('');
    setNotice('');
    setPaymentMethod('CASH');
    setTransactionId(payment.transactionId || '');
    setPaymentNotes(payment.notes || '');
    setAdjustmentStatus(
      payment.status === 'LATE' || payment.status === 'WAIVED'
        ? payment.status
        : 'PENDING'
    );
    setLateFee(
      payment.lateFee !== null && payment.lateFee !== undefined
        ? String(payment.lateFee)
        : ''
    );
    setAdjustmentNotes(payment.notes || '');
  }

  const filteredPayments = useMemo(() => {
    if (filter === 'ALL') return data.payments;

    if (filter === 'LATE') {
      return data.payments.filter((payment) => {
        const overdue =
          payment.status === 'PENDING' &&
          new Date(payment.dueDate) < new Date();
        return payment.status === 'LATE' || overdue;
      });
    }

    return data.payments.filter((payment) => payment.status === filter);
  }, [data.payments, filter]);

  const counts = useMemo(() => {
    const now = new Date();
    return {
      ALL: data.payments.length,
      PENDING: data.payments.filter(
        (payment) =>
          payment.status === 'PENDING' &&
          new Date(payment.dueDate) >= now
      ).length,
      PAID: data.payments.filter((payment) => payment.status === 'PAID').length,
      PARTIAL: data.payments.filter((payment) => payment.status === 'PARTIAL')
        .length,
      LATE: data.payments.filter(
        (payment) =>
          payment.status === 'LATE' ||
          (payment.status === 'PENDING' && new Date(payment.dueDate) < now)
      ).length,
      WAIVED: data.payments.filter((payment) => payment.status === 'WAIVED')
        .length,
    };
  }, [data.payments]);

  async function recordPayment() {
    if (!selected) return;

    setProcessing('record');
    setError('');
    setNotice('');

    try {
      const res = await csrfFetch('/api/landlord/rent-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selected.id,
          paymentMethod,
          transactionId: transactionId.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
        }),
      });
      const { text, data: payload } = await readResponse(res);

      if (res.status === 401) {
        window.location.href =
          '/auth/login?redirect=/landlord/payments&reason=session';
        return;
      }

      if (!res.ok) {
        const validation = Array.isArray(payload?.error)
          ? payload.error
              .map((item: any) => item.message)
              .filter(Boolean)
              .join(' ')
          : payload?.error;
        throw new Error(
          validation || text || 'Unable to record rent payment.'
        );
      }

      setNotice(
        'Payment recorded using the stored rent schedule amount of ' +
          money(selected.amount) +
          '.'
      );
      await loadPayments(selected.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to record rent payment.'
      );
    } finally {
      setProcessing('');
    }
  }

  async function saveAdjustment() {
    if (!selected) return;

    const parsedLateFee =
      lateFee.trim() === '' ? null : Number(lateFee);

    if (
      parsedLateFee !== null &&
      (!Number.isFinite(parsedLateFee) || parsedLateFee < 0)
    ) {
      setError('Late fee must be zero or a positive amount.');
      return;
    }

    setProcessing('adjust');
    setError('');
    setNotice('');

    try {
      const res = await csrfFetch('/api/landlord/rent-payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selected.id,
          status: adjustmentStatus,
          lateFee: parsedLateFee,
          notes: adjustmentNotes.trim() || undefined,
        }),
      });
      const { text, data: payload } = await readResponse(res);

      if (res.status === 401) {
        window.location.href =
          '/auth/login?redirect=/landlord/payments&reason=session';
        return;
      }

      if (!res.ok) {
        const validation = Array.isArray(payload?.error)
          ? payload.error
              .map((item: any) => item.message)
              .filter(Boolean)
              .join(' ')
          : payload?.error;
        throw new Error(
          validation || text || 'Unable to update rent schedule.'
        );
      }

      setNotice('Rent schedule record updated.');
      await loadPayments(selected.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update rent schedule.'
      );
    } finally {
      setProcessing('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/landlord"
              className="text-sm font-semibold text-blue-700"
            >
              ← Landlord dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em]">
              Rent payments
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review real lease payment schedules and record offline payments that you have actually received. DENUEL does not let tenants mark themselves paid.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadPayments()}
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

        {notice && (
          <section className="mt-6 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </section>
        )}

        <section className="mt-7 grid border-l border-t border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Pending rent', data.stats?.totalDue, 'money'],
            ['Recorded collected', data.stats?.totalPaid, 'money'],
            ['Overdue payments', data.stats?.overdue, 'count'],
            ['Due within 7 days', data.stats?.upcoming, 'count'],
          ].map(([label, value, type]) => (
            <div
              key={String(label)}
              className="border-b border-r border-slate-200 p-5"
            >
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold">
                {loading
                  ? '—'
                  : type === 'money'
                    ? money(Number(value || 0))
                    : Number(value || 0).toLocaleString()}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold">How payment recording works</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
            “Record payment” means you are confirming that the scheduled rent was received outside DENUEL, such as cash, bank transfer or mobile money. The server uses the stored lease amount; this page cannot change the payment amount. Late fees are never added automatically.
          </p>
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
              {label}{' '}
              <span className="ml-1 opacity-70">({counts[value]})</span>
            </button>
          ))}
        </section>

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Payment schedule</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select a record to inspect it, record a received payment or update its schedule state.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse bg-slate-100"
                />
              ))}
            </div>
          ) : filteredPayments.length ? (
            <div className="divide-y divide-slate-100">
              {filteredPayments.map((payment) => {
                const overdue =
                  payment.status === 'PENDING' &&
                  new Date(payment.dueDate) < new Date();

                return (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() => openPayment(payment)}
                    className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_150px_150px_120px] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {payment.lease?.property?.title || 'Property'}
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-500">
                        {payment.lease?.tenant?.name ||
                          payment.lease?.tenant?.email ||
                          'Tenant'}
                        {' · Due '}
                        {new Date(payment.dueDate).toLocaleDateString('en-ZM')}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">
                        Scheduled rent
                      </div>
                      <div className="mt-1 font-semibold">
                        {money(payment.amount)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-400">Paid date</div>
                      <div className="mt-1 text-sm font-medium text-slate-700">
                        {payment.paidDate
                          ? new Date(payment.paidDate).toLocaleDateString(
                              'en-ZM'
                            )
                          : 'Not recorded'}
                      </div>
                    </div>

                    <span
                      className={
                        'w-fit border px-2.5 py-1 text-xs font-semibold ' +
                        statusClass(payment.status, overdue)
                      }
                    >
                      {overdue ? 'OVERDUE' : humanize(payment.status)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <h3 className="font-semibold">No payments in this view</h3>
              <p className="mt-2 text-sm text-slate-500">
                Payment entries appear after a lease schedule has been created.
              </p>
              <Link
                href="/landlord/leases"
                className="mt-4 inline-flex text-sm font-semibold text-blue-700"
              >
                Review leases →
              </Link>
            </div>
          )}
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[80] bg-black/50 p-0 sm:p-4">
          <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
              <div>
                <h2 className="text-xl font-bold">
                  {selected.lease.property.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.lease.tenant.name ||
                    selected.lease.tenant.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm font-semibold text-slate-500"
              >
                Close
              </button>
            </div>

            <div className="space-y-7 p-5 sm:p-7">
              <section className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-slate-400">Scheduled rent</div>
                  <div className="mt-1 text-lg font-bold">
                    {money(selected.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Due date</div>
                  <div className="mt-1 font-semibold">
                    {new Date(selected.dueDate).toLocaleDateString('en-ZM')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Status</div>
                  <div className="mt-1 font-semibold">
                    {humanize(selected.status)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Recorded late fee</div>
                  <div className="mt-1 font-semibold">
                    {money(selected.lateFee)}
                  </div>
                </div>
                {selected.paymentMethod && (
                  <div>
                    <div className="text-xs text-slate-400">
                      Payment method
                    </div>
                    <div className="mt-1 font-semibold">
                      {humanize(selected.paymentMethod)}
                    </div>
                  </div>
                )}
                {selected.transactionId && (
                  <div>
                    <div className="text-xs text-slate-400">Reference</div>
                    <div className="mt-1 break-all font-mono text-xs">
                      {selected.transactionId}
                    </div>
                  </div>
                )}
              </section>

              {selected.status !== 'PAID' &&
                selected.status !== 'WAIVED' &&
                selected.status !== 'PARTIAL' && (
                  <section className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-bold">
                      Record received payment
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Use this only after you have actually received the full
                      scheduled rent of {money(selected.amount)}. Partial
                      settlement is not enabled because the current data model
                      does not store a separate paid amount.
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium">
                        Payment method
                        <select
                          value={paymentMethod}
                          onChange={(event) =>
                            setPaymentMethod(
                              event.target.value as PaymentMethod
                            )
                          }
                          className="mt-2 h-11 w-full border border-slate-300 bg-white px-3"
                        >
                          <option value="CASH">Cash</option>
                          <option value="BANK">Bank transfer</option>
                          <option value="MOBILE_MONEY">Mobile money</option>
                          <option value="CARD">Card</option>
                        </select>
                      </label>

                      <label className="text-sm font-medium">
                        Transaction/reference ID (optional)
                        <input
                          value={transactionId}
                          onChange={(event) =>
                            setTransactionId(event.target.value)
                          }
                          placeholder="Reference from the real payment"
                          className="mt-2 h-11 w-full border border-slate-300 px-3"
                        />
                      </label>
                    </div>

                    <label className="mt-4 block text-sm font-medium">
                      Notes (optional)
                      <textarea
                        value={paymentNotes}
                        onChange={(event) =>
                          setPaymentNotes(event.target.value)
                        }
                        rows={3}
                        maxLength={2000}
                        className="mt-2 w-full border border-slate-300 p-3"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={recordPayment}
                      disabled={processing === 'record'}
                      className="mt-4 bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {processing === 'record'
                        ? 'Recording…'
                        : 'Record full payment received'}
                    </button>
                  </section>
                )}

              {selected.status === 'PARTIAL' && (
                <section className="border border-blue-200 bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-950">
                    Existing partial-payment record
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-blue-900">
                    This record predates the secured payment workflow. No new
                    partial payment can be created until DENUEL stores the
                    actual paid amount separately.
                  </p>
                </section>
              )}

              {selected.status !== 'PAID' && (
                <section className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-bold">Schedule adjustment</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Change the schedule state or explicitly add/remove a late
                    fee. DENUEL does not calculate a late fee automatically.
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium">
                      Schedule status
                      <select
                        value={adjustmentStatus}
                        onChange={(event) =>
                          setAdjustmentStatus(
                            event.target.value as AdjustmentStatus
                          )
                        }
                        className="mt-2 h-11 w-full border border-slate-300 bg-white px-3"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="LATE">Late</option>
                        <option value="WAIVED">Waived</option>
                      </select>
                    </label>

                    <label className="text-sm font-medium">
                      Late fee (ZMW)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={lateFee}
                        onChange={(event) => setLateFee(event.target.value)}
                        placeholder="Leave blank for none"
                        className="mt-2 h-11 w-full border border-slate-300 px-3"
                      />
                    </label>
                  </div>

                  <label className="mt-4 block text-sm font-medium">
                    Adjustment notes (optional)
                    <textarea
                      value={adjustmentNotes}
                      onChange={(event) =>
                        setAdjustmentNotes(event.target.value)
                      }
                      rows={3}
                      maxLength={2000}
                      className="mt-2 w-full border border-slate-300 p-3"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={saveAdjustment}
                    disabled={processing === 'adjust'}
                    className="mt-4 border border-slate-950 bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                  >
                    {processing === 'adjust'
                      ? 'Saving…'
                      : 'Save schedule adjustment'}
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
