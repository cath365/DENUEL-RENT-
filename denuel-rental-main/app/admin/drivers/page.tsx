'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';
import { csrfFetch } from '../../../lib/csrf';

type DriverFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'suspended';

type DriverDocument = {
  id: string;
  type: string;
  name: string;
  isVerified: boolean;
  uploadedAt: string;
  fileAccessUrl: string;
  storagePrivate?: boolean;
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
    isSuspended: boolean;
  };
  licenseNumber: string;
  nrcNumber?: string | null;
  vehicleType: string;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleColor?: string | null;
  vehiclePlate: string;
  vehicleCapacityKg?: number | null;
  experience?: string | null;
  bio?: string | null;
  serviceAreas: string[];
  verificationStatus: string;
  rejectionReason?: string | null;
  status: string;
  rating: number;
  ratingCount: number;
  totalTrips: number;
  isOnline: boolean;
  verified: boolean;
  documents: DriverDocument[];
  createdAt: string;
};

const REQUIRED_DOCUMENTS = [
  ['NRC', 'NRC / national identity'],
  ['DRIVER_LICENSE', 'Driver’s licence'],
  ['VEHICLE_REGISTRATION', 'Vehicle registration'],
  ['INSURANCE', 'Vehicle insurance'],
  ['POLICE_CLEARANCE', 'Police clearance'],
] as const;

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  if (status === 'APPROVED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'REJECTED') return 'border-red-200 bg-red-50 text-red-800';
  if (status === 'SUSPENDED') return 'border-slate-300 bg-slate-100 text-slate-700';
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

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DriverFilter>('pending');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Driver | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');

  async function fetchDrivers() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (query.trim()) params.set('q', query.trim());

      const res = await fetch('/api/admin/transport/drivers?' + params.toString(), {
        credentials: 'same-origin',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/admin/drivers&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load drivers.');
      }

      setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 });
    } catch (err) {
      setDrivers([]);
      setError(err instanceof Error ? err.message : 'Unable to load drivers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(fetchDrivers, 200);
    return () => window.clearTimeout(timer);
  }, [filter, query]);

  function updateSelected(next: Driver) {
    setSelected(next);
    setDrivers((current) => current.map((driver) => driver.id === next.id ? next : driver));
  }

  async function verifyDocument(documentId: string) {
    if (!selected) return;
    setProcessing('doc-' + documentId);
    setError('');

    try {
      const res = await csrfFetch(
        '/api/admin/approvals/' + selected.id + '/documents/' + documentId + '/verify',
        { method: 'POST' }
      );
      const { text, data } = await readResponse(res);

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to verify driver document.');
      }

      updateSelected({
        ...selected,
        documents: selected.documents.map((document) =>
          document.id === documentId ? { ...document, isVerified: true } : document
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify driver document.');
    } finally {
      setProcessing('');
    }
  }

  async function approveDriver() {
    if (!selected) return;
    setProcessing('approve');
    setError('');

    try {
      const res = await csrfFetch('/api/admin/approvals/' + selected.id + '/approve', {
        method: 'POST',
      });
      const { text, data } = await readResponse(res);

      if (!res.ok) {
        const missing = Array.isArray(data?.missing) && data.missing.length
          ? ' Missing: ' + data.missing.join(', ')
          : '';
        const unverified = Array.isArray(data?.unverified) && data.unverified.length
          ? ' Unverified: ' + data.unverified.join(', ')
          : '';
        const insecure = Array.isArray(data?.insecure) && data.insecure.length
          ? ' Secure re-upload required: ' + data.insecure.join(', ')
          : '';
        throw new Error((data?.error || text || 'Unable to approve driver.') + missing + unverified + insecure);
      }

      setSelected(null);
      await fetchDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to approve driver.');
    } finally {
      setProcessing('');
    }
  }

  async function rejectDriver() {
    if (!selected || !rejectReason.trim()) return;
    setProcessing('reject');
    setError('');

    try {
      const res = await csrfFetch('/api/admin/approvals/' + selected.id + '/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const { text, data } = await readResponse(res);

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to reject driver.');
      }

      setRejectReason('');
      setSelected(null);
      await fetchDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reject driver.');
    } finally {
      setProcessing('');
    }
  }

  async function updateSuspension(action: 'suspend' | 'activate') {
    if (!selected) return;
    setProcessing(action);
    setError('');

    try {
      const res = await csrfFetch('/api/admin/transport/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: selected.id, action }),
      });
      const { text, data } = await readResponse(res);

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to update driver status.');
      }

      setSelected(null);
      await fetchDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update driver status.');
    } finally {
      setProcessing('');
    }
  }

  const requiredStatus = useMemo(() => {
    if (!selected) return [];
    return REQUIRED_DOCUMENTS.map(([type, label]) => {
      const document = selected.documents.find((item) => item.type === type);
      return { type, label, document };
    });
  }, [selected]);

  const canApprove = requiredStatus.length > 0 && requiredStatus.every(
    ({ document }) => Boolean(document?.isVerified && document.storagePrivate)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">Admin · Transport trust & safety</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Driver management</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review driver identity, vehicle information and private verification documents before transport access is approved.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
              Admin home
            </Link>
            <Link href="/transport" className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              Transport page
            </Link>
          </div>
        </section>

        <section className="mt-7 grid grid-cols-2 border-l border-t border-slate-200 bg-white sm:grid-cols-5">
          {[
            ['Total', stats.total],
            ['Pending', stats.pending],
            ['Approved', stats.approved],
            ['Rejected', stats.rejected],
            ['Suspended', stats.suspended],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold">{Number(value).toLocaleString()}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, licence, plate or vehicle"
              className="h-11 flex-1 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950"
            />
            <div className="flex flex-wrap gap-2">
              {([
                ['all', 'All'],
                ['pending', 'Pending'],
                ['approved', 'Approved'],
                ['rejected', 'Rejected'],
                ['suspended', 'Suspended'],
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
            </div>
          </div>
        </section>

        {error && (
          <section className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        )}

        <section className="mt-6 overflow-hidden border border-slate-200 bg-white">
          {loading ? (
            <div className="p-10 text-sm text-slate-500">Loading drivers…</div>
          ) : drivers.length === 0 ? (
            <div className="p-10">
              <h2 className="text-lg font-semibold">No drivers match these filters</h2>
              <p className="mt-2 text-sm text-slate-500">No demo or placeholder driver records are shown.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {drivers.map((driver) => {
                const secureVerifiedCount = REQUIRED_DOCUMENTS.filter(([type]) =>
                  driver.documents.some(
                    (document) => document.type === type && document.isVerified && document.storagePrivate
                  )
                ).length;

                return (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => {
                      setSelected(driver);
                      setRejectReason('');
                      setError('');
                    }}
                    className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.4fr)_180px_160px_150px] md:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-bold text-slate-500">
                        {driver.user.profileImage ? (
                          <img src={driver.user.profileImage} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (driver.user.name || driver.user.email).slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{driver.user.name || 'Unnamed driver'}</div>
                        <div className="mt-1 truncate text-sm text-slate-500">{driver.user.email}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold">{humanize(driver.vehicleType)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {[driver.vehicleMake, driver.vehicleModel, driver.vehicleYear].filter(Boolean).join(' ') || 'Vehicle details incomplete'}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold">{secureVerifiedCount}/{REQUIRED_DOCUMENTS.length} docs verified</div>
                      <div className="mt-1 text-xs text-slate-500">{driver.totalTrips} recorded trips</div>
                    </div>

                    <span className={'w-fit border px-2.5 py-1 text-xs font-semibold ' + statusClass(driver.status)}>
                      {humanize(driver.status)}
                    </span>
                  </button>
                );
              })}
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
                  <h2 className="text-xl font-bold">{selected.user.name || 'Unnamed driver'}</h2>
                  <span className={'border px-2 py-1 text-xs font-semibold ' + statusClass(selected.status)}>
                    {humanize(selected.status)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{selected.user.email} · {selected.user.phone || 'No phone recorded'}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-500">
                Close
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              {selected.rejectionReason && (
                <section className="border border-red-200 bg-red-50 p-4">
                  <div className="text-sm font-semibold text-red-900">Previous rejection reason</div>
                  <p className="mt-1 text-sm leading-6 text-red-800">{selected.rejectionReason}</p>
                </section>
              )}

              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Driver identity</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><div className="text-xs text-slate-400">NRC number</div><div className="mt-1 text-sm font-semibold">{selected.nrcNumber || 'Not supplied'}</div></div>
                  <div><div className="text-xs text-slate-400">Driver’s licence</div><div className="mt-1 text-sm font-semibold">{selected.licenseNumber}</div></div>
                  <div><div className="text-xs text-slate-400">Experience</div><div className="mt-1 text-sm font-semibold">{selected.experience || 'Not supplied'}</div></div>
                  <div><div className="text-xs text-slate-400">Registered</div><div className="mt-1 text-sm font-semibold">{new Date(selected.createdAt).toLocaleDateString('en-ZM')}</div></div>
                </div>
                {selected.bio && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{selected.bio}</p>}
                {selected.serviceAreas?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selected.serviceAreas.map((area) => <span key={area} className="bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{area}</span>)}
                  </div>
                )}
              </section>

              <section className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Vehicle</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><div className="text-xs text-slate-400">Type</div><div className="mt-1 text-sm font-semibold">{humanize(selected.vehicleType)}</div></div>
                  <div><div className="text-xs text-slate-400">Plate</div><div className="mt-1 text-sm font-semibold">{selected.vehiclePlate}</div></div>
                  <div><div className="text-xs text-slate-400">Make & model</div><div className="mt-1 text-sm font-semibold">{[selected.vehicleMake, selected.vehicleModel].filter(Boolean).join(' ') || 'Not supplied'}</div></div>
                  <div><div className="text-xs text-slate-400">Year</div><div className="mt-1 text-sm font-semibold">{selected.vehicleYear || 'Not supplied'}</div></div>
                  <div><div className="text-xs text-slate-400">Colour</div><div className="mt-1 text-sm font-semibold">{selected.vehicleColor || 'Not supplied'}</div></div>
                  <div><div className="text-xs text-slate-400">Cargo capacity</div><div className="mt-1 text-sm font-semibold">{selected.vehicleCapacityKg != null ? selected.vehicleCapacityKg + ' kg' : 'Not supplied'}</div></div>
                </div>
              </section>

              <section className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold">Verification documents</h3>
                <p className="mt-1 text-sm text-slate-500">All five required documents must be private and admin-verified before approval.</p>

                <div className="mt-4 divide-y divide-slate-100 border border-slate-200">
                  {requiredStatus.map(({ type, label, document }) => (
                    <div key={type} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div>
                        <div className="text-sm font-semibold">{label}</div>
                        <div className="mt-1 text-xs text-slate-500">{document?.name || 'Not uploaded'}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {document ? (
                          <>
                            <a href={document.fileAccessUrl} target="_blank" rel="noreferrer" className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                              View
                            </a>
                            {!document.storagePrivate ? (
                              <span className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Secure re-upload required</span>
                            ) : document.isVerified ? (
                              <span className="bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Verified</span>
                            ) : (
                              <button
                                type="button"
                                disabled={processing === 'doc-' + document.id}
                                onClick={() => verifyDocument(document.id)}
                                className="bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                {processing === 'doc-' + document.id ? 'Saving…' : 'Verify'}
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Missing</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold">Driver decision</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {canApprove
                    ? 'All required documents are securely stored and verified.'
                    : 'Approval stays locked until every required document is secure and verified.'}
                </p>

                {selected.status === 'PENDING' && (
                  <div className="mt-5">
                    <button
                      type="button"
                      disabled={!canApprove || processing === 'approve'}
                      onClick={approveDriver}
                      className="w-full bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {processing === 'approve' ? 'Approving…' : 'Approve driver'}
                    </button>

                    <label className="mt-5 block text-sm font-semibold text-slate-800">
                      Reject / request corrections
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="Explain what the driver must correct or re-upload."
                        className="mt-2 w-full border border-slate-300 p-3 text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!rejectReason.trim() || processing === 'reject'}
                      onClick={rejectDriver}
                      className="mt-3 border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-40"
                    >
                      {processing === 'reject' ? 'Saving…' : 'Reject application'}
                    </button>
                  </div>
                )}

                {selected.status === 'APPROVED' && (
                  <button
                    type="button"
                    disabled={processing === 'suspend'}
                    onClick={() => updateSuspension('suspend')}
                    className="mt-5 w-full border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    {processing === 'suspend' ? 'Suspending…' : 'Suspend driver'}
                  </button>
                )}

                {selected.status === 'SUSPENDED' && (
                  <button
                    type="button"
                    disabled={processing === 'activate'}
                    onClick={() => updateSuspension('activate')}
                    className="mt-5 w-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {processing === 'activate' ? 'Activating…' : 'Remove suspension'}
                  </button>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
