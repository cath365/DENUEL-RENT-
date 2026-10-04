'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface PendingProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  area?: string | null;
  addressText?: string | null;
  bedrooms: number;
  bathrooms: number;
  propertyType?: string | null;
  listingType: string;
  images: { url: string }[];
  owner: { id: string; name?: string | null; email: string; phone?: string | null };
  createdAt: string;
  status: string;
}

function priceLabel(property: PendingProperty) {
  const amount = 'K' + Number(property.price || 0).toLocaleString();
  return property.listingType === 'RENT' ? amount + ' / month' : amount;
}

export default function PendingPropertiesPage() {
  const [properties, setProperties] = useState<PendingProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingProperty | null>(null);
  const [processing, setProcessing] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/properties?status=PENDING');
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load pending properties.');
      }

      setProperties(Array.isArray(data.properties) ? data.properties : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load pending properties.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(property: PendingProperty) {
    setProcessing(property.id);
    setError('');

    try {
      const response = await fetch('/api/admin/properties/' + property.id + '/approve', {
        method: 'POST',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to approve this property.');
      }

      setProperties((current) => current.filter((item) => item.id !== property.id));
      setSelected(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to approve this property.');
    } finally {
      setProcessing('');
    }
  }

  async function reject(property: PendingProperty) {
    if (rejectionReason.trim().length < 5) {
      setError('Give the property owner a clear reason for the rejection.');
      return;
    }

    setProcessing(property.id);
    setError('');

    try {
      const response = await fetch('/api/admin/properties/' + property.id + '/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to reject this property.');
      }

      setProperties((current) => current.filter((item) => item.id !== property.id));
      setSelected(null);
      setRejectionReason('');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to reject this property.');
    } finally {
      setProcessing('');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">Admin · Property trust</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Pending property reviews
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review real listing information and photos before a property becomes public.
            </p>
          </div>
          <Link href="/admin" className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">
            Admin home
          </Link>
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 border border-slate-200 bg-white px-5 py-4">
          <span className="text-sm text-slate-500">Waiting for review</span>
          <span className="ml-3 text-xl font-bold text-slate-950">{properties.length}</span>
        </div>

        {loading ? (
          <div className="mt-6 border border-slate-200 bg-white p-10 text-sm text-slate-500">
            Loading pending properties…
          </div>
        ) : properties.length === 0 ? (
          <div className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-lg font-semibold text-slate-950">No pending properties</h2>
            <p className="mt-2 text-sm text-slate-500">
              New property submissions will appear here when real owners or agents submit them.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
            <div className="divide-y divide-slate-100 border border-slate-200 bg-white">
              {properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => {
                    setSelected(property);
                    setRejectionReason('');
                    setError('');
                  }}
                  className={`grid w-full gap-4 p-4 text-left transition sm:grid-cols-[140px_1fr] ${
                    selected?.id === property.id ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {property.images[0]?.url ? (
                      <img src={property.images[0].url} alt={property.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">No image</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">{property.title}</h2>
                      <span className="border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {property.listingType}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {[property.area, property.city].filter(Boolean).join(', ')}
                    </p>
                    <div className="mt-3 text-lg font-bold text-[#0F2B46]">{priceLabel(property)}</div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span>{property.propertyType || 'Type not supplied'}</span>
                      <span>{property.bedrooms} bedrooms</span>
                      <span>{property.bathrooms} bathrooms</span>
                    </div>
                    <div className="mt-3 text-xs text-slate-400">
                      Submitted {new Date(property.createdAt).toLocaleDateString('en-ZM')}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selected ? (
              <aside className="border border-slate-200 bg-white p-5 lg:sticky lg:top-24 lg:self-start">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">Review listing</h2>
                    <p className="mt-1 text-sm text-slate-500">{selected.title}</p>
                  </div>
                  <Link href={'/property/' + selected.id} target="_blank" className="text-sm font-semibold text-[#16A34A]">
                    Public preview ↗
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {selected.images.slice(0, 6).map((image) => (
                    <div key={image.url} className="aspect-square overflow-hidden bg-slate-100">
                      <img src={image.url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4 border-y border-slate-100 py-4 text-sm">
                  <div><div className="text-xs text-slate-400">Price</div><div className="mt-1 font-semibold">{priceLabel(selected)}</div></div>
                  <div><div className="text-xs text-slate-400">Type</div><div className="mt-1 font-semibold">{selected.propertyType || 'Not supplied'}</div></div>
                  <div><div className="text-xs text-slate-400">Bedrooms</div><div className="mt-1 font-semibold">{selected.bedrooms}</div></div>
                  <div><div className="text-xs text-slate-400">Bathrooms</div><div className="mt-1 font-semibold">{selected.bathrooms}</div></div>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{selected.description}</p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Submitted by</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{selected.owner.name || 'Unnamed owner'}</div>
                  <div className="mt-1 text-sm text-slate-500">{selected.owner.email}</div>
                  {selected.owner.phone && <div className="mt-1 text-sm text-slate-500">{selected.owner.phone}</div>}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => approve(selected)}
                    disabled={processing === selected.id}
                    className="bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {processing === selected.id ? 'Saving…' : 'Approve listing'}
                  </button>
                  <button
                    onClick={() => setRejectionReason(rejectionReason || ' ')}
                    className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  >
                    Needs changes
                  </button>
                </div>

                {rejectionReason !== '' && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Explain what must be corrected
                    </label>
                    <textarea
                      value={rejectionReason.trimStart()}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={4}
                      className="w-full border border-slate-300 p-3 text-sm outline-none focus:border-red-500"
                      placeholder="Give the owner a specific reason"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => reject(selected)}
                        disabled={processing === selected.id || rejectionReason.trim().length < 5}
                        className="bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        Reject and notify owner
                      </button>
                      <button onClick={() => setRejectionReason('')} className="border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </aside>
            ) : (
              <aside className="border border-slate-200 bg-white p-8 text-sm text-slate-500">
                Select a property to review its details and photos.
              </aside>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
