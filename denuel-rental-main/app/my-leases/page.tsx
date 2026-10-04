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
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700';
  if (status === 'EXPIRED' || status === 'TERMINATED') {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-amber-50 text-amber-700';
}

export default function MyLeasesPage() {
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/landlord/leases?role=tenant');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/my-leases';
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load your leases.');
      }

      setLeases(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load your leases.'
      );
      setLeases([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: leases.length,
      waiting: leases.filter(
        (lease) => lease.status === 'PENDING_SIGNATURES'
      ).length,
      active: leases.filter((lease) => lease.status === 'ACTIVE').length,
    }),
    [leases]
  );

  async function signLease(lease: any) {
    if (!accepted[lease.id]) {
      setError(
        'Read the lease and confirm that you agree to the displayed agreement before signing.'
      );
      return;
    }

    if (
      !window.confirm(
        'Confirm your signature on this lease agreement? This records the date and time of your signature.'
      )
    ) {
      return;
    }

    setBusyId(lease.id);
    setError('');
    setSuccess('');

    try {
      const response = await csrfFetch('/api/landlord/leases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaseId: lease.id,
          action: 'sign',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.id) {
        throw new Error(data.error || 'Unable to sign this lease.');
      }

      await load();
      setSuccess(
        data.status === 'ACTIVE'
          ? 'Your signature was recorded. Both parties have now signed, so the lease is active and its rent schedule is available.'
          : 'Your signature was recorded. The lease will remain pending until the property manager also signs.'
      );
    } catch (signError) {
      setError(
        signError instanceof Error
          ? signError.message
          : 'Unable to sign this lease.'
      );
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]"
            >
              ← My property account
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">
              Tenancy agreements
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              My leases
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review the actual agreement supplied for your tenancy. Ng&apos;anda
              records signatures and activates a lease only after both parties sign.
            </p>
          </div>

          <Link
            href="/rent-payment"
            className="w-fit bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Rent payment centre
          </Link>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-3">
          {[
            ['All leases', stats.total],
            ['Waiting for signatures', stats.waiting],
            ['Active leases', stats.active],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="border-b border-r border-slate-200 bg-white p-5"
            >
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">
                {Number(value).toLocaleString()}
              </div>
            </div>
          ))}
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
        ) : leases.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">
              No lease agreements yet
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              A lease will appear here only after your rental application has been
              approved and the property manager creates the agreement.
            </p>
          </section>
        ) : (
          <section className="mt-6 space-y-5">
            {leases.map((lease) => {
              const open = expandedId === lease.id;
              const canSign =
                !lease.tenantSigned &&
                ['DRAFT', 'PENDING_SIGNATURES'].includes(lease.status);

              return (
                <article
                  key={lease.id}
                  className="border border-slate-200 bg-white"
                >
                  <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={'/property/' + lease.property.id}
                          className="text-lg font-semibold text-slate-950 hover:text-[#16A34A]"
                        >
                          {lease.property?.title || 'Property'}
                        </Link>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold ${tone(
                            lease.status
                          )}`}
                        >
                          {lease.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {[lease.property?.area, lease.property?.city]
                          .filter(Boolean)
                          .join(', ') ||
                          lease.property?.addressText ||
                          'Property'}
                      </p>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div>
                          <span className="text-slate-400">Monthly rent:</span>{' '}
                          <strong className="text-slate-900">
                            {money(lease.monthlyRent)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Deposit:</span>{' '}
                          <strong className="text-slate-900">
                            {lease.deposit == null
                              ? 'Not recorded'
                              : money(lease.deposit)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Starts:</span>{' '}
                          {formatDate(lease.startDate)}
                        </div>
                        <div>
                          <span className="text-slate-400">Ends:</span>{' '}
                          {formatDate(lease.endDate)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span
                          className={
                            lease.landlordSigned
                              ? 'bg-emerald-50 px-2 py-1 text-emerald-700'
                              : 'bg-amber-50 px-2 py-1 text-amber-700'
                          }
                        >
                          Property manager signed: {lease.landlordSigned ? 'Yes' : 'No'}
                        </span>
                        <span
                          className={
                            lease.tenantSigned
                              ? 'bg-emerald-50 px-2 py-1 text-emerald-700'
                              : 'bg-amber-50 px-2 py-1 text-amber-700'
                          }
                        >
                          You signed: {lease.tenantSigned ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(open ? '' : lease.id)}
                        className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        {open ? 'Hide agreement' : 'Read agreement'}
                      </button>

                      {lease.status === 'ACTIVE' && (
                        <Link
                          href="/rent-payment"
                          className="bg-[#16A34A] px-4 py-2.5 text-center text-sm font-semibold text-white"
                        >
                          View rent records
                        </Link>
                      )}
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-slate-200 p-5 sm:p-6">
                      <h2 className="font-bold text-slate-950">
                        Lease agreement text
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Read the complete agreement shown below before signing.
                        Ng&apos;anda displays the agreement stored for this lease and
                        does not silently replace its clauses.
                      </p>

                      <div className="mt-4 max-h-[520px] overflow-y-auto whitespace-pre-wrap border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                        {lease.content || 'No agreement text is stored for this lease.'}
                      </div>

                      {canSign && (
                        <div className="mt-5 border border-amber-200 bg-amber-50 p-4">
                          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={Boolean(accepted[lease.id])}
                              onChange={(event) =>
                                setAccepted((current) => ({
                                  ...current,
                                  [lease.id]: event.target.checked,
                                }))
                              }
                            />
                            <span>
                              I have read the displayed lease agreement and I agree
                              to sign this stored version.
                            </span>
                          </label>

                          <button
                            type="button"
                            disabled={
                              busyId === lease.id ||
                              !accepted[lease.id]
                            }
                            onClick={() => signLease(lease)}
                            className="mt-4 bg-[#0F2B46] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {busyId === lease.id
                              ? 'Signing…'
                              : 'Sign lease'}
                          </button>
                        </div>
                      )}

                      {lease.tenantSigned && (
                        <div className="mt-4 text-xs text-slate-500">
                          Your signature was recorded{' '}
                          {lease.tenantSignedAt
                            ? 'on ' + formatDate(lease.tenantSignedAt)
                            : 'for this agreement'}.
                        </div>
                      )}
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
