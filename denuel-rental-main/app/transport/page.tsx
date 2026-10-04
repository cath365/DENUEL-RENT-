'use client';

import { useMemo, useState } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';

type Tab = 'book' | 'moving' | 'deliveries';

const VEHICLES = [
  { id: 'CAR', name: 'Car / Sedan', image: '/transport/car.svg', description: 'Passenger trips', tabs: ['book', 'deliveries'] },
  { id: 'SUV', name: 'SUV', image: '/transport/suv.svg', description: 'More passenger and luggage space', tabs: ['book', 'deliveries'] },
  { id: 'VAN', name: 'Van / Minibus', image: '/transport/van.svg', description: 'Groups, luggage and light moving', tabs: ['book', 'moving', 'deliveries'] },
  { id: 'MOTORBIKE', name: 'Motorbike', image: '/transport/motorbike.svg', description: 'Small and lightweight deliveries', tabs: ['deliveries'] },
  { id: 'TRUCK_SMALL', name: 'Pickup / Small truck', image: '/transport/pickup.svg', description: 'Small moving and delivery jobs', tabs: ['moving', 'deliveries'] },
  { id: 'TRUCK_MEDIUM', name: 'Moving truck', image: '/transport/moving-truck.svg', description: 'Furniture and larger loads', tabs: ['moving', 'deliveries'] },
] as const;

