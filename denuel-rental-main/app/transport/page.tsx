'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';
import { csrfFetch } from '../../lib/csrf';

type TransportMode = 'ride' | 'moving' | 'delivery';
type VehicleType =
  | 'MOTORBIKE'
  | 'CAR'
  | 'SUV'
  | 'VAN'
  | 'TRUCK_SMALL'
  | 'TRUCK_MEDIUM'
  | 'TRUCK_LARGE';

type LocationResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type EstimatePayload = {
  distanceKm: number;
  durationMin: number;
  estimate: {
    components: {
      base: number;
      distanceCost: number;
      timeCost: number;
      rawPrice: number;
    };
    multipliers: {
      surge: { value: number; applied: boolean; reason?: string };
      night: { value: number; applied: boolean; reason?: string };
      weather: { value: number; applied: boolean; reason?: string };
      totalMultiplier: number;
    };
    finalPrice: number;
  };
};

type CreatedRequest = {
  id: string;
  status: string;
  expiresAt?: string | null;
  notifiedDrivers: number;
};

const VEHICLES: Array<{
  id: VehicleType;
  name: string;
  description: string;
  modes: TransportMode[];
}> = [
  {
    id: 'MOTORBIKE',
    name: 'Motorbike',
    description: 'Small deliveries and light transport.',
    modes: ['delivery'],
  },
  {
    id: 'CAR',
    name: 'Car / sedan',
    description: 'Passenger transport and light luggage.',
    modes: ['ride', 'delivery'],
  },
  {
    id: 'SUV',
    name: 'SUV',
    description: 'Passenger transport with additional luggage space.',
    modes: ['ride', 'delivery'],
  },
  {
    id: 'VAN',
    name: 'Van / minibus',
    description: 'Groups, medium cargo and smaller moving jobs.',
    modes: ['ride', 'moving', 'delivery'],
  },
  {
    id: 'TRUCK_SMALL',
    name: 'Small truck',
    description: 'Furniture, appliances and small moving jobs.',
    modes: ['moving', 'delivery'],
  },
  {
    id: 'TRUCK_MEDIUM',
    name: 'Medium truck',
    description: 'Larger moving and cargo jobs.',
    modes: ['moving', 'delivery'],
  },
  {
    id: 'TRUCK_LARGE',
    name: 'Large truck',
    description: 'Heavy or high-volume moving and cargo jobs.',
    modes: ['moving'],
  },
];

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

