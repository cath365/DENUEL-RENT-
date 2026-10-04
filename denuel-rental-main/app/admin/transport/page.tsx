'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';
import { csrfFetch } from '../../../lib/csrf';

type VehicleType =
  | 'MOTORBIKE'
  | 'CAR'
  | 'SUV'
  | 'VAN'
  | 'TRUCK_SMALL'
  | 'TRUCK_MEDIUM'
  | 'TRUCK_LARGE';

type PricingRule = {
  id: string;
  vehicleType: VehicleType;
  baseFareZmw: number;
  perKmZmw: number;
  perMinZmw: number;
  minimumFareZmw: number;
  surgeMultiplier: number;
  nightMultiplier: number;
  weatherMultiplier: number;
  isActive: boolean;
  updatedAt: string;
};

type Settings = {
  surgeEnabled: boolean;
  maxSurgeMultiplier: number;
  maxNightMultiplier: number;
  maxWeatherMultiplier: number;
  nightStartHour: number;
  nightEndHour: number;
  surgeWindowMinutes: number;
  surgeMinDelta: number;
};

type Trip = {
  id: string;
  status: string;
  vehicleType: string;
  pickupAddressText: string;
  dropoffAddressText: string;
  distanceKmEstimated: number;
  durationMinEstimated: number;
  priceEstimateZmw: number;
  lockedPriceZmw?: number | null;
  createdAt: string;
  tenant?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  assignedDriver?: {
    id: string;
    vehicleType: string;
    vehiclePlate: string;
    user?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
  property?: {
    id: string;
    title: string;
  } | null;
  Rating?: {
    stars: number;
    comment?: string | null;
  } | null;
  DriverEarning?: {
    grossZmw: number;
    platformFeeZmw: number;
    netZmw: number;
  } | null;
};

type TripStats = {
  total: number;
  requested: number;
  assigned: number;
  inProgress: number;
  completed: number;
  canceled: number;
  expired: number;
};

const VEHICLE_TYPES: VehicleType[] = [
  'MOTORBIKE',
  'CAR',
  'SUV',
  'VAN',
  'TRUCK_SMALL',
  'TRUCK_MEDIUM',
  'TRUCK_LARGE',
];

const EMPTY_RULE = {
  vehicleType: 'CAR' as VehicleType,
  baseFareZmw: 0,
  perKmZmw: 0,
  perMinZmw: 0,
  minimumFareZmw: 0,
  surgeMultiplier: 1,
  nightMultiplier: 1,
  weatherMultiplier: 1,
  isActive: true,
};

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

export default function AdminTransportPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsPersisted, setSettingsPersisted] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripStats, setTripStats] = useState<TripStats>({
    total: 0,
    requested: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    canceled: 0,
    expired: 0,
  });
  const [tripStatus, setTripStatus] = useState('ALL');
  const [ruleDraft, setRuleDraft] = useState<Omit<PricingRule, 'id' | 'updatedAt'> & { id?: string }>(EMPTY_RULE);
  const [editingRule, setEditingRule] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingRule, setSavingRule] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function redirectToLogin() {
    window.location.href = '/auth/login?redirect=/admin/transport&reason=session';
  }

  async function loadRules() {
    const res = await fetch('/api/admin/transport/pricing-rules', {
      credentials: 'same-origin',
    });
    const { text, data } = await readResponse(res);

    if (res.status === 401 || res.status === 403) {
      redirectToLogin();
      return;
    }

    if (!res.ok) throw new Error(data?.error || text || 'Unable to load transport pricing rules.');
    setRules(Array.isArray(data.rules) ? data.rules : []);
  }

  async function loadSettings() {
    const res = await fetch('/api/admin/transport/settings', {
      credentials: 'same-origin',
    });
    const { text, data } = await readResponse(res);

    if (res.status === 401 || res.status === 403) {
      redirectToLogin();
      return;
    }

    if (!res.ok) throw new Error(data?.error || text || 'Unable to load transport settings.');
    setSettings(data.settings || null);
    setSettingsPersisted(Boolean(data.persisted));
  }

  async function loadTrips(status = tripStatus) {
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);

    const res = await fetch('/api/admin/transport/trips?' + params.toString(), {
      credentials: 'same-origin',
    });
    const { text, data } = await readResponse(res);

    if (res.status === 401 || res.status === 403) {
      redirectToLogin();
      return;
    }

    if (!res.ok) throw new Error(data?.error || text || 'Unable to load transport trips.');
    setTrips(Array.isArray(data.trips) ? data.trips : []);
    setTripStats(data.stats || tripStats);
  }

  async function loadPage() {
    setLoading(true);
    setError('');

    try {
      const results = await Promise.allSettled([
        loadRules(),
        loadSettings(),
        loadTrips('ALL'),
      ]);

      const failed = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
      if (failed) {
        throw failed.reason;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load transport administration.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (loading) return;
    loadTrips(tripStatus).catch((err) => {
      setError(err instanceof Error ? err.message : 'Unable to filter transport trips.');
    });
  }, [tripStatus]);

  const activeRuleByVehicle = useMemo(() => {
    const map = new Map<VehicleType, PricingRule>();
    rules.forEach((rule) => {
      if (rule.isActive && !map.has(rule.vehicleType)) {
        map.set(rule.vehicleType, rule);
      }
    });
    return map;
  }, [rules]);

  async function saveRule() {
    setSavingRule(true);
    setError('');
    setNotice('');

    try {
      const res = await csrfFetch('/api/admin/transport/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleDraft),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401 || res.status === 403) {
        redirectToLogin();
        return;
      }

      if (!res.ok) {
        const validation = Array.isArray(data?.error)
          ? data.error.map((item: any) => item.message).filter(Boolean).join(' ')
          : data?.error;
        throw new Error(validation || text || 'Unable to save pricing rule.');
      }

      await loadRules();
      setEditingRule(false);
      setRuleDraft(EMPTY_RULE);
      setNotice('Transport pricing rule saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save pricing rule.');
    } finally {
      setSavingRule(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;

    setSavingSettings(true);
    setError('');
    setNotice('');

    try {
      const res = await csrfFetch('/api/admin/transport/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401 || res.status === 403) {
        redirectToLogin();
        return;
      }

      if (!res.ok) {
        const validation = Array.isArray(data?.error)
          ? data.error.map((item: any) => item.message).filter(Boolean).join(' ')
          : data?.error;
        throw new Error(validation || text || 'Unable to save transport settings.');
      }

      setSettings(data.settings);
      setSettingsPersisted(true);
      setNotice('Transport settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save transport settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  function editRule(rule: PricingRule) {
    setRuleDraft({
      id: rule.id,
      vehicleType: rule.vehicleType,
      baseFareZmw: rule.baseFareZmw,
      perKmZmw: rule.perKmZmw,
      perMinZmw: rule.perMinZmw,
      minimumFareZmw: rule.minimumFareZmw,
      surgeMultiplier: rule.surgeMultiplier,
      nightMultiplier: rule.nightMultiplier,
      weatherMultiplier: rule.weatherMultiplier,
      isActive: rule.isActive,
    });
    setEditingRule(true);
    setError('');
    setNotice('');
  }

  function newRule(vehicleType: VehicleType = 'CAR') {
    setRuleDraft({ ...EMPTY_RULE, vehicleType });
    setEditingRule(true);
    setError('');
    setNotice('');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="h-40 animate-pulse border border-slate-200 bg-white" />
          <div className="mt-6 h-96 animate-pulse border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">Admin · Transport operations</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">Transport control center</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage active vehicle pricing, demand multipliers and real transport-trip records from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/drivers" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
              Driver management
            </Link>
            <Link href="/transport" className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              View transport page
            </Link>
          </div>
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

        <section className="mt-7 grid grid-cols-2 border-l border-t border-slate-200 bg-white sm:grid-cols-4 lg:grid-cols-7">
          {[
            ['Total trips', tripStats.total],
            ['Requested', tripStats.requested],
            ['Assigned', tripStats.assigned],
            ['In progress', tripStats.inProgress],
            ['Completed', tripStats.completed],
            ['Canceled', tripStats.canceled],
            ['Expired', tripStats.expired],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-4">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-2 text-xl font-bold">{Number(value).toLocaleString()}</div>
            </div>
          ))}
        </section>

        <section className="mt-7 border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Vehicle pricing rules</h2>
              <p className="mt-1 text-sm text-slate-500">
                One active rule per vehicle type is used by the customer estimate and request APIs.
              </p>
            </div>
            <button type="button" onClick={() => newRule()} className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
              Add pricing rule
            </button>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {VEHICLE_TYPES.map((vehicleType) => {
              const rule = activeRuleByVehicle.get(vehicleType);

              return (
                <div key={vehicleType} className="border-b border-r border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{humanize(vehicleType)}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {rule ? 'Active pricing configured' : 'No active pricing rule'}
                      </div>
                    </div>
                    <span className={'px-2 py-1 text-[11px] font-semibold ' + (rule ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                      {rule ? 'Active' : 'Missing'}
                    </span>
                  </div>

                  {rule ? (
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Base</span><strong>{money(rule.baseFareZmw)}</strong></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Per km</span><strong>{money(rule.perKmZmw)}</strong></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Per min</span><strong>{money(rule.perMinZmw)}</strong></div>
                      <div className="flex justify-between gap-3"><span className="text-slate-500">Minimum</span><strong>{money(rule.minimumFareZmw)}</strong></div>
                      <button type="button" onClick={() => editRule(rule)} className="mt-3 w-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                        Edit rule
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => newRule(vehicleType)} className="mt-4 w-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                      Configure pricing
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {rules.filter((rule) => !rule.isActive).length > 0 && (
            <div className="border-t border-slate-200 p-5">
              <div className="text-sm font-semibold">Inactive pricing history</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {rules.filter((rule) => !rule.isActive).map((rule) => (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => editRule(rule)}
                    className="border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                  >
                    {humanize(rule.vehicleType)} · updated {new Date(rule.updatedAt).toLocaleDateString('en-ZM')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {editingRule && (
          <section className="mt-6 border border-blue-200 bg-blue-50 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">{ruleDraft.id ? 'Edit pricing rule' : 'Create pricing rule'}</h2>
                <p className="mt-1 text-sm text-slate-600">Saving an active rule deactivates any other active rule for the same vehicle type.</p>
              </div>
              <button type="button" onClick={() => setEditingRule(false)} className="text-sm font-semibold text-slate-500">Close</button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm font-medium">
                Vehicle type
                <select
                  value={ruleDraft.vehicleType}
                  onChange={(e) => setRuleDraft({ ...ruleDraft, vehicleType: e.target.value as VehicleType })}
                  className="mt-2 h-11 w-full border border-slate-300 bg-white px-3"
                >
                  {VEHICLE_TYPES.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
                </select>
              </label>

              {[
                ['baseFareZmw', 'Base fare (ZMW)'],
                ['perKmZmw', 'Per km (ZMW)'],
                ['perMinZmw', 'Per minute (ZMW)'],
                ['minimumFareZmw', 'Minimum fare (ZMW)'],
              ].map(([field, label]) => (
                <label key={field} className="text-sm font-medium">
                  {label}
                  <input
                    type="number"
                    min="0"
                    value={(ruleDraft as any)[field]}
                    onChange={(e) => setRuleDraft({ ...ruleDraft, [field]: Number(e.target.value) })}
                    className="mt-2 h-11 w-full border border-slate-300 bg-white px-3"
                  />
                </label>
              ))}

              {[
                ['surgeMultiplier', 'Rule surge multiplier'],
                ['nightMultiplier', 'Rule night multiplier'],
                ['weatherMultiplier', 'Rule weather multiplier'],
              ].map(([field, label]) => (
                <label key={field} className="text-sm font-medium">
                  {label}
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.01"
                    value={(ruleDraft as any)[field]}
                    onChange={(e) => setRuleDraft({ ...ruleDraft, [field]: Number(e.target.value) })}
                    className="mt-2 h-11 w-full border border-slate-300 bg-white px-3"
                  />
                </label>
              ))}

              <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={ruleDraft.isActive}
                  onChange={(e) => setRuleDraft({ ...ruleDraft, isActive: e.target.checked })}
                />
                Active pricing rule
              </label>
            </div>

            <button
              type="button"
              onClick={saveRule}
              disabled={savingRule}
              className="mt-5 bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingRule ? 'Saving…' : 'Save pricing rule'}
            </button>
          </section>
        )}

        <section className="mt-7 border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold">Demand and multiplier settings</h2>
            <p className="mt-1 text-sm text-slate-500">
              {settingsPersisted
                ? 'These settings are stored in the database.'
                : 'No settings row exists yet; the pricing engine is currently using its built-in defaults shown below.'}
            </p>
          </div>

          {settings && (
            <div className="p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={settings.surgeEnabled}
                    onChange={(e) => setSettings({ ...settings, surgeEnabled: e.target.checked })}
                  />
                  Enable demand surge
                </label>

                {[
                  ['maxSurgeMultiplier', 'Maximum surge multiplier', 1, 5, 0.01],
                  ['maxNightMultiplier', 'Maximum night multiplier', 1, 5, 0.01],
                  ['maxWeatherMultiplier', 'Maximum weather multiplier', 1, 5, 0.01],
                  ['nightStartHour', 'Night starts (0–23)', 0, 23, 1],
                  ['nightEndHour', 'Night ends (0–23)', 0, 23, 1],
                  ['surgeWindowMinutes', 'Demand window (minutes)', 1, 120, 1],
                  ['surgeMinDelta', 'Demand minus supply threshold', 1, 1000, 1],
                ].map(([field, label, min, max, step]) => (
                  <label key={String(field)} className="text-sm font-medium">
                    {String(label)}
                    <input
                      type="number"
                      min={Number(min)}
                      max={Number(max)}
                      step={Number(step)}
                      value={(settings as any)[field as string]}
                      onChange={(e) => setSettings({ ...settings, [field as string]: Number(e.target.value) })}
                      className="mt-2 h-11 w-full border border-slate-300 px-3"
                    />
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={saveSettings}
                disabled={savingSettings}
                className="mt-5 bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingSettings ? 'Saving…' : 'Save transport settings'}
              </button>
            </div>
          )}
        </section>

        <section className="mt-7 overflow-hidden border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Transport trips</h2>
              <p className="mt-1 text-sm text-slate-500">Latest 200 real transport requests, newest first.</p>
            </div>
            <select
              value={tripStatus}
              onChange={(e) => setTripStatus(e.target.value)}
              className="h-10 border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="DRIVER_ASSIGNED">Driver assigned</option>
              <option value="DRIVER_ARRIVING">Driver arriving</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {trips.length ? (
            <div className="divide-y divide-slate-100">
              {trips.map((trip) => (
                <article key={trip.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.5fr)_170px_160px_150px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{trip.pickupAddressText || 'Pickup not recorded'}</span>
                      <span className="text-xs text-slate-400">→</span>
                      <span className="text-sm text-slate-600">{trip.dropoffAddressText || 'Drop-off not recorded'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{trip.tenant?.name || trip.tenant?.email || 'Customer'}</span>
                      <span>{humanize(trip.vehicleType)}</span>
                      <span>{Number(trip.distanceKmEstimated || 0).toFixed(1)} km</span>
                      {trip.property?.title && <span>Property: {trip.property.title}</span>}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Status</div>
                    <div className="mt-1 text-sm font-semibold">{humanize(trip.status)}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400">Driver</div>
                    <div className="mt-1 text-sm font-semibold">
                      {trip.assignedDriver?.user?.name || 'Not assigned'}
                    </div>
                    {trip.assignedDriver?.vehiclePlate && (
                      <div className="mt-1 text-xs text-slate-500">{trip.assignedDriver.vehiclePlate}</div>
                    )}
                  </div>

                  <div className="lg:text-right">
                    <div className="text-xs text-slate-400">Locked fare</div>
                    <div className="mt-1 text-sm font-semibold">{money(trip.lockedPriceZmw || trip.priceEstimateZmw)}</div>
                    {trip.DriverEarning && (
                      <div className="mt-1 text-xs text-emerald-700">Driver net {money(trip.DriverEarning.netZmw)}</div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <h3 className="font-semibold">No transport trips match this filter</h3>
              <p className="mt-2 text-sm text-slate-500">Only real database records are shown.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
