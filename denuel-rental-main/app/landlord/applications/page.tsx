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

function statusTone(status?: string) {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700';
  return 'bg-amber-50 text-amber-700';
}

export default function LandlordApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/applications?role=landlord');

      if (response.status === 401) {
        window.location.href =
          '/auth/login?redirect=/landlord/applications';
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to load rental applications.'
        );
      }

      setApplications(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load rental applications.'
      );
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter(
        (application) => application.status === 'PENDING'
      ).length,
      approved: applications.filter(
        (application) => application.status === 'APPROVED'
      ).length,
      rejected: applications.filter(
        (application) => application.status === 'REJECTED'
      ).length,
    }),
    [applications]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return applications.filter((application) => {
      if (
        statusFilter !== 'ALL' &&
        application.status !== statusFilter
      ) {
        return false;
      }

      if (!needle) return true;

      return [
        application.user?.name,
        application.user?.email,
        application.user?.phone,
        application.property?.title,
        application.property?.city,
        application.property?.area,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(needle)
        );
    });
  }, [applications, query, statusFilter]);

  async function decide(
    application: any,
    status: 'APPROVED' | 'REJECTED'
  ) {
    const action =
      status === 'APPROVED' ? 'approve' : 'reject';

    if (
      !window.confirm(
        status === 'APPROVED'
          ? 'Approve this rental application? This does not create a lease automatically.'
          : 'Reject this rental application?'
      )
    ) {
      return;
    }

    setBusyId(application.id);
    setError('');

    try {
      const response = await csrfFetch('/api/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          status,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.application) {
        throw new Error(
          data.error || `Unable to ${action} this application.`
        );
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? data.application
            : item
        )
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : `Unable to ${action} this application.`
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
              href="/landlord"
              className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]"
            >
              ← Landlord dashboard
            </Link>
            <div className="mt-4 text-sm font-semibold text-[#16A34A]">
              Tenant selection
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Rental applications
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review applications submitted to properties you actually manage.
              Approving an application does not create a lease or charge the renter.
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
            ['All applications', stats.total],
            ['Pending', stats.pending],
            ['Approved', stats.approved],
            ['Rejected', stats.rejected],
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

        <section className="mt-6 grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search applicant, property or location"
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
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </section>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-80 animate-pulse border border-slate-200 bg-white" />
        ) : applications.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">
              No rental applications yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Applications will appear here only after a renter applies to one
              of your approved rental properties.
            </p>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No applications match the current filters.
          </section>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((application) => {
              const applicant = application.user || {};
              const property = application.property || {};
              const image = property.images?.[0]?.url;
              const pending = application.status === 'PENDING';

              return (
                <article
                  key={application.id}
                  className="grid gap-5 p-5 lg:grid-cols-[120px_minmax(0,1fr)_250px] lg:items-center"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={property.title || ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">
                        {applicant.name || applicant.email || 'Applicant'}
                      </h2>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold ${statusTone(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                    </div>

                    <Link
                      href={'/property/' + property.id}
                      className="mt-2 block text-sm font-medium text-[#0F2B46] hover:text-[#16A34A]"
                    >
                      {property.title || 'Property'}
                    </Link>

                    <p className="mt-1 text-sm text-slate-500">
                      {[property.area, property.city]
                        .filter(Boolean)
                        .join(', ')}
                      {property.price != null
                        ? ' · ' + money(property.price) + ' / month'
                        : ''}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                      {applicant.isIdVerified && (
                        <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                          ID verified
                        </span>
                      )}
                      {applicant.isPhoneVerified && (
                        <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                          Phone verified
                        </span>
                      )}
                      {applicant.isEmailVerified && (
                        <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
                          Email verified
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span>Applied {formatDate(application.appliedAt)}</span>
                      {applicant.phone && <span>{applicant.phone}</span>}
                      {applicant.email && <span>{applicant.email}</span>}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {pending ? (
                      <>
                        <button
                          type="button"
                          disabled={busyId === application.id}
                          onClick={() =>
                            decide(application, 'APPROVED')
                          }
                          className="bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {busyId === application.id
                            ? 'Saving…'
                            : 'Approve application'}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === application.id}
                          onClick={() =>
                            decide(application, 'REJECTED')
                          }
                          className="border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                        >
                          Reject application
                        </button>
                      </>
                    ) : (
                      <div className="border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                        Decision recorded. No lease or payment was created automatically.
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
