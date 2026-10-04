'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type RentPayment = {
  id: string;
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
    monthlyRent: number;
    property: {
      id: string;
      title: string;
      addressText?: string | null;
      city?: string | null;
      area?: string | null;
    };
    landlord: {
      id: string;
      name?: string | null;
    };
  };
};

function money(value: unknown) {
  return 'K' + Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
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

function statusTone(status: string) {
  if (status === 'PAID') return 'bg-emerald-50 text-emerald-700';
  if (status === 'LATE') return 'bg-red-50 text-red-700';
  if (status === 'PARTIAL') return 'bg-amber-50 text-amber-700';
  if (status === 'WAIVED') return 'bg-slate-100 text-slate-600';
  return 'bg-amber-50 text-amber-700';
}

function CardPaymentForm({
  payment,
  onRecorded,
}: {
  payment: RentPayment;
  onRecorded: (payment: RentPayment) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const lateFee =
    Number.isFinite(Number(payment.lateFee)) && Number(payment.lateFee) > 0
      ? Number(payment.lateFee)
      : 0;

  const total = Number(payment.amount) + lateFee;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!stripe || !elements || submitting) return;

    const card = elements.getElement(CardElement);
    if (!card) {
      setError('Card details are unavailable.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const intentResponse = await csrfFetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentPaymentId: payment.id,
        }),
      });

      const intentData = await intentResponse.json().catch(() => ({}));

      if (intentResponse.status === 401) {
        window.location.href = '/auth/login?redirect=/rent-payment';
        return;
      }

      if (!intentResponse.ok || !intentData.clientSecret) {
        throw new Error(
          intentData.error || 'Unable to start the online rent payment.'
        );
      }

      const result = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card,
        },
      });

      if (result.error) {
        throw new Error(
          result.error.message || 'The card payment was not completed.'
        );
      }

      if (!result.paymentIntent || result.paymentIntent.status !== 'succeeded') {
        throw new Error('The payment has not been confirmed as successful.');
      }

      const confirmResponse = await csrfFetch('/api/payments/confirm-rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: result.paymentIntent.id,
        }),
      });

      const confirmed = await confirmResponse.json().catch(() => ({}));

      if (!confirmResponse.ok || !confirmed.payment) {
        throw new Error(
          confirmed.error ||
            'The card payment succeeded, but Ng\'anda could not confirm the rent record yet. Contact support before trying again.'
        );
      }

      onRecorded(confirmed.payment);
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : 'Unable to complete this payment.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-slate-600">Rent record</span>
          <strong>{money(payment.amount)}</strong>
        </div>

        {lateFee > 0 && (
          <div className="mt-2 flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-600">Recorded late fee</span>
            <strong>{money(lateFee)}</strong>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
          <span className="text-sm font-semibold text-slate-900">Amount to pay</span>
          <strong className="text-xl text-[#0F2B46]">{money(total)}</strong>
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-slate-800">
          Card details
        </label>
        <div className="border border-slate-300 bg-white p-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#374151',
                  '::placeholder': { color: '#94A3B8' },
                },
                invalid: {
                  color: '#B91C1C',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="mt-5 w-full bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? 'Processing secure payment…' : 'Pay ' + money(total)}
      </button>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Ng&apos;anda records this rent as paid only after the configured card
        provider confirms a successful transaction.
      </p>
    </form>
  );
}

