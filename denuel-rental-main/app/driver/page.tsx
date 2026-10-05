'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { csrfFetch } from '../../lib/csrf';

type DriverDocument = {
  id: string;
  type: string;
  name: string;
  isVerified: boolean;
  uploadedAt: string;
  fileAccessUrl: string;
  storagePrivate?: boolean;
};

type DriverProfile = {
  id: string;
  licenseNumber: string;
  nrcNumber?: string | null;
  vehicleType: string;
  vehiclePlate: string;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleColor?: string | null;
  vehicleCapacityKg?: number | null;
  experience?: string | null;
  bio?: string | null;
  serviceAreas?: any;
  verificationStatus: string;
  rejectionReason?: string | null;
  isApproved: boolean;
  isOnline: boolean;
  ratingAvg: number;
  ratingCount: number;
  user: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
    profileImage?: string | null;
    isSuspended: boolean;
  };
  documents: DriverDocument[];
};

type DriverStats = {
  totalTrips: number;
  todayTrips: number;
  weekTrips: number;
  completedTrips: number;
  canceledTrips: number;
  totalEarnings: number;
  todayEarnings: number;
  weekEarnings: number;
  averageRating: number;
  totalRatings: number;
  acceptanceRate: number;
  completionRate: number;
};

type TransportRequest = {
  id: string;
  pickupAddressText: string;
  dropoffAddressText: string;
  distanceKmEstimated: number;
  durationMinEstimated: number;
  priceEstimateZmw: number;
  lockedPriceZmw?: number | null;
  vehicleType: string;
  createdAt: string;
  property?: {
    title?: string | null;
  } | null;
};

type ActiveTrip = TransportRequest & {
  status: string;
  tenant?: {
    name?: string | null;
    phone?: string | null;
  } | null;
};

const REQUIRED_DOCUMENTS = [
  ['NRC', 'NRC / national identity'],
  ['DRIVER_LICENSE', 'Driver’s licence'],
  ['VEHICLE_REGISTRATION', 'Vehicle registration'],
  ['INSURANCE', 'Vehicle insurance'],
  ['POLICE_CLEARANCE', 'Police clearance'],
] as const;

