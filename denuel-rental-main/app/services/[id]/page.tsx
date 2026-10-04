'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : [];
  }
}

export default function ServiceProviderProfilePage() {
  const params = useParams();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState({
    serviceType: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  });

  useEffect(() => {
    setLoading(true);
    fetch('/api/services/' + params.id)
      .then((res) => res.json())
      .then((data) => setProvider(data))
      .catch(() => setProvider(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const services = useMemo(() => formatArray(provider?.servicesOffered), [provider]);
  const serviceAreas = useMemo(() => formatArray(provider?.serviceAreas), [provider]);
  const languages = useMemo(() => formatArray(provider?.languages), [provider]);

  async function submitBooking() {
    if (!provider || !booking.scheduledDate || !booking.scheduledTime) return;

    const res = await fetch('/api/services/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: provider.id,
        serviceType: booking.serviceType || services[0] || humanize(provider.category),
        scheduledAt: new Date(booking.scheduledDate + 'T' + booking.scheduledTime),
        notes: booking.notes,
      }),
    });

    if (res.ok) {
      setBookingOpen(false);
      setBooking({ serviceType: '', scheduledDate: '', scheduledTime: '', notes: '' });
      alert('Booking request sent.');
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || data.message || 'Unable to send booking request.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="h-72 animate-pulse bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!provider?.id) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h1 className="text-2xl font-bold">Service provider not found</h1>
          <Link href="/services" className="mt-4 inline-flex text-sm font-semibold text-blue-700">Back to services</Link>
        </main>
      </div>
    );
  }

  const companyName = provider.businessName || 'Service provider';
  const initials = companyName.slice(0, 2).toUpperCase();
  const category = humanize(provider.category);
  const whatsappDigits = (provider.whatsappNumber || provider.phone || '').replace(/[^\d]/g, '');
  const whatsappHref = whatsappDigits ? 'https://wa.me/' + whatsappDigits + '?text=' + encodeURIComponent('Hello, I found your profile on DENUEL and I would like to enquire about your services.') : null;
  const verifiedDocuments = Array.isArray(provider.documents) ? provider.documents : [];
  const portfolio = Array.isArray(provider.portfolio) ? provider.portfolio : [];
  const reviews = Array.isArray(provider.reviews) ? provider.reviews : [];
  const details = provider.categoryDetails && typeof provider.categoryDetails === 'object' ? provider.categoryDetails : {};

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <section className="overflow-hidden border border-slate-200 bg-white">
          <div className="relative h-44 bg-slate-200 sm:h-56">
            {provider.coverPhotoUrl ? (
              <img src={provider.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(120deg,#0f172a,#334155)]" />
            )}
          </div>

          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 text-2xl font-bold text-slate-500 sm:h-32 sm:w-32">
                  {provider.logoUrl || provider.profilePhotoUrl ? (
                    <img src={provider.logoUrl || provider.profilePhotoUrl} alt={companyName} className="h-full w-full object-cover" />
                  ) : initials}
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-3xl">{companyName}</h1>
                    {provider.isVerified && <span className="border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">Verified provider</span>}
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-600">{category}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[provider.area, provider.city].filter(Boolean).join(', ')}
                    {provider.yearsInBusiness ? ' · ' + provider.yearsInBusiness + ' years in business' : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="bg-[#128C7E] px-4 py-2.5 text-sm font-semibold text-white">WhatsApp</a>}
                {provider.phone && <a href={'tel:' + provider.phone} className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800">Call</a>}
                <button onClick={() => setBookingOpen(true)} className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Request service</button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <span><strong className="text-slate-950">{Number(provider.ratingAvg || 0).toFixed(1)}</strong> rating</span>
              <span><strong className="text-slate-950">{provider.ratingCount || 0}</strong> reviews</span>
              <span><strong className="text-slate-950">{provider.completedJobs || 0}</strong> completed jobs</span>
              {provider.teamSize ? <span><strong className="text-slate-950">{provider.teamSize}</strong> team members</span> : null}
              {provider.responseTimeText ? <span>Typical response: <strong className="text-slate-950">{provider.responseTimeText}</strong></span> : null}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">About</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
                {provider.bio || provider.description || 'This provider has not added a company description yet.'}
              </p>

              <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                <div><div className="text-xs font-medium uppercase tracking-wide text-slate-400">Business type</div><div className="mt-1 text-sm font-semibold text-slate-900">{category}</div></div>
                <div><div className="text-xs font-medium uppercase tracking-wide text-slate-400">Service area</div><div className="mt-1 text-sm font-semibold text-slate-900">{[provider.area, provider.city].filter(Boolean).join(', ') || 'Not specified'}</div></div>
                <div><div className="text-xs font-medium uppercase tracking-wide text-slate-400">Website</div><div className="mt-1 text-sm font-semibold text-slate-900">{provider.website || 'Not provided'}</div></div>
                <div><div className="text-xs font-medium uppercase tracking-wide text-slate-400">Languages</div><div className="mt-1 text-sm font-semibold text-slate-900">{languages.length ? languages.join(', ') : 'Not specified'}</div></div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">Services offered</h2>
              {services.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {services.map((service) => <div key={service} className="border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800">{service}</div>)}
                </div>
              ) : <p className="mt-3 text-sm text-slate-500">No services have been listed yet.</p>}
            </section>

            <section className="border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">Coverage and availability</h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Service areas</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(serviceAreas.length ? serviceAreas : [provider.city]).filter(Boolean).map((area) => <span key={area} className="border border-slate-300 px-3 py-2 text-xs text-slate-700">{area}</span>)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Working hours</h3>
                  {provider.workingHours && typeof provider.workingHours === 'object' ? (
                    <div className="mt-3 space-y-2">
                      {Object.entries(provider.workingHours).map(([day, hours]: any) => <div key={day} className="flex justify-between gap-4 text-sm"><span className="capitalize text-slate-500">{day}</span><span className="font-medium text-slate-800">{String(hours)}</span></div>)}
                    </div>
                  ) : <p className="mt-3 text-sm text-slate-500">Working hours not provided.</p>}
                </div>
              </div>
            </section>

            {provider.category === 'SECURITY' && (
              <section className="border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-bold text-slate-950">Security company capabilities</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Information supplied by the provider and verification records held by DENUEL.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    ['Guarding services', details.guardingServices || 'Not specified'],
                    ['CCTV & surveillance', details.cctv || 'Not specified'],
                    ['Alarm response', details.alarmResponse || 'Not specified'],
                    ['Patrol services', details.patrolServices || 'Not specified'],
                    ['Control room', details.controlRoom || 'Not specified'],
                    ['Coverage model', details.coverageModel || 'Not specified'],
                    ['Emergency service', provider.emergencyService ? 'Available' : 'Not stated'],
                    ['Staff background checks', provider.backgroundCheckedStaff ? 'Confirmed by provider' : 'Not stated'],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-slate-100 pb-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {portfolio.length > 0 && (
              <section className="border border-slate-200 bg-white p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Portfolio</h2>
                    <p className="mt-1 text-sm text-slate-500">Previous work uploaded by the provider.</p>
                  </div>
                  <span className="text-sm text-slate-500">{portfolio.length} projects</span>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {portfolio.map((item: any) => (
                    <div key={item.id} className="border border-slate-200">
                      <div className="aspect-[4/3] bg-slate-100"><img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /></div>
                      <div className="p-3"><div className="text-sm font-semibold text-slate-900">{item.title}</div>{item.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="border border-slate-200 bg-white p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Client reviews</h2>
                  <p className="mt-1 text-sm text-slate-500">Feedback from DENUEL users.</p>
                </div>
                <div className="text-right"><div className="text-2xl font-bold text-slate-950">{Number(provider.ratingAvg || 0).toFixed(1)}</div><div className="text-xs text-slate-500">{provider.ratingCount || 0} reviews</div></div>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {reviews.length ? reviews.slice(0, 8).map((review: any) => (
                  <div key={review.id} className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-slate-900">{review.reviewer?.name || 'Client'}</div>
                      <div className="text-xs font-semibold text-slate-600">{review.rating}/5</div>
                    </div>
                    {review.review && <p className="mt-2 text-sm leading-6 text-slate-600">{review.review}</p>}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                      {review.qualityRating ? <span>Quality {review.qualityRating}/5</span> : null}
                      {review.timelinessRating ? <span>Timeliness {review.timelinessRating}/5</span> : null}
                      {review.priceRating ? <span>Value {review.priceRating}/5</span> : null}
                    </div>
                  </div>
                )) : <p className="py-5 text-sm text-slate-500">No reviews yet.</p>}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">Trust & verification</h2>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ['DENUEL verified', provider.isVerified],
                  ['Business registration supplied', Boolean(provider.companyRegistrationNumber)],
                  ['TPIN supplied', Boolean(provider.tpinNumber)],
                  ['Licence supplied', Boolean(provider.licenseNumber)],
                  ['Insured', Boolean(provider.insured)],
                  ['Background-checked staff', Boolean(provider.backgroundCheckedStaff)],
                ].map(([label, ok]: any) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">{label}</span>
                    <span className={ok ? 'font-semibold text-emerald-700' : 'text-slate-400'}>{ok ? 'Yes' : 'Not confirmed'}</span>
                  </div>
                ))}
              </div>

              {verifiedDocuments.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Verified documents</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {verifiedDocuments.map((doc: any, index: number) => <span key={index} className="border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800">{humanize(doc.type)}</span>)}
                  </div>
                </div>
              )}

              <p className="mt-5 text-xs leading-5 text-slate-500">DENUEL shows verification status, not private document numbers or document files.</p>
            </section>

            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">Contact company</h2>
              <div className="mt-4 grid gap-2">
                {whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="bg-[#128C7E] px-4 py-3 text-center text-sm font-semibold text-white">WhatsApp</a>}
                {provider.phone && <a href={'tel:' + provider.phone} className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800">Call {provider.phone}</a>}
                {provider.email && <a href={'mailto:' + provider.email} className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800">Email company</a>}
                <button onClick={() => setBookingOpen(true)} className="bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Request a quote / booking</button>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-semibold text-slate-950">Business details</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div><div className="text-xs text-slate-400">Address</div><div className="mt-1 font-medium text-slate-800">{provider.address || [provider.area, provider.city].filter(Boolean).join(', ')}</div></div>
                <div><div className="text-xs text-slate-400">Price range</div><div className="mt-1 font-medium text-slate-800">{provider.priceRange || (provider.hourlyRate ? 'From K' + provider.hourlyRate.toLocaleString() + '/hour' : 'Contact for quote')}</div></div>
                {provider.minimumCharge ? <div><div className="text-xs text-slate-400">Minimum charge</div><div className="mt-1 font-medium text-slate-800">K{provider.minimumCharge.toLocaleString()}</div></div> : null}
                {provider.insured && provider.insuranceProvider ? <div><div className="text-xs text-slate-400">Insurance</div><div className="mt-1 font-medium text-slate-800">{provider.insuranceProvider}</div></div> : null}
              </div>
            </section>
          </aside>
        </div>
      </main>

      {bookingOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Request service</h2><button onClick={() => setBookingOpen(false)} className="text-sm font-semibold text-slate-500">Close</button></div>
            <div className="mt-5 grid gap-3">
              <select value={booking.serviceType} onChange={(e) => setBooking({ ...booking, serviceType: e.target.value })} className="h-11 border border-slate-300 px-3 text-sm">
                <option value="">Select service</option>
                {services.map((service) => <option key={service}>{service}</option>)}
              </select>
              <input type="date" value={booking.scheduledDate} onChange={(e) => setBooking({ ...booking, scheduledDate: e.target.value })} className="h-11 border border-slate-300 px-3 text-sm" />
              <input type="time" value={booking.scheduledTime} onChange={(e) => setBooking({ ...booking, scheduledTime: e.target.value })} className="h-11 border border-slate-300 px-3 text-sm" />
              <textarea rows={4} value={booking.notes} onChange={(e) => setBooking({ ...booking, notes: e.target.value })} placeholder="Describe what you need" className="border border-slate-300 p-3 text-sm" />
              <button onClick={submitBooking} className="bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Send request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
