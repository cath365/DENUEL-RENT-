'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';
import { TRANSPORT_IMAGES } from '../../lib/transport/vehicleImages';

type Tab = 'book' | 'moving' | 'deliveries';

type VehicleOption = {
  id: 'MOTORBIKE' | 'CAR' | 'SUV' | 'VAN' | 'TRUCK_SMALL' | 'TRUCK_MEDIUM' | 'TRUCK_LARGE';
  name: string;
  description: string;
  image?: string;
};

type RoutePoint = {
  lat: number;
  lng: number;
  label: string;
};

type Estimate = {
  price: number;
  durationMin: number;
  distanceKm: number;
  breakdown?: any;
};

const VEHICLES: VehicleOption[] = [
  { id: 'MOTORBIKE', name: 'Motorbike', description: 'Fast option for one passenger or light delivery', image: TRANSPORT_IMAGES.motorbike },
  { id: 'CAR', name: 'Car / Taxi', description: 'Standard passenger ride', image: TRANSPORT_IMAGES.taxi },
  { id: 'SUV', name: 'SUV / 4x4', description: 'Extra space for passengers and luggage', image: TRANSPORT_IMAGES.suv },
  { id: 'VAN', name: 'Van / Minibus', description: 'Group transport or medium loads' },
  { id: 'TRUCK_SMALL', name: 'Small Truck', description: 'Furniture, appliances and small moves', image: TRANSPORT_IMAGES.small_truck },
  { id: 'TRUCK_MEDIUM', name: 'Medium Truck', description: 'Household and business moving jobs', image: TRANSPORT_IMAGES.medium_truck },
  { id: 'TRUCK_LARGE', name: 'Large Truck', description: 'Large moves and heavier cargo', image: TRANSPORT_IMAGES.large_truck },
];

const TAB_CONFIG: Record<Tab, { title: string; description: string; hero: string; vehicles: VehicleOption['id'][] }> = {
  book: {
    title: 'Book a ride',
    description: 'Request verified transport using real route and configured pricing.',
    hero: TRANSPORT_IMAGES.taxi,
    vehicles: ['MOTORBIKE', 'CAR', 'SUV', 'VAN'],
  },
  moving: {
    title: 'Moving services',
    description: 'Choose the truck size that fits your moving job.',
    hero: TRANSPORT_IMAGES.large_truck,
    vehicles: ['VAN', 'TRUCK_SMALL', 'TRUCK_MEDIUM', 'TRUCK_LARGE'],
  },
  deliveries: {
    title: 'Deliveries',
    description: 'Move parcels, goods and equipment across supported areas.',
    hero: TRANSPORT_IMAGES.small_truck,
    vehicles: ['MOTORBIKE', 'CAR', 'TRUCK_SMALL', 'TRUCK_MEDIUM'],
  },
};

async function geocodeAddress(query: string): Promise<RoutePoint> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error('Map search is not configured yet.');

  const url =
    'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
    encodeURIComponent(query) +
    '.json?access_token=' +
    encodeURIComponent(token) +
    '&country=ZM&limit=1&autocomplete=true';

  const response = await fetch(url);
  if (!response.ok) throw new Error('Unable to search that location.');

  const data = await response.json();
  const feature = data?.features?.[0];
  if (!feature?.center || feature.center.length < 2) {
    throw new Error('Location not found. Add more detail to the address.');
  }

  return {
    lng: Number(feature.center[0]),
    lat: Number(feature.center[1]),
    label: feature.place_name || query,
  };
}