function money(value?: number | null) {
  return 'K' + Number(value || 0).toLocaleString();
}

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export default function DriverDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [requestAvailability, setRequestAvailability] = useState<{ available: boolean; reason?: string }>({ available: false });
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const redirectToLogin = () => {
    router.push('/auth/login?redirect=/driver&reason=session');
  };

  async function loadProfile() {
    const res = await fetch('/api/driver/profile', { credentials: 'same-origin' });
    const { text, data } = await readResponse(res);

    if (res.status === 401) {
      redirectToLogin();
      return null;
    }

    if (res.status === 403) {
      router.push('/dashboard');
      return null;
    }

    if (!res.ok) {
      throw new Error(data?.error || text || 'Unable to load driver profile.');
    }

    if (!data?.profile) {
      router.push('/driver/apply');
      return null;
    }

    setProfile(data.profile);
    return data.profile as DriverProfile;
  }

  async function loadStats() {
    const res = await fetch('/api/driver/stats', { credentials: 'same-origin' });
    const { text, data } = await readResponse(res);
    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    if (!res.ok) throw new Error(data?.error || text || 'Unable to load driver statistics.');
    setStats(data.stats || null);
  }

  async function loadRequests() {
    const res = await fetch('/api/driver/requests', { credentials: 'same-origin' });
    const { text, data } = await readResponse(res);
    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    if (!res.ok) throw new Error(data?.error || text || 'Unable to load transport requests.');

    setRequests(Array.isArray(data.requests) ? data.requests : []);
    setRequestAvailability({
      available: Boolean(data.available),
      reason: data.reason,
    });
  }

  async function loadActiveTrip() {
    const res = await fetch('/api/driver/trips/active', { credentials: 'same-origin' });
    const { text, data } = await readResponse(res);
    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    if (!res.ok) throw new Error(data?.error || text || 'Unable to load active trip.');
    setActiveTrip(data || null);
  }

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const currentProfile = await loadProfile();
      if (!currentProfile) return;

      const results = await Promise.allSettled([
        loadStats(),
        loadRequests(),
        loadActiveTrip(),
      ]);

      const failed = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
      if (failed) {
        setError(failed.reason instanceof Error ? failed.reason.message : 'Some driver data could not be loaded.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load driver dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const documentStatus = useMemo(() => {
    if (!profile) return [];
    return REQUIRED_DOCUMENTS.map(([type, label]) => {
      const document = profile.documents?.find((item) => item.type === type);
      return { type, label, document };
    });
  }, [profile]);

  const secureVerifiedDocuments = documentStatus.filter(
    ({ document }) => document?.isVerified && document.storagePrivate,
  ).length;

  const verificationReady =
    documentStatus.length > 0 &&
    documentStatus.every(({ document }) => document?.isVerified && document.storagePrivate);

  async function toggleOnline() {
    if (!profile) return;

    setProcessing('online');
    setError('');
    setNotice('');

    try {
      const res = await csrfFetch('/api/driver/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: !profile.isOnline }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error(data?.error || text || 'Unable to update online status.');

      setProfile((current) => current ? { ...current, isOnline: Boolean(data.isOnline) } : current);
      await loadRequests();
      setNotice(data.isOnline ? 'You are now online for matching transport requests.' : 'You are now offline.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update online status.');
    } finally {
      setProcessing('');
    }
  }

  async function acceptRequest(requestId: string) {
    setProcessing('request-' + requestId);
    setError('');
    setNotice('');

    try {
      const res = await csrfFetch('/api/driver/requests/' + requestId + '/accept', {
        method: 'POST',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error(data?.error || text || 'Unable to accept request.');

      await Promise.all([loadRequests(), loadActiveTrip(), loadStats()]);
      setNotice('Transport request accepted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept request.');
    } finally {
      setProcessing('');
    }
  }

  async function updateTripStatus(nextStatus: string) {
    if (!activeTrip) return;

    setProcessing('trip');
    setError('');
    setNotice('');

    try {
      const res = await csrfFetch('/api/driver/trips/' + activeTrip.id + '/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error(data?.error || text || 'Unable to update trip.');

      await Promise.all([loadActiveTrip(), loadStats(), loadRequests()]);
      setNotice(nextStatus === 'COMPLETED' ? 'Trip completed and recorded.' : 'Trip status updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update trip.');
    } finally {
      setProcessing('');
    }
  }

  async function uploadVerificationDocument(type: string, file: File) {
    if (file.size > 4 * 1024 * 1024) {
      setError('Driver verification documents must be 4MB or smaller.');
      return;
    }

    setProcessing('doc-' + type);
    setError('');
    setNotice('');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);

      const res = await csrfFetch('/api/driver/documents/upload', {
        method: 'POST',
        body: form,
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error(data?.error || text || 'Unable to upload driver document.');

      await loadProfile();
      setNotice('Verification document uploaded and waiting for admin review.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload driver document.');
    } finally {
      setProcessing('');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="h-36 animate-pulse border border-slate-200 bg-white" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse border border-slate-200 bg-white" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!profile) return null;

  const canGoOnline =
    profile.isApproved &&
    profile.verificationStatus === 'VERIFIED' &&
    !profile.user.isSuspended;

  const serviceAreas = Array.isArray(profile.serviceAreas) ? profile.serviceAreas : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">Transport workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
              {profile.user.name ? profile.user.name + ' · Driver' : 'Driver dashboard'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {humanize(profile.vehicleType)} · {profile.vehiclePlate}
              {[profile.vehicleMake, profile.vehicleModel].filter(Boolean).length
                ? ' · ' + [profile.vehicleMake, profile.vehicleModel].filter(Boolean).join(' ')
                : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleOnline}
            disabled={!canGoOnline || processing === 'online'}
            className={
              'inline-flex w-fit items-center justify-center border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ' +
              (profile.isOnline
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-300 bg-white text-slate-700')
            }
          >
            {processing === 'online'
              ? 'Updating…'
              : profile.isOnline
                ? 'Online · accepting requests'
                : 'Go online'}
          </button>
        </section>

        {profile.user.isSuspended && (
          <section className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Driver account suspended</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              Transport access is disabled while this account is suspended.
            </p>
          </section>
        )}

        {!profile.user.isSuspended && profile.verificationStatus === 'REJECTED' && (
          <section className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-900">Application needs corrections</h2>
            <p className="mt-2 text-sm leading-6 text-red-800">
              {profile.rejectionReason || 'Review your driver details and verification documents, then submit corrected information.'}
            </p>
          </section>
        )}

        {!profile.user.isSuspended && !profile.isApproved && profile.verificationStatus !== 'REJECTED' && (
          <section className="mt-6 border border-amber-200 bg-amber-50 p-5">
            <h2 className="font-semibold">Driver verification pending</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              You cannot go online until all required documents are privately stored, admin-verified and the driver application is approved.
            </p>
          </section>
        )}

        {notice && (
          <div className="mt-6 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-7 grid grid-cols-2 border-l border-t border-slate-200 bg-white sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Today earnings', money(stats?.todayEarnings)],
            ['Week earnings', money(stats?.weekEarnings)],
            ['Total earnings', money(stats?.totalEarnings)],
            ['Completed trips', Number(stats?.completedTrips || 0).toLocaleString()],
            ['Rating', stats?.totalRatings ? Number(stats.averageRating || 0).toFixed(1) : 'No ratings'],
            ['Verified docs', secureVerifiedDocuments + '/' + REQUIRED_DOCUMENTS.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-4">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-2 text-xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        {activeTrip && (
          <section className="mt-7 border border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">Active trip · {humanize(activeTrip.status)}</div>
                <h2 className="mt-2 font-semibold">{activeTrip.pickupAddressText}</h2>
                <p className="mt-1 text-sm text-slate-600">to {activeTrip.dropoffAddressText}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{Number(activeTrip.distanceKmEstimated || 0).toFixed(1)} km</span>
                  <span>{Number(activeTrip.durationMinEstimated || 0)} min estimated</span>
                  <span>{money(activeTrip.lockedPriceZmw || activeTrip.priceEstimateZmw)}</span>
                  {activeTrip.tenant?.name && <span>Customer: {activeTrip.tenant.name}</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeTrip.tenant?.phone && (
                  <a href={'tel:' + activeTrip.tenant.phone} className="border border-blue-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800">
                    Call customer
                  </a>
                )}
                {activeTrip.status === 'DRIVER_ASSIGNED' && (
                  <button type="button" disabled={processing === 'trip'} onClick={() => updateTripStatus('DRIVER_ARRIVING')} className="bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    On my way
                  </button>
                )}
                {activeTrip.status === 'DRIVER_ARRIVING' && (
                  <button type="button" disabled={processing === 'trip'} onClick={() => updateTripStatus('IN_PROGRESS')} className="bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    Start trip
                  </button>
                )}
                {activeTrip.status === 'IN_PROGRESS' && (
                  <button type="button" disabled={processing === 'trip'} onClick={() => updateTripStatus('COMPLETED')} className="bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                    Complete trip
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 p-5">
                <div>
                  <h2 className="font-semibold">Available transport requests</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Requests are shown only when your approved driver account is online and the requested vehicle type matches yours.
                  </p>
                </div>
                {profile.isOnline && canGoOnline && (
                  <button type="button" onClick={loadRequests} className="text-sm font-semibold text-blue-700">
                    Refresh
                  </button>
                )}
              </div>

              {!canGoOnline ? (
                <div className="p-8 text-sm text-slate-500">
                  Complete driver verification and approval before transport requests become available.
                </div>
              ) : !profile.isOnline ? (
                <div className="p-8 text-sm text-slate-500">
                  Go online when you are ready to receive matching requests.
                </div>
              ) : requests.length ? (
                <div className="divide-y divide-slate-100">
                  {requests.map((request) => (
                    <article key={request.id} className="p-5">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{request.pickupAddressText}</div>
                          <div className="mt-1 text-sm text-slate-600">to {request.dropoffAddressText}</div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>{Number(request.distanceKmEstimated || 0).toFixed(1)} km</span>
                            <span>{Number(request.durationMinEstimated || 0)} min estimated</span>
                            {request.property?.title && <span>{request.property.title}</span>}
                          </div>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <div className="text-lg font-bold">{money(request.priceEstimateZmw)}</div>
                          <button
                            type="button"
                            disabled={Boolean(activeTrip) || processing === 'request-' + request.id}
                            onClick={() => acceptRequest(request.id)}
                            className="mt-2 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                          >
                            {processing === 'request-' + request.id ? 'Accepting…' : activeTrip ? 'Active trip in progress' : 'Accept request'}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-8">
                  <h3 className="font-semibold">No matching requests right now</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Stay online to receive transport requests that match your approved vehicle type.
                  </p>
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <h2 className="font-semibold">Driver verification</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Private documents remain available only to you and authorised DENUEL administrators.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {documentStatus.map(({ type, label, document }) => (
                  <div key={type} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{label}</span>
                        {!document ? (
                          <span className="bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Missing</span>
                        ) : !document.storagePrivate ? (
                          <span className="bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Secure re-upload required</span>
                        ) : document.isVerified ? (
                          <span className="bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Verified</span>
                        ) : (
                          <span className="bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Awaiting review</span>
                        )}
                      </div>
                      {document && (
                        <div className="mt-1 text-xs text-slate-500">
                          {document.name} · <a href={document.fileAccessUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700">Open securely</a>
                        </div>
                      )}
                    </div>

                    {(!document || !document.isVerified || !document.storagePrivate) && (
                      <label className="inline-flex cursor-pointer justify-center border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                        {processing === 'doc-' + type ? 'Uploading…' : document ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png,image/webp"
                          disabled={processing === 'doc-' + type}
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) uploadVerificationDocument(type, file);
                            event.currentTarget.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 p-4 text-sm text-slate-500">
                {verificationReady
                  ? profile.isApproved
                    ? 'Verification complete and driver approved.'
                    : 'All documents are verified. The application is waiting for the final driver approval decision.'
                  : 'All five required documents must be privately stored and verified before approval.'}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">Driver profile</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div><div className="text-xs text-slate-400">Licence</div><div className="mt-1 font-semibold">{profile.licenseNumber}</div></div>
                <div><div className="text-xs text-slate-400">Vehicle</div><div className="mt-1 font-semibold">{[profile.vehicleMake, profile.vehicleModel, profile.vehicleYear].filter(Boolean).join(' ') || humanize(profile.vehicleType)}</div></div>
                <div><div className="text-xs text-slate-400">Plate</div><div className="mt-1 font-semibold">{profile.vehiclePlate}</div></div>
                <div><div className="text-xs text-slate-400">Service areas</div><div className="mt-1 font-semibold">{serviceAreas.length ? serviceAreas.join(', ') : 'Not recorded'}</div></div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">Performance</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-slate-500">Total trips</span><strong>{stats?.totalTrips || 0}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">Completed</span><strong>{stats?.completedTrips || 0}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">Canceled</span><strong>{stats?.canceledTrips || 0}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">Completion rate</span><strong>{stats ? stats.completionRate + '%' : '—'}</strong></div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">Driver records</h2>
              <div className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                {[
                  ['Earnings', '/driver/earnings'],
                  ['Trip history', '/driver/history'],
                  ['Ratings', '/driver/ratings'],
                  ['My customer transport requests', '/transport/requests'],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="flex items-center justify-between py-3 text-sm font-medium text-slate-700 hover:text-blue-700">
                    {label}<span>→</span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
