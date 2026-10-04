'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ServiceCategory =
  | 'HOME_INSPECTOR' | 'MOVER' | 'CLEANER' | 'PHOTOGRAPHER' | 'CONTRACTOR'
  | 'ELECTRICIAN' | 'PLUMBER' | 'PAINTER' | 'LANDSCAPER' | 'PEST_CONTROL'
  | 'HOME_INSURANCE' | 'HOME_WARRANTY' | 'LEGAL' | 'MORTGAGE_BROKER'
  | 'INTERIOR_DESIGNER' | 'SECURITY' | 'HVAC' | 'ROOFING' | 'FLOORING' | 'OTHER';

interface ServiceProvider {
  id: string;
  businessName: string;
  description?: string;
  category: ServiceCategory;
  phone?: string;
  email?: string;
  servicesOffered?: string[];
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  priceRange?: string;
  logoUrl?: string;
  yearsInBusiness?: number;
  city?: string;
  area?: string;
}

interface ServiceReview {
  id: string;
  rating: number;
  review: string;
  createdAt: string;
  reviewer: { name: string };
}

interface Props {
  defaultCategory?: ServiceCategory;
  defaultCity?: string;
  className?: string;
}

const categories: { value: ServiceCategory; label: string }[] = [
  { value: 'MOVER', label: 'Moving' },
  { value: 'CLEANER', label: 'Cleaning' },
  { value: 'PLUMBER', label: 'Plumbing' },
  { value: 'ELECTRICIAN', label: 'Electrical' },
  { value: 'PAINTER', label: 'Painting' },
  { value: 'LANDSCAPER', label: 'Landscaping' },
  { value: 'PEST_CONTROL', label: 'Pest control' },
  { value: 'HOME_INSPECTOR', label: 'Inspection' },
  { value: 'INTERIOR_DESIGNER', label: 'Interior design' },
  { value: 'SECURITY', label: 'Security' },
];

