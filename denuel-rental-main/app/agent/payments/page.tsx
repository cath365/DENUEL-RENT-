'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

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
  if (status === 'PAID')
    return 'bg-emerald-50 text-emerald-700';
  if (status === 'LATE')
    return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

export default function AgentPaymentsPage() {
  const [data, setData] = useState<any>({
    payments: [],
    stats: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState('ALL');
  const [recordingId, setRecordingId] = useState('');
  const [busyId, setBusyId] = useState('');
  const [form, setForm] = useState({
    paymentMethod: 'BANK',
    transactionId: '',
    notes: '',
  });

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        '/api/landlord/rent-payments?role=landlord'
      );

      if (response.status === 401) {
        window.location.href =
          '/auth/login?redirect=/agent/payments';
        return;
      }

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.error ||
            'Unable to load rent payment records.'
        );
      }

      setData({
        payments: Array.isArray(json.payments)
          ? json.payments
          : [],
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
      if (
        statusFilter !== 'ALL' &&
        payment.status !== statusFilter
      ) {
        return false;
      }

      if (!needle) return true;

      return [
        payment.lease?.property?.title,
        payment.lease?.tenant?.name,
        payment.lease?.tenant?.email,
        payment.transactionId,
        payment.paymentMethod,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        );
    });
  }, [payments, query, statusFilter]);

  async function recordOfflinePayment(payment: any) {
    const lateFee = Math.max(
      0,
      Number(payment.lateFee || 0)
    );
    const amountDue =
      Number(payment.amount || 0) + lateFee;

    if (
      !window.confirm(
        `Confirm that you actually received ${money(
          amountDue
        )} by ${form.paymentMethod.replaceAll(
          '_',
          ' '
        )}? This will mark the rent record PAID.`
      )
    ) {
      return;
    }

    setBusyId(payment.id);
    setError('');
    setSuccess('');

    try {
      const response = await csrfFetch(
        '/api/landlord/rent-payments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: payment.id,
            amount: amountDue,
            paymentMethod: form.paymentMethod,
            transactionId:
              form.transactionId.trim() || undefined,
            notes: form.notes.trim() || undefined,
          }),
        }
      );

      const updated = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !updated.id) {
        throw new Error(
          updated.error ||
            'Unable to record this payment.'
        );
      }

      setData((current: any) => ({
        ...current,
        payments: current.payments.map((item: any) =>
          item.id === payment.id ? updated : item
        ),
      }));
      setRecordingId('');
      setForm({
        paymentMethod: 'BANK',
        transactionId: '',
        notes: '',
      });
      setSuccess(
        'Offline payment recorded using the payment details you confirmed.'
      );
      await load();
    } catch (recordError) {
      setError(
        recordError instanceof Error
          ? recordError.message
          : 'Unable to record this payment.'
      );
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/agent"
              className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]"
            >
              ← Agent dashboard
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">
              Rent ledger
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Rent payments
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Rent records generated only from active signed leases.
              Online card payments are verified separately; use
              manual recording here only when you actually received a
              full offline payment.
            </p>
          </div>

          <Link
            href="/agent/leases"
            className="w-fit border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Lease management
          </Link>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              'Outstanding',
              money(data.stats?.totalDue || 0),
            ],
            [
              'Collected',
              money(data.stats?.totalPaid || 0),
            ],
            [
              'Overdue records',
              Number(
                data.stats?.overdue || 0
              ).toLocaleString(),
            ],
            [
              'Due within 7 days',
              Number(
                data.stats?.upcoming || 0
              ).toLocaleString(),
            ],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="border-b border-r border-slate-200 bg-white p-5"
            >
              <div className="text-sm text-slate-500">
                {label}
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-950">
                {loading ? '—' : value}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search tenant, property or transaction reference"
            className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
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
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-6 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-80 animate-pulse border border-slate-200 bg-white" />
        ) : payments.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">
              No rent payment records yet
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Once both parties sign a lease and it becomes active,
              its rent schedule appears here.
            </p>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No rent record matches the current filters.
          </section>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((payment: any) => {
              const lateFee = Math.max(
                0,
                Number(payment.lateFee || 0)
              );
              const amountDue =
                Number(payment.amount || 0) + lateFee;
              const canRecord =
                ['PENDING', 'LATE'].includes(
                  payment.status
                );
              const formOpen =
                recordingId === payment.id;

              return (
                <article key={payment.id} className="p-5">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px_190px] lg:items-center">
                    <div>
                      <Link
                        href={
                          '/property/' +
                          payment.lease?.property?.id
                        }
                        className="font-semibold text-slate-950 hover:text-[#16A34A]"
                      >
                        {payment.lease?.property
                          ?.title || 'Property'}
                      </Link>
                      <div className="mt-1 text-sm text-slate-500">
                        {payment.lease?.tenant?.name ||
                          payment.lease?.tenant?.email ||
                          'Tenant'}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        <span>
                          Due{' '}
                          {formatDate(payment.dueDate)}
                        </span>
                        {payment.paidDate && (
                          <span>
                            Paid{' '}
                            {formatDate(
                              payment.paidDate
                            )}
                          </span>
                        )}
                        {payment.paymentMethod && (
                          <span>
                            Method{' '}
                            {payment.paymentMethod}
                          </span>
                        )}
                      </div>
                      {payment.transactionId && (
                        <div className="mt-2 break-all text-xs text-slate-400">
                          Reference:{' '}
                          {payment.transactionId}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-[#0F2B46]">
                        {money(amountDue)}
                      </div>
                      {lateFee > 0 && (
                        <div className="mt-1 text-xs text-red-600">
                          Includes recorded late fee{' '}
                          {money(lateFee)}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <span
                        className={`w-fit px-2.5 py-1 text-xs font-semibold ${tone(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>

                      {canRecord && (
                        <button
                          type="button"
                          onClick={() =>
                            setRecordingId(
                              formOpen
                                ? ''
                                : payment.id
                            )
                          }
                          className="border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          {formOpen
                            ? 'Close'
                            : 'Record offline payment'}
                        </button>
                      )}
                    </div>
                  </div>

                  {formOpen && canRecord && (
                    <div className="mt-5 border-t border-slate-200 pt-5">
                      <div className="max-w-2xl">
                        <h3 className="font-semibold text-slate-950">
                          Record actual offline payment
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Use this only when the full{' '}
                          {money(amountDue)} was actually
                          received outside Ng&apos;anda. The
                          system does not represent partial
                          payments without a proper
                          amount-paid ledger.
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <select
                            value={
                              form.paymentMethod
                            }
                            onChange={(event) =>
                              setForm({
                                ...form,
                                paymentMethod:
                                  event.target.value,
                              })
                            }
                            className="h-11 border border-slate-300 bg-white px-3 text-sm"
                          >
                            <option value="BANK">
                              Bank
                            </option>
                            <option value="MOBILE_MONEY">
                              Mobile money
                            </option>
                            <option value="CASH">
                              Cash
                            </option>
                            <option value="CARD">
                              Card recorded offline
                            </option>
                          </select>

                          <input
                            value={form.transactionId}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                transactionId:
                                  event.target.value,
                              })
                            }
                            placeholder="Transaction/reference (if available)"
                            className="h-11 border border-slate-300 px-3 text-sm"
                          />

                          <textarea
                            value={form.notes}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                notes:
                                  event.target.value,
                              })
                            }
                            rows={3}
                            maxLength={1000}
                            placeholder="Optional payment note"
                            className="border border-slate-300 p-3 text-sm sm:col-span-2"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={
                            busyId === payment.id
                          }
                          onClick={() =>
                            recordOfflinePayment(
                              payment
                            )
                          }
                          className="mt-4 bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {busyId === payment.id
                            ? 'Recording…'
                            : 'Confirm full payment received'}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