function LocationField({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  onUnauthorized,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: LocationResult) => void;
  onUnauthorized: () => void;
}) {
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');

  async function searchLocation() {
    const query = value.trim();
    setMessage('');

    if (query.length < 3) {
      setResults([]);
      setMessage('Enter at least 3 characters.');
      return;
    }

    setSearching(true);

    try {
      const res = await fetch('/api/transport/geocode?q=' + encodeURIComponent(query), {
        credentials: 'same-origin',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to search for this location.');
      }

      const next = Array.isArray(data.results) ? data.results : [];
      setResults(next);
      if (!next.length) setMessage('No Zambia locations matched this search.');
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : 'Unable to search for this location.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800">{label}</label>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setResults([]);
            setMessage('');
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              searchLocation();
            }
          }}
          placeholder={placeholder}
          className="h-12 min-w-0 flex-1 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950"
        />
        <button
          type="button"
          onClick={searchLocation}
          disabled={searching}
          className="border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          {searching ? 'Searching…' : 'Find'}
        </button>
      </div>

      {message && <p className="mt-2 text-xs text-slate-500">{message}</p>}

      {results.length > 0 && (
        <div className="mt-2 divide-y divide-slate-100 border border-slate-200 bg-white">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                onSelect(result);
                setResults([]);
                setMessage('');
              }}
              className="block w-full px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              {result.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TransportPage() {
  const [mode, setMode] = useState<TransportMode>('ride');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [pickupText, setPickupText] = useState('');
  const [dropoffText, setDropoffText] = useState('');
  const [pickup, setPickup] = useState<LocationResult | null>(null);
  const [dropoff, setDropoff] = useState<LocationResult | null>(null);
  const [estimate, setEstimate] = useState<EstimatePayload | null>(null);
  const [createdRequest, setCreatedRequest] = useState<CreatedRequest | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const visibleVehicles = VEHICLES.filter((vehicle) => vehicle.modes.includes(mode));

  function goToLogin() {
    window.location.href = '/auth/login?redirect=/transport&reason=session';
  }

  function clearEstimate() {
    setEstimate(null);
    setCreatedRequest(null);
  }

  function changeMode(nextMode: TransportMode) {
    setMode(nextMode);
    const allowed = VEHICLES.filter((vehicle) => vehicle.modes.includes(nextMode));
    if (!allowed.some((vehicle) => vehicle.id === vehicleType)) {
      setVehicleType(allowed[0].id);
    }
    clearEstimate();
  }

  async function getEstimate() {
    setError('');
    setCreatedRequest(null);

    if (!pickup || !dropoff) {
      setError('Choose both pickup and drop-off from the location search results before requesting a price.');
      return;
    }

    setEstimating(true);

    try {
      const res = await fetch('/api/transport/estimate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: pickup.latitude,
          pickupLng: pickup.longitude,
          dropoffLat: dropoff.latitude,
          dropoffLng: dropoff.longitude,
          vehicleType,
        }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        goToLogin();
        return;
      }

      if (!res.ok) {
        const validation = Array.isArray(data?.error)
          ? data.error.map((item: any) => item.message).filter(Boolean).join(' ')
          : data?.error;
        throw new Error(validation || text || 'Unable to calculate transport estimate.');
      }

      setEstimate(data);
    } catch (err) {
      setEstimate(null);
      setError(err instanceof Error ? err.message : 'Unable to calculate transport estimate.');
    } finally {
      setEstimating(false);
    }
  }

  async function requestTransport() {
    if (!pickup || !dropoff || !estimate) return;

    setBooking(true);
    setError('');

    try {
      const res = await csrfFetch('/api/transport/request', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: pickup.latitude,
          pickupLng: pickup.longitude,
          pickupAddressText: pickup.label,
          dropoffLat: dropoff.latitude,
          dropoffLng: dropoff.longitude,
          dropoffAddressText: dropoff.label,
          vehicleType,
        }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        goToLogin();
        return;
      }

      if (!res.ok) {
        const validation = Array.isArray(data?.error)
          ? data.error.map((item: any) => item.message).filter(Boolean).join(' ')
          : data?.error;
        throw new Error(validation || text || 'Unable to create transport request.');
      }

      setCreatedRequest({
        id: data.id,
        status: data.status,
        expiresAt: data.expiresAt,
        notifiedDrivers: Number(data.notifiedDrivers || 0),
      });

      if (data.estimate) {
        setEstimate({
          distanceKm: Number(data.estimate.distanceKm || estimate.distanceKm),
          durationMin: Number(data.estimate.durationMin || estimate.durationMin),
          estimate: {
            components: data.estimate.components || estimate.estimate.components,
            multipliers: data.estimate.multipliers || estimate.estimate.multipliers,
            finalPrice: Number(data.estimate.finalPrice || estimate.estimate.finalPrice),
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create transport request.');
    } finally {
      setBooking(false);
    }
  }

  function resetForm() {
    setPickupText('');
    setDropoffText('');
    setPickup(null);
    setDropoff(null);
    setEstimate(null);
    setCreatedRequest(null);
    setError('');
  }

  if (createdRequest) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <section className="border border-slate-200 bg-white p-7 sm:p-10">
            <div className="inline-flex border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
              Transport request created
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-[-0.035em]">
              Your request is ready for an available driver
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              DENUEL created a real transport request using the selected locations, vehicle type and current pricing configuration. A driver has not been promised or assigned unless the request status changes accordingly.
            </p>

            <div className="mt-7 divide-y divide-slate-100 border border-slate-200">
              <div className="grid gap-2 p-4 sm:grid-cols-[140px_1fr]">
                <span className="text-sm text-slate-500">Request ID</span>
                <span className="break-all text-sm font-semibold">{createdRequest.id}</span>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-[140px_1fr]">
                <span className="text-sm text-slate-500">Status</span>
                <span className="text-sm font-semibold">{humanize(createdRequest.status)}</span>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-[140px_1fr]">
                <span className="text-sm text-slate-500">Pickup</span>
                <span className="text-sm font-semibold">{pickup?.label}</span>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-[140px_1fr]">
                <span className="text-sm text-slate-500">Drop-off</span>
                <span className="text-sm font-semibold">{dropoff?.label}</span>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-[140px_1fr]">
                <span className="text-sm text-slate-500">Vehicle</span>
                <span className="text-sm font-semibold">{humanize(vehicleType)}</span>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-[140px_1fr]">
                <span className="text-sm text-slate-500">Locked estimate</span>
                <span className="text-sm font-semibold">{money(estimate?.estimate.finalPrice)}</span>
              </div>
            </div>

            <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-slate-600">
              {createdRequest.notifiedDrivers > 0
                ? createdRequest.notifiedDrivers + ' currently eligible nearby driver' + (createdRequest.notifiedDrivers === 1 ? ' was' : 's were') + ' notified.'
                : 'No eligible nearby driver with a recorded location was notified immediately. The request still exists until it expires or is canceled.'}
              {createdRequest.expiresAt
                ? ' This request is currently set to expire at ' + new Date(createdRequest.expiresAt).toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit' }) + '.'
                : ''}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/transport/requests" className="inline-flex justify-center bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                Track my request
              </Link>
              <button type="button" onClick={resetForm} className="border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                Create another request
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
            <p className="text-sm font-semibold text-blue-700">DENUEL Transport</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
              Request transport using real locations and configured prices
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Search Zambia locations, choose a suitable vehicle and get an estimate from DENUEL’s transport pricing rules before creating the request.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {([
                ['ride', 'Passenger ride'],
                ['moving', 'Moving'],
                ['delivery', 'Delivery'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeMode(value)}
                  className={
                    'border px-4 py-2.5 text-sm font-semibold ' +
                    (mode === value
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-slate-950')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-xl font-semibold">1. Choose pickup and drop-off</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Search for each place and select a result so DENUEL has real coordinates for distance and pricing.
              </p>

              <div className="mt-6 grid gap-5">
                <LocationField
                  label="Pickup location"
                  placeholder="e.g. Arcades Shopping Mall, Lusaka"
                  value={pickupText}
                  onChange={(value) => {
                    setPickupText(value);
                    setPickup(null);
                    clearEstimate();
                  }}
                  onSelect={(location) => {
                    setPickup(location);
                    setPickupText(location.label);
                    clearEstimate();
                  }}
                  onUnauthorized={goToLogin}
                />

                <LocationField
                  label="Drop-off location"
                  placeholder="e.g. Kafue Road, Lusaka"
                  value={dropoffText}
                  onChange={(value) => {
                    setDropoffText(value);
                    setDropoff(null);
                    clearEstimate();
                  }}
                  onSelect={(location) => {
                    setDropoff(location);
                    setDropoffText(location.label);
                    clearEstimate();
                  }}
                  onUnauthorized={goToLogin}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pickup selected</div>
                  <div className="mt-2 text-sm font-semibold">{pickup?.label || 'Not selected'}</div>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Drop-off selected</div>
                  <div className="mt-2 text-sm font-semibold">{dropoff?.label || 'Not selected'}</div>
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-xl font-semibold">2. Choose a vehicle</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Only vehicle types supported by the transport system are shown. The page does not display made-up “from” prices.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleVehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => {
                      setVehicleType(vehicle.id);
                      clearEstimate();
                    }}
                    className={
                      'border p-4 text-left transition ' +
                      (vehicleType === vehicle.id
                        ? 'border-slate-950 bg-slate-50'
                        : 'border-slate-200 hover:border-slate-400')
                    }
                  >
                    <div className="font-semibold">{vehicle.name}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{vehicle.description}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <h2 className="text-xl font-semibold">3. Get a real estimate</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Road distance and travel time come from the selected Mapbox route. Price comes from active transport pricing rules and configured multipliers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={getEstimate}
                  disabled={!pickup || !dropoff || estimating}
                  className="bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {estimating ? 'Calculating…' : estimate ? 'Recalculate estimate' : 'Get price estimate'}
                </button>
              </div>

              {error && (
                <div className="mt-5 border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {error}
                </div>
              )}

              {estimate && (
                <div className="mt-6">
                  <div className="grid grid-cols-2 border-l border-t border-slate-200 sm:grid-cols-3">
                    <div className="border-b border-r border-slate-200 p-4">
                      <div className="text-xs text-slate-500">Estimated price</div>
                      <div className="mt-2 text-2xl font-bold">{money(estimate.estimate.finalPrice)}</div>
                    </div>
                    <div className="border-b border-r border-slate-200 p-4">
                      <div className="text-xs text-slate-500">Route distance</div>
                      <div className="mt-2 text-2xl font-bold">{Number(estimate.distanceKm).toFixed(1)} km</div>
                    </div>
                    <div className="border-b border-r border-slate-200 p-4">
                      <div className="text-xs text-slate-500">Estimated duration</div>
                      <div className="mt-2 text-2xl font-bold">{Math.round(estimate.durationMin)} min</div>
                    </div>
                  </div>

                  <div className="mt-4 border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold">Price breakdown</div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Base fare</span><strong>{money(estimate.estimate.components.base)}</strong></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Distance component</span><strong>{money(estimate.estimate.components.distanceCost)}</strong></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Time component</span><strong>{money(estimate.estimate.components.timeCost)}</strong></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Configured multiplier</span><strong>×{Number(estimate.estimate.multipliers.totalMultiplier || 1).toFixed(2)}</strong></div>
                    </div>

                    {(estimate.estimate.multipliers.surge.applied ||
                      estimate.estimate.multipliers.night.applied ||
                      estimate.estimate.multipliers.weather.applied) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {estimate.estimate.multipliers.surge.applied && (
                          <span className="border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            {estimate.estimate.multipliers.surge.reason || 'Demand multiplier'}
                          </span>
                        )}
                        {estimate.estimate.multipliers.night.applied && (
                          <span className="border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
                            {estimate.estimate.multipliers.night.reason || 'Night multiplier'}
                          </span>
                        )}
                        {estimate.estimate.multipliers.weather.applied && (
                          <span className="border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {estimate.estimate.multipliers.weather.reason || 'Weather multiplier'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={requestTransport}
                    disabled={booking}
                    className="mt-5 w-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {booking ? 'Creating request…' : 'Confirm and request transport'}
                  </button>
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-lg font-semibold">How the request works</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {[
                  ['1', 'Price first', 'DENUEL calculates the estimate from the selected locations and configured vehicle pricing.'],
                  ['2', 'Verified drivers only', 'Matching drivers must be approved, verified and online before they can receive and accept requests.'],
                  ['3', 'Driver accepts', 'A request becomes assigned only when an eligible driver successfully accepts it.'],
                ].map(([number, title, description]) => (
                  <div key={number} className="border border-slate-200 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">{number}</div>
                    <div className="mt-4 font-semibold">{title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">Driver trust controls</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <p>Drivers must pass DENUEL approval before going online.</p>
                <p>Required driver verification documents are stored privately and reviewed by an administrator.</p>
                <p>Suspended drivers cannot receive or accept transport requests.</p>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold">Want to drive with DENUEL?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create a driver profile, add your vehicle and submit the required verification documents for review.
              </p>
              <Link href="/driver/apply" className="mt-4 inline-flex bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                Driver application
              </Link>
            </section>

            <section className="border border-blue-200 bg-blue-50 p-5">
              <h2 className="font-semibold">Pricing transparency</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                DENUEL shows a price only after real pickup/drop-off coordinates, a drivable route and an active pricing rule are available.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
