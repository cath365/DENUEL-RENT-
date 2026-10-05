'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import { csrfFetch } from '../../../lib/csrf';

type LeaseFilter =
  | 'ALL'
  | 'DRAFT'
  | 'PENDING_SIGNATURES'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'TERMINATED';

type Lease = {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  content: string;
  monthlyRent: number;
  deposit?: number | null;
  startDate: string;
  endDate: string;
  terms?: any;
  landlordSigned: boolean;
  landlordSignedAt?: string | null;
  tenantSigned: boolean;
  tenantSignedAt?: string | null;
  status: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    addressText?: string | null;
    city: string;
    area?: string | null;
  };
  landlord: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
  };
  tenant: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
  };
  rentPayments: Array<{
    id: string;
    amount: number;
    dueDate: string;
    status: string;
    paidDate?: string | null;
  }>;
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

function statusClass(status: string) {
  if (status === 'ACTIVE')
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'DRAFT')
    return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'PENDING_SIGNATURES')
    return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'EXPIRED')
    return 'border-slate-200 bg-slate-50 text-slate-600';
  if (status === 'TERMINATED')
    return 'border-red-200 bg-red-50 text-red-800';
  return 'border-slate-200 bg-white text-slate-600';
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

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LeaseFilter>('ALL');
  const [selected, setSelected] = useState<Lease | null>(null);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadLeases(selectedId?: string) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/landlord/leases?role=landlord', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        window.location.href =
          '/auth/login?redirect=/landlord/leases&reason=session';
        return;
      }

      if (res.status === 403) {
        window.location.href = '/dashboard';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load leases.');
      }

      const next = Array.isArray(data) ? data : [];
      setLeases(next);

      const id = selectedId || selected?.id;
      if (id) {
        setSelected(next.find((lease: Lease) => lease.id === id) || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load leases.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeases();
  }, []);

  const counts = useMemo(
    () => ({
      ALL: leases.length,
      DRAFT: leases.filter((lease) => lease.status === 'DRAFT').length,
      ACTIVE: leases.filter((lease) => lease.status === 'ACTIVE').length,
      PENDING_SIGNATURES: leases.filter(
        (lease) => lease.status === 'PENDING_SIGNATURES'
      ).length,
      EXPIRED: leases.filter((lease) => lease.status === 'EXPIRED').length,
      TERMINATED: leases.filter((lease) => lease.status === 'TERMINATED')
        .length,
    }),
    [leases]
  );

  const visible = useMemo(
    () =>
      filter === 'ALL'
        ? leases
        : leases.filter((lease) => lease.status === filter),
    [filter, leases]
  );

  async function leaseAction(
    leaseId: string,
    action: 'sign' | 'submit_for_signatures' | 'terminate'
  ) {
    if (
      action === 'terminate' &&
      !window.confirm(
        'Terminate this lease? This changes the lease status but does not automatically delete or invent rent-payment records.'
      )
    ) {
      return;
    }

    setProcessing(action);
    setError('');
    setNotice('');

    try {
      const res = await csrfFetch('/api/landlord/leases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId, action }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        window.location.href =
          '/auth/login?redirect=/landlord/leases&reason=session';
        return;
      }

      if (!res.ok) {
        const validation = Array.isArray(data?.error)
          ? data.error
              .map((item: any) => item.message)
              .filter(Boolean)
              .join(' ')
          : data?.error;
        throw new Error(validation || text || 'Unable to update lease.');
      }

      setNotice(
        action === 'sign'
          ? data?.lease?.status === 'ACTIVE'
            ? 'Lease signed and activated because both parties have now signed.'
            : 'Landlord signature recorded.'
          : action === 'submit_for_signatures'
            ? 'Lease sent for signatures.'
            : 'Lease terminated.'
      );

      await loadLeases(leaseId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update lease.'
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
              Leases
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Review real lease terms, signing progress, rent schedules and agreement status. Lease activation happens only when both parties have signed.
            </p>
          </div>

          <Link
            href="/landlord/payments"
            className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Rent payments
          </Link>
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

        <section className="mt-6 flex flex-wrap gap-2">
          {([
            ['ALL', 'All'],
            ['ACTIVE', 'Active'],
            ['PENDING_SIGNATURES', 'Awaiting signatures'],
            ['DRAFT', 'Draft'],
            ['EXPIRED', 'Expired'],
            ['TERMINATED', 'Terminated'],
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

        <section className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-44 animate-pulse border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : visible.length ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {visible.map((lease) => (
                <button
                  key={lease.id}
                  type="button"
                  onClick={() => {
                    setSelected(lease);
                    setError('');
                    setNotice('');
                  }}
                  className="border border-slate-200 bg-white p-5 text-left transition hover:border-slate-400"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">
                        {lease.property?.title || 'Property'}
                      </h2>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        Tenant:{' '}
                        {lease.tenant?.name ||
                          lease.tenant?.email ||
                          'Not recorded'}
                      </p>
                    </div>

                    <span
                      className={
                        'shrink-0 border px-2.5 py-1 text-xs font-semibold ' +
                        statusClass(lease.status)
                      }
                    >
                      {humanize(lease.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-400">Monthly rent</div>
                      <div className="mt-1 font-semibold">
                        {money(lease.monthlyRent)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Deposit</div>
                      <div className="mt-1 font-semibold">
                        {lease.deposit != null
                          ? money(lease.deposit)
                          : 'Not recorded'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Starts</div>
                      <div className="mt-1 font-medium">
                        {new Date(lease.startDate).toLocaleDateString('en-ZM')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Ends</div>
                      <div className="mt-1 font-medium">
                        {new Date(lease.endDate).toLocaleDateString('en-ZM')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <div className="border border-slate-200 p-3">
                      <div className="text-xs text-slate-400">
                        Landlord signature
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {lease.landlordSigned
                          ? 'Signed'
                          : 'Awaiting signature'}
                      </div>
                    </div>
                    <div className="border border-slate-200 p-3">
                      <div className="text-xs text-slate-400">
                        Tenant signature
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {lease.tenantSigned ? 'Signed' : 'Awaiting signature'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs font-semibold text-blue-700">
                    Review lease →
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="border border-slate-200 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold">
                {leases.length
                  ? 'No leases in this status'
                  : 'No lease agreements recorded yet'}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {leases.length
                  ? 'Choose another status above to review the rest of your lease agreements.'
                  : 'Lease agreements appear here only after a real lease record has been created.'}
              </p>
            </div>
          )}
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[80] bg-black/50 p-0 sm:p-4">
          <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">
                    {selected.property.title}
                  </h2>
                  <span
                    className={
                      'border px-2 py-1 text-xs font-semibold ' +
                      statusClass(selected.status)
                    }
                  >
                    {humanize(selected.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {[
                    selected.property.addressText,
                    selected.property.area,
                    selected.property.city,
                  ]
                    .filter(Boolean)
                    .join(', ')}
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
                  <div className="text-xs text-slate-400">Tenant</div>
                  <div className="mt-1 font-semibold">
                    {selected.tenant.name || selected.tenant.email}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {selected.tenant.email}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Monthly rent</div>
                  <div className="mt-1 font-semibold">
                    {money(selected.monthlyRent)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Deposit</div>
                  <div className="mt-1 font-semibold">
                    {selected.deposit != null
                      ? money(selected.deposit)
                      : 'Not recorded'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Lease term</div>
                  <div className="mt-1 font-semibold">
                    {new Date(selected.startDate).toLocaleDateString('en-ZM')}
                    {' – '}
                    {new Date(selected.endDate).toLocaleDateString('en-ZM')}
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold">Signatures</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="border border-slate-200 p-4">
                    <div className="text-xs text-slate-400">Landlord</div>
                    <div className="mt-1 font-semibold">
                      {selected.landlordSigned ? 'Signed' : 'Not signed'}
                    </div>
                    {selected.landlordSignedAt && (
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(
                          selected.landlordSignedAt
                        ).toLocaleString('en-ZM')}
                      </div>
                    )}
                  </div>
                  <div className="border border-slate-200 p-4">
                    <div className="text-xs text-slate-400">Tenant</div>
                    <div className="mt-1 font-semibold">
                      {selected.tenantSigned ? 'Signed' : 'Not signed'}
                    </div>
                    {selected.tenantSignedAt && (
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(
                          selected.tenantSignedAt
                        ).toLocaleString('en-ZM')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selected.status === 'DRAFT' && (
                    <button
                      type="button"
                      disabled={processing === 'submit_for_signatures'}
                      onClick={() =>
                        leaseAction(
                          selected.id,
                          'submit_for_signatures'
                        )
                      }
                      className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                      {processing === 'submit_for_signatures'
                        ? 'Sending…'
                        : 'Send for signatures'}
                    </button>
                  )}

                  {!selected.landlordSigned &&
                    ['DRAFT', 'PENDING_SIGNATURES'].includes(
                      selected.status
                    ) && (
                      <button
                        type="button"
                        disabled={processing === 'sign'}
                        onClick={() => leaseAction(selected.id, 'sign')}
                        className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {processing === 'sign'
                          ? 'Signing…'
                          : 'Sign as landlord'}
                      </button>
                    )}
                </div>
              </section>

              <section className="border-t border-slate-200 pt-6">
                <h3 className="font-semibold">Lease content</h3>
                {selected.content ? (
                  <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {selected.content}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    No lease document content is stored for this record.
                  </p>
                )}
              </section>

              {Array.isArray(selected.rentPayments) &&
                selected.rentPayments.length > 0 && (
                  <section className="border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">
                          Recent rent schedule
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Latest recorded payment schedule entries.
                        </p>
                      </div>
                      <Link
                        href="/landlord/payments"
                        className="text-sm font-semibold text-blue-700"
                      >
                        Manage payments
                      </Link>
                    </div>

                    <div className="mt-4 divide-y divide-slate-100 border border-slate-200">
                      {selected.rentPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between gap-4 p-4 text-sm"
                        >
                          <div>
                            <div className="font-semibold">
                              {new Date(
                                payment.dueDate
                              ).toLocaleDateString('en-ZM')}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {humanize(payment.status)}
                            </div>
                          </div>
                          <div className="font-semibold">
                            {money(payment.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {['PENDING_SIGNATURES', 'ACTIVE'].includes(
                selected.status
              ) && (
                <section className="border-t border-slate-200 pt-6">
                  <h3 className="font-semibold text-red-900">
                    Terminate lease
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Termination changes the lease status only. Existing
                    payment records are not silently deleted or rewritten.
                  </p>
                  <button
                    type="button"
                    disabled={processing === 'terminate'}
                    onClick={() => leaseAction(selected.id, 'terminate')}
                    className="mt-4 border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    {processing === 'terminate'
                      ? 'Terminating…'
                      : 'Terminate lease'}
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