export default function TransportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('book');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleOption['id']>('CAR');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [pickupPoint, setPickupPoint] = useState<RoutePoint | null>(null);
  const [dropoffPoint, setDropoffPoint] = useState<RoutePoint | null>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{ id: string } | null>(null);
  const [error, setError] = useState('');

  const current = TAB_CONFIG[activeTab];
  const visibleVehicles = useMemo(
    () => VEHICLES.filter((vehicle) => current.vehicles.includes(vehicle.id)),
    [current]
  );

  useEffect(() => {
    const first = TAB_CONFIG[activeTab].vehicles[0];
    setVehicleType(first);
    setEstimate(null);
    setError('');
  }, [activeTab]);

  function scheduledAtIso() {
    if (!scheduledDate || !scheduledTime) return null;
    const date = new Date(`${scheduledDate}T${scheduledTime}`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  async function getEstimate() {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) return;

    setEstimating(true);
    setError('');
    setEstimate(null);

    try {
      const [pickup, dropoff] = await Promise.all([
        geocodeAddress(pickupAddress.trim()),
        geocodeAddress(dropoffAddress.trim()),
      ]);

      setPickupPoint(pickup);
      setDropoffPoint(dropoff);

      const response = await fetch('/api/transport/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
          vehicleType,
          scheduledAt: scheduledAtIso(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Unable to calculate the route.');
      }

      setEstimate({
        price: Number(data.estimate?.finalPrice || 0),
        durationMin: Number(data.durationMin || 0),
        distanceKm: Number(data.distanceKm || 0),
        breakdown: data.estimate,
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to calculate a transport estimate.');
    } finally {
      setEstimating(false);
    }
  }

  async function handleBooking() {
    if (!estimate || !pickupPoint || !dropoffPoint) return;

    setBooking(true);
    setError('');

    try {
      const response = await fetch('/api/transport/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: pickupPoint.lat,
          pickupLng: pickupPoint.lng,
          pickupAddressText: pickupPoint.label,
          dropoffLat: dropoffPoint.lat,
          dropoffLng: dropoffPoint.lng,
          dropoffAddressText: dropoffPoint.label,
          vehicleType,
          scheduledAt: scheduledAtIso(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to create the booking.');

      setBookingSuccess({ id: data.id });
    } catch (err: any) {
      setError(err?.message || 'Unable to create the transport request.');
    } finally {
      setBooking(false);
    }
  }

  if (bookingSuccess) {
    return (
      <main className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="border border-emerald-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700">✓</div>
            <h1 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-[#0F2B46]">Transport request submitted</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your request has been recorded. Approved drivers matching this vehicle type can receive the request.
            </p>
            <div className="mt-6 border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-700">
              <div><strong>Reference:</strong> {bookingSuccess.id}</div>
              <div className="mt-2"><strong>Pickup:</strong> {pickupPoint?.label}</div>
              <div className="mt-2"><strong>Drop-off:</strong> {dropoffPoint?.label}</div>
              <div className="mt-2"><strong>Locked estimate:</strong> K{estimate?.price.toLocaleString()}</div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/dashboard" className="bg-[#0F2B46] px-5 py-3 text-sm font-semibold text-white">Open dashboard</Link>
              <button
                onClick={() => {
                  setBookingSuccess(null);
                  setEstimate(null);
                  setPickupPoint(null);
                  setDropoffPoint(null);
                  setPickupAddress('');
                  setDropoffAddress('');
                }}
                className="border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                New request
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_430px] lg:items-center">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">Ng’anda Transport</div>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.04em] text-[#0F2B46] sm:text-5xl">
              Transport that connects with your property journey.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Book a ride, request a moving truck or arrange a delivery. Prices only appear after a real route is found and an admin-configured pricing rule is available.
            </p>

            <div className="mt-7 grid gap-2 sm:grid-cols-3">
              {([
                ['book', 'Book a ride'],
                ['moving', 'Moving'],
                ['deliveries', 'Deliveries'],
              ] as [Tab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`border px-4 py-3 text-sm font-semibold transition ${
                    activeTab === tab
                      ? 'border-[#0F2B46] bg-[#0F2B46] text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-[#0F2B46]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-56 items-center justify-center border border-slate-200 bg-[#F8F9FA] p-6">
            <img src={current.hero} alt="" className="max-h-64 w-full object-contain" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="border border-slate-200 bg-white p-5 sm:p-7">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-2xl font-bold text-[#0F2B46]">{current.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{current.description}</p>
          </div>

          {error && (
            <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Pickup location</label>
                <input
                  value={pickupAddress}
                  onChange={(e) => {
                    setPickupAddress(e.target.value);
                    setEstimate(null);
                  }}
                  placeholder="e.g. Kabulonga, Lusaka"
                  className="h-12 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Drop-off location</label>
                <input
                  value={dropoffAddress}
                  onChange={(e) => {
                    setDropoffAddress(e.target.value);
                    setEstimate(null);
                  }}
                  placeholder="e.g. Levy Junction, Lusaka"
                  className="h-12 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-800">Choose vehicle</label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleVehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => {
                      setVehicleType(vehicle.id);
                      setEstimate(null);
                    }}
                    className={`min-h-44 border p-3 text-left transition ${
                      vehicleType === vehicle.id
                        ? 'border-[#16A34A] bg-emerald-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="flex h-24 items-center justify-center bg-[#F8F9FA]">
                      {vehicle.image ? (
                        <img src={vehicle.image} alt="" className="h-full w-full object-contain p-2" />
                      ) : (
                        <div className="text-xs font-medium text-slate-400">Image coming soon</div>
                      )}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-950">{vehicle.name}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{vehicle.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">Schedule for later <span className="font-normal text-slate-400">(optional)</span></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-12 border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
                />
              </div>
            </div>

            <button
              onClick={getEstimate}
              disabled={!pickupAddress.trim() || !dropoffAddress.trim() || estimating}
              className="bg-[#16A34A] px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {estimating ? 'Calculating real route…' : 'Get route & price'}
            </button>

            {estimate && (
              <div className="border border-emerald-200 bg-emerald-50/40 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Price</div>
                    <div className="mt-1 text-2xl font-bold text-[#0F2B46]">K{estimate.price.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Road distance</div>
                    <div className="mt-1 text-2xl font-bold text-[#0F2B46]">{estimate.distanceKm.toFixed(1)} km</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Route time</div>
                    <div className="mt-1 text-2xl font-bold text-[#0F2B46]">{estimate.durationMin} min</div>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Route distance/time comes from Mapbox. The price comes from the active Ng’anda pricing rule for the selected vehicle.
                </p>
                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="mt-5 w-full bg-[#0F2B46] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {booking ? 'Submitting request…' : 'Confirm transport request'}
                </button>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-[#0F2B46]">Become a transport provider</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Register your vehicle and submit the required identity, licence, registration, insurance and clearance documents.
            </p>
            <Link href="/driver/apply" className="mt-4 inline-flex w-full justify-center bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white">
              Driver registration
            </Link>
          </section>

          <section className="border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-[#0F2B46]">How matching works</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div><strong className="text-slate-900">1. Route</strong><div className="mt-1">Ng’anda geocodes both addresses and requests a real road route.</div></div>
              <div><strong className="text-slate-900">2. Pricing</strong><div className="mt-1">The platform applies only active pricing rules configured by the admin.</div></div>
              <div><strong className="text-slate-900">3. Drivers</strong><div className="mt-1">Only approved, online drivers with the selected vehicle type are considered.</div></div>
              <div><strong className="text-slate-900">4. Request</strong><div className="mt-1">Your confirmed estimate is recorded with the request for transparency.</div></div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
