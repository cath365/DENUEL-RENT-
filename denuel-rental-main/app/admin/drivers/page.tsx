'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';
import { csrfFetch } from '../../../lib/csrf';

type VerificationDoc = {
  id: string;
  documentType: string;
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  reviewNotes?: string | null;
  submittedAt: string;
  metadata?: string | null;
};

type Driver = {
  id: string;
  userId: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
    profileImage?: string | null;
    nrcNumberSupplied: boolean;
  };
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleColor?: string | null;
  vehicleCapacityKg?: number | null;
  serviceAreas?: string[] | null;
  experience?: string | null;
  bio?: string | null;
  isApproved: boolean;
  isOnline: boolean;
  isSuspended: boolean;
  ratingAvg: number;
  ratingCount: number;
  totalTrips: number;
  documents: VerificationDoc[];
  requiredApproved: number;
  requiredCount: number;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  createdAt: string;
};

const REQUIRED_LABELS: Record<string, string> = {
  NRC: 'NRC / National ID',
  LICENSE: "Driver's licence",
  CERTIFICATE: 'Vehicle registration / Blue Book',
  INSURANCE: 'Vehicle insurance',
  BACKGROUND_CHECK: 'Police clearance / background check',
};

function vehicleLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SUSPENDED'>('PENDING');
  const [query, setQuery] = useState('');
  const [processing, setProcessing] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  async function fetchDrivers() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/transport/drivers');
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to load driver applications.');
      setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load driver applications.');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drivers.filter((driver) => {
      if (filter !== 'ALL' && driver.status !== filter) return false;
      if (!q) return true;

      return [
        driver.user.name || '',
        driver.user.email,
        driver.user.phone || '',
        driver.vehiclePlate,
        driver.vehicleMake || '',
        driver.vehicleModel || '',
        driver.vehicleType,
      ].some((value) => value.toLowerCase().includes(q));
    });
  }, [drivers, filter, query]);

  const stats = useMemo(
    () => ({
      total: drivers.length,
      pending: drivers.filter((driver) => driver.status === 'PENDING').length,
      approved: drivers.filter((driver) => driver.status === 'APPROVED').length,
      suspended: drivers.filter((driver) => driver.status === 'SUSPENDED').length,
    }),
    [drivers]
  );

  function updateDriver(driverId: string, patch: Partial<Driver>) {
    setDrivers((current) =>
      current.map((driver) => (driver.id === driverId ? { ...driver, ...patch } : driver))
    );
    setSelected((current) =>
      current?.id === driverId ? ({ ...current, ...patch } as Driver) : current
    );
  }

  async function reviewDocument(document: VerificationDoc, status: 'APPROVED' | 'REJECTED') {
    if (!selected) return;

    setProcessing(document.id);
    setError('');

    try {
      const response = await csrfFetch('/api/admin/verifications', {
        method: 'PATCH',
        body: JSON.stringify({
          documentId: document.id,
          status,
          reviewNotes: reviewNotes[document.id] || '',
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to review the document.');

      const documents = selected.documents.map((item) =>
        item.id === document.id
          ? { ...item, status, reviewNotes: reviewNotes[document.id] || null }
          : item
      );

      const requiredApproved = Object.keys(REQUIRED_LABELS).filter((type) =>
        documents.some((doc) => doc.documentType === type && doc.status === 'APPROVED')
      ).length;

      const updated = { ...selected, documents, requiredApproved };
      setSelected(updated);
      setDrivers((current) =>
        current.map((driver) => (driver.id === selected.id ? updated : driver))
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to review the document.');
    } finally {
      setProcessing('');
    }
  }

  async function driverAction(action: 'approve' | 'suspend' | 'activate') {
    if (!selected) return;
    setProcessing(action);
    setError('');

    try {
      const response = await fetch('/api/admin/transport/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selected.id, action }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const missing = Array.isArray(data.missing) ? ' Missing: ' + data.missing.join(', ') : '';
        throw new Error((data.error || 'Unable to update driver.') + missing);
      }

      const nextStatus = data.status as Driver['status'];
      updateDriver(selected.id, {
        status: nextStatus,
        isApproved: nextStatus === 'APPROVED' ? true : selected.isApproved,
        isSuspended: nextStatus === 'SUSPENDED',
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to update driver.');
    } finally {
      setProcessing('');
    }
  }

  const canApprove =
    selected?.requiredApproved === selected?.requiredCount && selected?.requiredCount > 0;

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">Admin · Transport trust & safety</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-[#0F2B46]">
              Driver verification
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review driver identity, vehicle details and verification documents before allowing a driver to receive transport requests.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
              Admin home
            </Link>
            <Link href="/transport" className="bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white">
              Transport page
            </Link>
          </div>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['All drivers', stats.total],
            ['Pending', stats.pending],
            ['Approved', stats.approved],
            ['Suspended', stats.suspended],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-slate-200 bg-white p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-[#0F2B46]">{value}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-slate-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search driver, email, phone, plate or vehicle"
              className="h-11 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
            />
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'PENDING', 'APPROVED', 'SUSPENDED'] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`border px-3 py-2 text-sm font-semibold ${
                    filter === item
                      ? 'border-[#0F2B46] bg-[#0F2B46] text-white'
                      : 'border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  {item.charAt(0) + item.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          {loading ? (
            <div className="p-10 text-sm text-slate-500">Loading driver applications…</div>
          ) : visible.length === 0 ? (
            <div className="p-10">
              <h2 className="text-lg font-semibold text-[#0F2B46]">No drivers found</h2>
              <p className="mt-2 text-sm text-slate-500">
                There are no real driver applications matching this filter yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visible.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => {
                    setSelected(driver);
                    setError('');
                  }}
                  className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.4fr)_170px_180px_130px] md:items-center"
                >
                  <div>
                    <div className="font-semibold text-slate-950">{driver.user.name || 'Unnamed driver'}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {driver.user.email} · {driver.user.phone || 'No phone'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{vehicleLabel(driver.vehicleType)}</div>
                    <div className="mt-1 text-xs text-slate-400">{driver.vehiclePlate}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {driver.requiredApproved}/{driver.requiredCount} documents approved
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {driver.documents.length} uploaded
                    </div>
                  </div>
                  <div>
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-semibold ${
                        driver.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : driver.status === 'SUSPENDED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {driver.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[90] bg-black/50 p-0 sm:p-4">
          <div className="ml-auto h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
              <div>
                <h2 className="text-xl font-bold text-[#0F2B46]">{selected.user.name || 'Driver application'}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {vehicleLabel(selected.vehicleType)} · {selected.vehiclePlate}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-500">
                Close
              </button>
            </div>

            <div className="space-y-7 p-5 sm:p-7">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Driver & vehicle</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><div className="text-xs text-slate-400">Name</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.user.name || 'Not provided'}</div></div>
                  <div><div className="text-xs text-slate-400">Phone</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.user.phone || 'Not provided'}</div></div>
                  <div><div className="text-xs text-slate-400">NRC</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.user.nrcNumberSupplied ? 'Supplied' : 'Not supplied'}</div></div>
                  <div><div className="text-xs text-slate-400">Driver licence</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.licenseNumber}</div></div>
                  <div><div className="text-xs text-slate-400">Vehicle</div><div className="mt-1 text-sm font-semibold text-slate-900">{[selected.vehicleMake, selected.vehicleModel].filter(Boolean).join(' ') || vehicleLabel(selected.vehicleType)}</div></div>
                  <div><div className="text-xs text-slate-400">Year / colour</div><div className="mt-1 text-sm font-semibold text-slate-900">{[selected.vehicleYear, selected.vehicleColor].filter(Boolean).join(' · ') || 'Not provided'}</div></div>
                  <div><div className="text-xs text-slate-400">Plate</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.vehiclePlate}</div></div>
                  <div><div className="text-xs text-slate-400">Experience</div><div className="mt-1 text-sm font-semibold text-slate-900">{selected.experience || 'Not provided'}</div></div>
                </div>

                {Array.isArray(selected.serviceAreas) && selected.serviceAreas.length > 0 && (
                  <div className="mt-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Service areas</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.serviceAreas.map((area) => (
                        <span key={area} className="border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600">{area}</span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-[#0F2B46]">Required verification documents</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Every required document must be approved before the driver can be activated.
                </p>

                <div className="mt-4 divide-y divide-slate-100 border border-slate-200">
                  {Object.entries(REQUIRED_LABELS).map(([type, label]) => {
                    const document = selected.documents.find((doc) => doc.documentType === type);

                    return (
                      <div key={type} className="p-4">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{label}</div>
                            <div className="mt-1 text-xs text-slate-500">
                              {document
                                ? new Date(document.submittedAt).toLocaleDateString('en-ZM')
                                : 'Not uploaded'}
                            </div>
                          </div>

                          {document ? (
                            <div className="flex flex-wrap gap-2">
                              <a
                                href={document.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                              >
                                View document
                              </a>
                              <span
                                className={`px-3 py-2 text-xs font-semibold ${
                                  document.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : document.status === 'REJECTED'
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {document.status}
                              </span>
                            </div>
                          ) : (
                            <span className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Missing</span>
                          )}
                        </div>

                        {document && document.status !== 'APPROVED' && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                            <input
                              value={reviewNotes[document.id] || ''}
                              onChange={(e) =>
                                setReviewNotes((current) => ({ ...current, [document.id]: e.target.value }))
                              }
                              placeholder="Review notes (required when rejecting)"
                              className="h-10 border border-slate-300 px-3 text-xs outline-none focus:border-[#16A34A]"
                            />
                            <button
                              disabled={processing === document.id}
                              onClick={() => reviewDocument(document, 'APPROVED')}
                              className="bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              disabled={processing === document.id || !(reviewNotes[document.id] || '').trim()}
                              onClick={() => reviewDocument(document, 'REJECTED')}
                              className="border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-[#0F2B46]">Decision</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {canApprove
                    ? 'All required documents are approved. The driver can now be activated.'
                    : 'Approval stays locked until all five required documents are approved.'}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {selected.status === 'PENDING' && (
                    <button
                      disabled={!canApprove || processing === 'approve'}
                      onClick={() => driverAction('approve')}
                      className="bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {processing === 'approve' ? 'Approving…' : 'Approve driver'}
                    </button>
                  )}

                  {selected.status === 'APPROVED' && (
                    <button
                      disabled={processing === 'suspend'}
                      onClick={() => driverAction('suspend')}
                      className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      Suspend driver
                    </button>
                  )}

                  {selected.status === 'SUSPENDED' && (
                    <button
                      disabled={processing === 'activate'}
                      onClick={() => driverAction('activate')}
                      className="bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Reactivate driver
                    </button>
                  )}

                  <Link href="/admin/verifications" className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    All identity verifications
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
