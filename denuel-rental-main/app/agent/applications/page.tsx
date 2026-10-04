'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

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

function money(value: unknown) {
  return 'K' + Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function tone(status?: string) {
  if (status === 'APPROVED' || status === 'ACTIVE') {
    return 'bg-emerald-50 text-emerald-700';
  }
  if (
    status === 'REJECTED' ||
    status === 'TERMINATED' ||
    status === 'EXPIRED'
  ) {
    return 'bg-red-50 text-red-700';
  }
  return 'bg-amber-50 text-amber-700';
}

export default function AgentApplicationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [busyId, setBusyId] = useState('');
  const [leaseApplicationId, setLeaseApplicationId] = useState('');
  const [leaseForm, setLeaseForm] = useState({
    monthlyRent: '',
    deposit: '',
    startDate: '',
    endDate: '',
    content: '',
  });

  async function load() {
    setLoading(true);
    setError('');

    try {
      const [applicationsResponse, leasesResponse] = await Promise.all([
        fetch('/api/applications?role=landlord'),
        fetch('/api/landlord/leases?role=landlord'),
      ]);

      if (
        applicationsResponse.status === 401 ||
        leasesResponse.status === 401
      ) {
        window.location.href =
          '/auth/login?redirect=/agent/applications';
        return;
      }

      const [applicationData, leaseData] = await Promise.all([
        applicationsResponse.json().catch(() => ({})),
        leasesResponse.json().catch(() => ({})),
      ]);

      if (!applicationsResponse.ok) {
        throw new Error(
          applicationData.error || 'Unable to load applications.'
        );
      }

      if (!leasesResponse.ok) {
        throw new Error(
          leaseData.error || 'Unable to load lease records.'
        );
      }

      setItems(
        Array.isArray(applicationData) ? applicationData : []
      );
      setLeases(Array.isArray(leaseData) ? leaseData : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load applications.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      filter === 'ALL'
        ? items
        : items.filter((item) => item.status === filter),
    [items, filter]
  );

  const leaseByApplication = useMemo(() => {
    const map = new Map<string, any>();

    for (const application of items) {
      const lease = leases.find(
        (item) =>
          item.propertyId === application.propertyId &&
          item.tenantId === application.userId
      );

      if (lease) map.set(application.id, lease);
    }

    return map;
  }, [items, leases]);

  async function decide(
    id: string,
    status: 'APPROVED' | 'REJECTED'
  ) {
    if (
      !window.confirm(
        status === 'APPROVED'
          ? 'Approve this application? No lease or payment will be created automatically.'
          : 'Reject this application?'
      )
    ) {
      return;
    }

    setBusyId(id);
    setError('');
    setSuccess('');

    try {
      const response = await csrfFetch('/api/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          status,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.application) {
        throw new Error(
          data.error || 'Unable to update this application.'
        );
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id ? data.application : item
        )
      );

      setSuccess(
        status === 'APPROVED'
          ? 'Application approved. Create a lease only after the tenancy terms are agreed.'
          : 'Application rejected.'
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Unable to update this application.'
      );
    } finally {
      setBusyId('');
    }
  }

  function openLeaseForm(application: any) {
    setLeaseApplicationId(application.id);
    setError('');
    setSuccess('');
    setLeaseForm({
      monthlyRent:
        application.property?.price == null
          ? ''
          : String(application.property.price),
      deposit:
        application.property?.deposit == null
          ? ''
          : String(application.property.deposit),
      startDate: '',
      endDate: '',
      content: '',
    });
  }

  async function createLease(
    event: React.FormEvent,
    application: any
  ) {
    event.preventDefault();

    const monthlyRent = Number(leaseForm.monthlyRent);
    const deposit =
      leaseForm.deposit.trim() === ''
        ? null
        : Number(leaseForm.deposit);
    const startDate = leaseForm.startDate
      ? new Date(leaseForm.startDate)
      : null;
    const endDate = leaseForm.endDate
      ? new Date(leaseForm.endDate)
      : null;

    if (
      !Number.isFinite(monthlyRent) ||
      monthlyRent <= 0 ||
      (deposit !== null &&
        (!Number.isFinite(deposit) || deposit < 0)) ||
      !startDate ||
      !endDate ||
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate >= endDate ||
      !leaseForm.content.trim()
    ) {
      setError(
        'Enter the agreed rent, valid lease dates and the actual lease agreement text.'
      );
      return;
    }

    if (
      !window.confirm(
        'Create this lease using the agreement text and amounts you entered? It will be created as PENDING_SIGNATURES.'
      )
    ) {
      return;
    }

    setBusyId(application.id);
    setError('');
    setSuccess('');

    try {
      const response = await csrfFetch(
        '/api/landlord/leases',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: application.propertyId,
            tenantId: application.userId,
            monthlyRent,
            deposit,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            content: leaseForm.content.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.id) {
        throw new Error(
          data.error || 'Unable to create this lease.'
        );
      }

      setLeases((current) => [data, ...current]);
      setLeaseApplicationId('');
      setLeaseForm({
        monthlyRent: '',
        deposit: '',
        startDate: '',
        endDate: '',
        content: '',
      });
      setSuccess(
        'Lease created and waiting for signatures. No rent schedule is generated until both parties sign.'
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Unable to create this lease.'
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
              Tenant journey
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Rental applications
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review real rental applications. After approval, you can
              create a lease from the actual terms agreed with the
              applicant. Ng&apos;anda does not generate legal lease
              clauses automatically.
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
            ['All applications', items.length],
            [
              'Pending',
              items.filter((item) => item.status === 'PENDING')
                .length,
            ],
            [
              'Approved',
              items.filter(
                (item) => item.status === 'APPROVED'
              ).length,
            ],
            ['Leases created', leaseByApplication.size],
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

        <div className="mt-6 flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`border px-3 py-2 text-sm font-semibold ${
                  filter === status
                    ? 'border-[#0F2B46] bg-[#0F2B46] text-white'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>

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
          <div className="mt-6 h-72 animate-pulse border border-slate-200 bg-white" />
        ) : filtered.length === 0 ? (
          <div className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No applications in this status.
          </div>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((item) => {
              const existingLease =
                leaseByApplication.get(item.id);
              const formOpen =
                leaseApplicationId === item.id;

              return (
                <article key={item.id} className="p-5">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-950">
                          {item.user?.name ||
                            item.user?.email ||
                            'Applicant'}
                        </h2>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold ${tone(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <Link
                        href={'/property/' + item.property.id}
                        className="mt-2 block text-sm font-medium text-[#0F2B46] hover:text-[#16A34A]"
                      >
                        {item.property?.title}
                      </Link>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                        <span>
                          Applied {formatDate(item.appliedAt)}
                        </span>
                        {item.property?.price != null && (
                          <span>
                            Listed rent{' '}
                            {money(item.property.price)} / month
                          </span>
                        )}
                        {item.property?.deposit != null && (
                          <span>
                            Listed deposit{' '}
                            {money(item.property.deposit)}
                          </span>
                        )}
                        {item.user?.phone && (
                          <span>{item.user.phone}</span>
                        )}
                        {item.user?.email && (
                          <span>{item.user.email}</span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                        {item.user?.isIdVerified && (
                          <span className="bg-emerald-50 px-2 py-1 text-emerald-700">
                            ID verified
                          </span>
                        )}
                        {item.user?.isPhoneVerified && (
                          <span className="bg-emerald-50 px-2 py-1 text-emerald-700">
                            Phone verified
                          </span>
                        )}
                        {item.user?.isEmailVerified && (
                          <span className="bg-emerald-50 px-2 py-1 text-emerald-700">
                            Email verified
                          </span>
                        )}
                      </div>
                    </div>

                    {item.status === 'PENDING' ? (
                      <div className="grid gap-2">
                        <button
                          disabled={busyId === item.id}
                          onClick={() =>
                            decide(item.id, 'APPROVED')
                          }
                          className="bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Approve application
                        </button>
                        <button
                          disabled={busyId === item.id}
                          onClick={() =>
                            decide(item.id, 'REJECTED')
                          }
                          className="border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                        >
                          Reject application
                        </button>
                      </div>
                    ) : item.status === 'APPROVED' ? (
                      existingLease ? (
                        <div className="border border-slate-200 bg-slate-50 p-3">
                          <div className="text-xs text-slate-500">
                            Lease
                          </div>
                          <div className="mt-1 font-semibold text-slate-950">
                            {existingLease.status}
                          </div>
                          <Link
                            href="/agent/leases"
                            className="mt-3 inline-flex text-sm font-semibold text-[#16A34A]"
                          >
                            Open lease management →
                          </Link>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            formOpen
                              ? setLeaseApplicationId('')
                              : openLeaseForm(item)
                          }
                          className="bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          {formOpen
                            ? 'Close lease form'
                            : 'Create lease'}
                        </button>
                      )
                    ) : (
                      <div className="text-sm leading-6 text-slate-500">
                        Decision recorded. No lease or payment was
                        created automatically.
                      </div>
                    )}
                  </div>

                  {item.status === 'APPROVED' &&
                    !existingLease &&
                    formOpen && (
                      <form
                        onSubmit={(event) =>
                          createLease(event, item)
                        }
                        className="mt-5 border-t border-slate-200 pt-5"
                      >
                        <div className="max-w-4xl">
                          <h3 className="font-bold text-slate-950">
                            Create lease from agreed terms
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            The applicant has been approved, but a
                            tenancy does not exist yet. Enter the
                            actual terms agreed by the parties. The
                            lease will remain pending until both
                            parties sign.
                          </p>

                          <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Agreed monthly rent (ZMW)
                              </label>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                required
                                value={leaseForm.monthlyRent}
                                onChange={(event) =>
                                  setLeaseForm({
                                    ...leaseForm,
                                    monthlyRent:
                                      event.target.value,
                                  })
                                }
                                className="h-11 w-full border border-slate-300 px-3 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Agreed deposit (ZMW)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={leaseForm.deposit}
                                onChange={(event) =>
                                  setLeaseForm({
                                    ...leaseForm,
                                    deposit:
                                      event.target.value,
                                  })
                                }
                                className="h-11 w-full border border-slate-300 px-3 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Start date
                              </label>
                              <input
                                type="date"
                                required
                                value={leaseForm.startDate}
                                onChange={(event) =>
                                  setLeaseForm({
                                    ...leaseForm,
                                    startDate:
                                      event.target.value,
                                  })
                                }
                                className="h-11 w-full border border-slate-300 px-3 text-sm"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                End date
                              </label>
                              <input
                                type="date"
                                required
                                value={leaseForm.endDate}
                                onChange={(event) =>
                                  setLeaseForm({
                                    ...leaseForm,
                                    endDate:
                                      event.target.value,
                                  })
                                }
                                className="h-11 w-full border border-slate-300 px-3 text-sm"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Actual lease agreement text
                              </label>
                              <textarea
                                required
                                rows={10}
                                value={leaseForm.content}
                                onChange={(event) =>
                                  setLeaseForm({
                                    ...leaseForm,
                                    content:
                                      event.target.value,
                                  })
                                }
                                placeholder="Paste or enter the actual lease agreement agreed by the parties. Ng'anda does not generate legal terms here."
                                className="w-full border border-slate-300 p-3 text-sm leading-6"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={busyId === item.id}
                            className="mt-5 bg-[#16A34A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {busyId === item.id
                              ? 'Creating lease…'
                              : 'Create pending-signatures lease'}
                          </button>
                        </div>
                      </form>
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