export default function ServicesMarketplace({ defaultCategory, defaultCity = 'Lusaka', className = '' }: Props) {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ServiceCategory | ''>(defaultCategory || '');
  const [city, setCity] = useState(defaultCity);
  const [showBooking, setShowBooking] = useState(false);
  const [booking, setBooking] = useState({ date: '', time: '', notes: '', address: '' });

  useEffect(() => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (city) p.set('city', city);

    setLoading(true);
    fetch('/api/services?' + p.toString())
      .then((r) => r.json())
      .then((data) => setProviders(Array.isArray(data.providers) ? data.providers : []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, [category, city]);

  const openProvider = async (id: string) => {
    const [providerRes, reviewsRes] = await Promise.all([
      fetch('/api/services/' + id),
      fetch('/api/services/reviews?providerId=' + id),
    ]);

    if (providerRes.ok) setSelectedProvider(await providerRes.json());
    if (reviewsRes.ok) {
      const data = await reviewsRes.json();
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    }
  };

  const submitBooking = async () => {
    if (!selectedProvider || !booking.date || !booking.time) return;

    const response = await fetch('/api/services/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: selectedProvider.id,
        scheduledDate: booking.date + 'T' + booking.time,
        notes: booking.notes,
        address: booking.address,
      }),
    });

    if (response.ok) {
      setShowBooking(false);
      setBooking({ date: '', time: '', notes: '', address: '' });
      alert('Booking request sent.');
    }
  };

  const categoryLabel = (value: string) => categories.find((item) => item.value === value)?.label || value.replaceAll('_', ' ').toLowerCase();

  return (
    <div className={className}>
      <div className="grid gap-3 border border-slate-300 bg-white p-4 sm:grid-cols-[1fr_220px]">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory('')} className={`border px-3 py-2 text-sm font-medium ${!category ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 text-slate-700'}`}>
            All services
          </button>
          {categories.map((item) => (
            <button
              key={item.value}
              onClick={() => setCategory(item.value)}
              className={`border px-3 py-2 text-sm font-medium ${category === item.value ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 text-slate-700'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <select value={city} onChange={(e) => setCity(e.target.value)} className="h-10 border border-slate-300 bg-white px-3 text-sm">
          <option>Lusaka</option>
          <option>Kitwe</option>
          <option>Ndola</option>
          <option>Livingstone</option>
          <option>Solwezi</option>
          <option>Kabwe</option>
        </select>
      </div>

      <div className="mt-6">
        <div className="mb-4 text-sm text-slate-500">
          {loading ? 'Loading providers…' : providers.length + ' providers found'}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse border border-slate-200 bg-slate-100" />)}
          </div>
        ) : providers.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <Link
                key={provider.id}
                href={'/services/' + provider.id}
                className="border border-slate-200 bg-white p-5 text-left transition hover:border-slate-400"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg font-semibold text-slate-500">
                    {provider.logoUrl ? <img src={provider.logoUrl} alt={provider.businessName} className="h-full w-full object-cover" /> : provider.businessName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-950">{provider.businessName}</h3>
                      {provider.isVerified && <span className="text-xs font-semibold text-blue-700">Verified</span>}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{categoryLabel(provider.category)}</div>
                    <div className="mt-1 text-sm text-slate-500">{Number(provider.ratingAvg || 0).toFixed(1)} rating · {provider.ratingCount || 0} reviews</div>
                  </div>
                </div>

                {provider.description && <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{provider.description}</p>}

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {provider.yearsInBusiness ? <span>{provider.yearsInBusiness} years in business</span> : null}
                  {provider.priceRange ? <span>{provider.priceRange}</span> : null}
                  {provider.city ? <span>{provider.area ? provider.area + ', ' : ''}{provider.city}</span> : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-slate-200 bg-slate-50 p-10">
            <h3 className="text-lg font-semibold text-slate-950">No providers found</h3>
            <p className="mt-2 text-sm text-slate-500">Try another service category or city.</p>
          </div>
        )}
      </div>

      {selectedProvider && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white">
            <div className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-950">{selectedProvider.businessName}</h2>
                  {selectedProvider.isVerified && <span className="text-xs font-semibold text-blue-700">Verified</span>}
                </div>
                <p className="mt-1 text-sm text-slate-500">{categoryLabel(selectedProvider.category)} · {Number(selectedProvider.ratingAvg || 0).toFixed(1)} rating</p>
              </div>
              <button onClick={() => { setSelectedProvider(null); setShowBooking(false); }} className="text-sm font-semibold text-slate-500">Close</button>
            </div>

            <div className="space-y-6 p-5">
              {selectedProvider.description && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-950">About</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{selectedProvider.description}</p>
                </section>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedProvider.phone && <a href={'tel:' + selectedProvider.phone} className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800">Call provider</a>}
                {selectedProvider.email && <a href={'mailto:' + selectedProvider.email} className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800">Email provider</a>}
              </div>

              <button onClick={() => setShowBooking(!showBooking)} className="w-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                Request a booking
              </button>

              {showBooking && (
                <div className="grid gap-3 border border-slate-200 bg-slate-50 p-4">
                  <input type="date" value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })} className="h-11 border border-slate-300 bg-white px-3 text-sm" />
                  <input type="time" value={booking.time} onChange={(e) => setBooking({ ...booking, time: e.target.value })} className="h-11 border border-slate-300 bg-white px-3 text-sm" />
                  <input value={booking.address} onChange={(e) => setBooking({ ...booking, address: e.target.value })} placeholder="Service address" className="h-11 border border-slate-300 bg-white px-3 text-sm" />
                  <textarea value={booking.notes} onChange={(e) => setBooking({ ...booking, notes: e.target.value })} placeholder="What do you need help with?" rows={4} className="border border-slate-300 bg-white p-3 text-sm" />
                  <button onClick={submitBooking} className="bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Send request</button>
                </div>
              )}

              <section className="border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-950">Recent reviews</h3>
                <div className="mt-4 space-y-4">
                  {reviews.length ? reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="border-b border-slate-100 pb-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-slate-900">{review.reviewer?.name || 'Customer'}</span>
                        <span className="text-xs text-slate-500">{review.rating}/5</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{review.review}</p>
                    </div>
                  )) : <p className="text-sm text-slate-500">No reviews yet.</p>}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