async function geocodeAddress(address: string) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error('Location search is not configured yet.');

  const query = encodeURIComponent(address + ', Zambia');
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&country=ZM&limit=1`
  );
  const data = await response.json();

  if (!response.ok || !data?.features?.length) {
    throw new Error(`We could not find "${address}". Add the area, town or city and try again.`);
  }

  const [lng, lat] = data.features[0].center;
  return { lat, lng, label: data.features[0].place_name || address };
}

export default function TransportPage() {
  const [activeTab, setActiveTab] = useState<Tab>('book');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const visibleVehicles = useMemo(
    () => VEHICLES.filter((vehicle) => (vehicle.tabs as readonly string[]).includes(activeTab)),
    [activeTab]
  );

  function changeTab(tab: Tab) {
    setActiveTab(tab);
    setResult(null);
    setError('');
    const first = VEHICLES.find((vehicle) => (vehicle.tabs as readonly string[]).includes(tab));
    if (first) setVehicleType(first.id);
  }

  async function requestTransport() {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      setError('Enter both pickup and drop-off locations.');
      return;
    }

    setSubmitting(true);
    setError('');
    setResult(null);

    try {
      const [pickup, dropoff] = await Promise.all([
        geocodeAddress(pickupAddress.trim()),
        geocodeAddress(dropoffAddress.trim()),
      ]);

      const scheduledAt =
        scheduledDate && scheduledTime
          ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
          : null;

      const response = await fetch('/api/transport/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          pickupAddressText: pickup.label,
          dropoffLat: dropoff.lat,
          dropoffLng: dropoff.lng,
          dropoffAddressText: dropoff.label,
          vehicleType,
          scheduledAt,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to create the transport request.');

      setPickupAddress(pickup.label);
      setDropoffAddress(dropoff.label);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the transport request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Header />

      <section className="border-b border-slate-200 bg-[#0F2B46] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">DENUEL Transport</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Transport & moving services</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
            Request passenger transport, moving vehicles and deliveries from verified providers as they join DENUEL.
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2 sm:flex sm:gap-3">
            {([
              ['book', 'Book a ride'],
              ['moving', 'Moving'],
              ['deliveries', 'Deliveries'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`min-h-12 border px-3 py-3 text-sm font-semibold sm:px-5 ${
                  activeTab === id
                    ? 'border-white bg-white text-[#0F2B46]'
                    : 'border-slate-500 bg-transparent text-white hover:border-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px]">
        <section className="border border-slate-200 bg-white p-5 sm:p-7">
          <h2 className="text-2xl font-bold text-slate-950">
            {activeTab === 'book' ? 'Request a ride' : activeTab === 'moving' ? 'Request moving transport' : 'Request a delivery'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">Vehicle availability and pricing come from the live platform. DENUEL does not display invented availability or prices.</p>

          {error && <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Pickup location</span>
              <input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="e.g. Northmead, Lusaka" className="h-12 w-full border border-slate-300 px-4 outline-none focus:border-[#16A34A]" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">Drop-off location</span>
              <input value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="e.g. Kabulonga, Lusaka" className="h-12 w-full border border-slate-300 px-4 outline-none focus:border-[#16A34A]" />
            </label>
          </div>

          <div className="mt-7">
            <div className="mb-3 text-sm font-semibold text-slate-800">Choose vehicle type</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visibleVehicles.map((vehicle) => (
                <button
                  type="button"
                  key={vehicle.id}
                  onClick={() => setVehicleType(vehicle.id)}
                  className={`overflow-hidden border text-left transition ${
                    vehicleType === vehicle.id
                      ? 'border-[#16A34A] ring-2 ring-[#16A34A]/20'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="aspect-[16/9] bg-white p-2">
                    <img src={vehicle.image} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div className="border-t border-slate-100 p-3">
                    <div className="text-sm font-bold text-slate-950">{vehicle.name}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">{vehicle.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Vehicle images are category illustrations. Actual vehicles are shown only after real providers register.</p>
          </div>

          <div className="mt-7">
            <div className="mb-2 text-sm font-semibold text-slate-800">Schedule for later <span className="font-normal text-slate-500">(optional)</span></div>
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="h-12 border border-slate-300 px-3" />
              <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="h-12 border border-slate-300 px-3" />
            </div>
          </div>

          <button
            onClick={requestTransport}
            disabled={submitting || !pickupAddress || !dropoffAddress}
            className="mt-7 w-full bg-[#16A34A] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#12813b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Checking route and availability…' : 'Request transport'}
          </button>

          {result && (
            <div className="mt-6 border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="font-bold text-slate-950">Transport request created</h3>
              <p className="mt-1 text-sm text-slate-600">Your request uses the live route and pricing configuration.</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div><div className="font-bold text-slate-950">{typeof result.distanceKm === 'number' ? result.distanceKm.toFixed(1) + ' km' : '—'}</div><div className="text-xs text-slate-500">Distance</div></div>
                <div><div className="font-bold text-slate-950">{typeof result.durationMin === 'number' ? Math.round(result.durationMin) + ' min' : '—'}</div><div className="text-xs text-slate-500">Estimate</div></div>
                <div><div className="font-bold text-[#16A34A]">{typeof result?.estimate?.finalPrice === 'number' ? 'K' + result.estimate.finalPrice.toFixed(2) : 'Pending'}</div><div className="text-xs text-slate-500">Price</div></div>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="border border-slate-200 bg-white p-5">
            <img src="/transport/moving-truck.svg" alt="" className="h-36 w-full object-contain" />
            <h2 className="mt-3 text-xl font-bold text-slate-950">Drive or move with DENUEL</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Register your real vehicle and submit the required documents for review.</p>
            <Link href="/driver/apply" className="mt-4 inline-flex w-full justify-center bg-[#0F2B46] px-4 py-3 text-sm font-semibold text-white">Register as a driver</Link>
          </div>

          <div className="border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-950">How it works</h3>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li><strong className="text-slate-950">1.</strong> Enter real pickup and destination locations.</li>
              <li><strong className="text-slate-950">2.</strong> Select the vehicle category you need.</li>
              <li><strong className="text-slate-950">3.</strong> DENUEL checks the configured route and pricing service.</li>
              <li><strong className="text-slate-950">4.</strong> Approved online drivers can receive the request.</li>
            </ol>
          </div>
        </aside>
      </div>
    </main>
  );
}