export default function RentPaymentPage() {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [success, setSuccess] = useState<RentPayment | null>(null);

  async function loadPayments() {
    setLoading(true);
    setLoadError('');

    try {
      const response = await fetch(
        '/api/landlord/rent-payments?role=tenant'
      );

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/rent-payment';
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to load your rent payment records.'
        );
      }

      const items = Array.isArray(data.payments) ? data.payments : [];
      setPayments(items);

      const payable = items.find((payment: RentPayment) =>
        ['PENDING', 'LATE'].includes(payment.status)
      );

      setSelectedId((current) => {
        if (current && items.some((payment: RentPayment) => payment.id === current)) {
          return current;
        }
        return payable?.id || '';
      });
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load your rent payment records.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const payablePayments = useMemo(
    () => payments.filter((payment) => ['PENDING', 'LATE'].includes(payment.status)),
    [payments]
  );

  const history = useMemo(
    () =>
      payments.filter((payment) =>
        ['PAID', 'PARTIAL', 'WAIVED'].includes(payment.status)
      ),
    [payments]
  );

  const selected =
    payablePayments.find((payment) => payment.id === selectedId) || null;

  const outstandingTotal = useMemo(
    () =>
      payablePayments.reduce((total, payment) => {
        const lateFee =
          Number.isFinite(Number(payment.lateFee)) && Number(payment.lateFee) > 0
            ? Number(payment.lateFee)
            : 0;
        return total + Number(payment.amount || 0) + lateFee;
      }, 0),
    [payablePayments]
  );

  function handleRecorded(updated: RentPayment) {
    setPayments((current) =>
      current.map((payment) =>
        payment.id === updated.id ? { ...payment, ...updated } : payment
      )
    );
    setSuccess(updated);
    setSelectedId('');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="h-40 animate-pulse border border-slate-200 bg-white" />
          <div className="mt-6 h-80 animate-pulse border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">Rent records</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Payment Centre
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Pay and review rent records connected to your signed Ng&apos;anda
              leases. Amounts come from your lease schedule, not from sample data.
            </p>
          </div>

          <Link
            href="/renter-hub#payments"
            className="w-fit border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Back to Renter Hub
          </Link>
        </div>

        {loadError && (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-800">
              Payment records are temporarily unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={loadPayments}
              className="mt-4 bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {success && (
          <div className="mt-6 border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="font-semibold text-emerald-800">
              Rent payment recorded
            </h2>
            <p className="mt-2 text-sm leading-6 text-emerald-700">
              Ng&apos;anda verified the successful card transaction and marked
              this specific rent record as paid.
            </p>
            {success.transactionId && (
              <p className="mt-2 break-all text-xs text-slate-600">
                Transaction reference: {success.transactionId}
              </p>
            )}
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="mt-4 border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800"
            >
              Close
            </button>
          </div>
        )}

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-3">
          <div className="border-b border-r border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">Outstanding rent records</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {payablePayments.length}
            </div>
          </div>
          <div className="border-b border-r border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">Outstanding total</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {money(outstandingTotal)}
            </div>
          </div>
          <div className="border-b border-r border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">Recorded payment history</div>
            <div className="mt-2 text-2xl font-bold text-slate-950">
              {history.length}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-950">
                Rent due
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Only rent records generated from a real signed lease can be paid
                here.
              </p>
            </div>

            {payablePayments.length === 0 ? (
              <div className="p-8">
                <h3 className="font-semibold text-slate-950">
                  No rent is currently recorded as due
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  When an active signed lease generates a rent record, it will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {payablePayments.map((payment) => {
                  const property = payment.lease.property;
                  const selectedRow = payment.id === selectedId;
                  const lateFee =
                    Number.isFinite(Number(payment.lateFee)) &&
                    Number(payment.lateFee) > 0
                      ? Number(payment.lateFee)
                      : 0;

                  return (
                    <button
                      key={payment.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(payment.id);
                        setSuccess(null);
                      }}
                      className={`grid w-full gap-4 p-5 text-left transition sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center ${
                        selectedRow ? 'bg-emerald-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">
                            {property.title}
                          </h3>
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold ${statusTone(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {[property.area, property.city]
                            .filter(Boolean)
                            .join(', ') ||
                            property.addressText ||
                            'Property'}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                          <span>Due {formatDate(payment.dueDate)}</span>
                          <span>Rent {money(payment.amount)}</span>
                          {lateFee > 0 && (
                            <span>Recorded late fee {money(lateFee)}</span>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-xl font-bold text-[#0F2B46]">
                          {money(Number(payment.amount) + lateFee)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {selectedRow ? 'Selected for payment' : 'Select'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">
                Online card payment
              </h2>

              {!selected ? (
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Select a real outstanding rent record to continue.
                </p>
              ) : !publishableKey || !stripePromise ? (
                <div className="mt-4 border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-semibold text-amber-800">
                    Online payment is not configured
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    This rent record remains unpaid. Ng&apos;anda will not
                    simulate a payment or create a fake transaction.
                  </p>
                </div>
              ) : selected.status === 'PARTIAL' ? (
                <div className="mt-4 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-700">
                  This is a partial-payment record. The current online flow does
                  not guess the remaining balance. Contact the landlord or
                  administrator for the confirmed balance.
                </div>
              ) : (
                <div className="mt-4">
                  <div className="mb-4 border-b border-slate-100 pb-4">
                    <div className="text-sm font-semibold text-slate-950">
                      {selected.lease.property.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Due {formatDate(selected.dueDate)}
                    </div>
                  </div>

                  <Elements stripe={stripePromise}>
                    <CardPaymentForm
                      payment={selected}
                      onRecorded={handleRecorded}
                    />
                  </Elements>
                </div>
              )}
            </section>

            <section className="border border-blue-200 bg-blue-50 p-5">
              <h2 className="font-semibold text-slate-950">
                Payment integrity
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Amounts are read from signed lease rent records. The page cannot
                invent an amount, card, receipt, transaction reference or paid
                status.
              </p>
            </section>
          </aside>
        </div>

        <section className="mt-6 border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">
              Rent payment history
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Recorded rent-payment events from your lease schedule.
            </p>
          </div>

          {history.length === 0 ? (
            <div className="p-8 text-sm text-slate-500">
              No completed, partial or waived rent-payment records yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Property</th>
                    <th className="px-5 py-3 font-semibold">Due</th>
                    <th className="px-5 py-3 font-semibold">Rent</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Recorded paid date</th>
                    <th className="px-5 py-3 font-semibold">Method / reference</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {history.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-5 py-4">
                        <Link
                          href={'/property/' + payment.lease.property.id}
                          className="font-semibold text-slate-950 hover:text-[#16A34A]"
                        >
                          {payment.lease.property.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(payment.dueDate)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-950">
                        {money(payment.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold ${statusTone(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {payment.paidDate
                          ? formatDate(payment.paidDate)
                          : 'Not recorded'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{payment.paymentMethod || 'Not recorded'}</div>
                        {payment.transactionId && (
                          <div className="mt-1 max-w-[240px] truncate text-xs text-slate-400">
                            {payment.transactionId}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
