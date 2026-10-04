'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

function formatLocation(property: any) {
  return [property?.area, property?.city].filter(Boolean).join(', ') || property?.city || 'Location not supplied';
}

function priceLabel(property: any) {
  const amount = 'K' + Number(property?.price || 0).toLocaleString();
  return property?.listingType === 'RENT' ? amount + ' / month' : amount;
}

function statusClasses(status: string) {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700';
  if (status === 'PENDING') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

export default function DashboardPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');

  async function fetchMine() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/properties/mine');
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to load your properties.');
      }

      setProperties(Array.isArray(data.items) ? data.items : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your properties.');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMine();
  }, []);

  const stats = useMemo(() => ({
    total: properties.length,
    approved: properties.filter((p) => p.status === 'APPROVED').length,
    pending: properties.filter((p) => p.status === 'PENDING').length,
    rejected: properties.filter((p) => p.status === 'REJECTED').length,
  }), [properties]);

  async function removeProperty(property: any) {
    if (!window.confirm('Delete this property listing? This cannot be undone.')) return;

    setDeleting(property.id);
    setError('');

    try {
      const response = await csrfFetch('/api/properties/' + property.id, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        throw new Error(data.error || 'Unable to delete this property.');
      }

      setProperties((current) => current.filter((item) => item.id !== property.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete this property.');
    } finally {
      setDeleting('');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">Property management</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              My properties
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage only the properties you have actually submitted to Ng&apos;anda.
            </p>
          </div>

          <Link
            href="/dashboard/properties/new"
            className="inline-flex w-fit bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Add property
          </Link>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Total listings', stats.total],
            ['Approved', stats.approved],
            ['Pending review', stats.pending],
            ['Needs changes', stats.rejected],
          ].map(([label, value]) => (
            <div key={label} className="border-b border-r border-slate-200 bg-white p-5">
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
            </div>
          ))}
        </section>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-6 border border-slate-200 bg-white p-10 text-sm text-slate-500">
            Loading your properties…
          </div>
        ) : properties.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">No properties yet</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Your property list starts empty. Add a real property when you are ready; nothing is preloaded or generated for you.
            </p>
            <Link
              href="/dashboard/properties/new"
              className="mt-5 inline-flex bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add your first property
            </Link>
          </section>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {properties.map((property) => {
              const image = property.images?.[0]?.url;

              return (
                <article
                  key={property.id}
                  className="grid gap-5 p-4 sm:grid-cols-[180px_minmax(0,1fr)_190px] sm:items-center sm:p-5"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {image ? (
                      <img src={image} alt={property.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-slate-400">
                        No property photo
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-950">{property.title}</h2>
                      <span className={`px-2.5 py-1 text-xs font-semibold ${statusClasses(property.status)}`}>
                        {property.status === 'REJECTED' ? 'NEEDS CHANGES' : property.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">{formatLocation(property)}</p>
                    <div className="mt-3 text-xl font-bold text-[#0F2B46]">{priceLabel(property)}</div>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                      <span>{property.propertyType || 'Property type not supplied'}</span>
                      <span>{property.bedrooms} bedrooms</span>
                      <span>{property.bathrooms} bathrooms</span>
                    </div>

                    {property.status === 'REJECTED' && property.rejectionReason && (
                      <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
                        <strong>Admin feedback:</strong> {property.rejectionReason}
                      </div>
                    )}

                    {property.status === 'PENDING' && (
                      <p className="mt-4 text-sm text-amber-700">
                        This listing is waiting for admin review and is not public yet.
                      </p>
                    )}

                    {property.status === 'APPROVED' && (
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>{Number(property.viewCount || 0).toLocaleString()} real views</span>
                        <span>{Number(property.saveCount || 0).toLocaleString()} real saves</span>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    {property.status === 'APPROVED' && (
                      <Link
                        href={'/property/' + property.id}
                        className="border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
                      >
                        View public listing
                      </Link>
                    )}

                    <Link
                      href={'/dashboard/properties/' + property.id + '/edit'}
                      className="border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
                    >
                      Edit property
                    </Link>

                    <button
                      onClick={() => removeProperty(property)}
                      disabled={deleting === property.id}
                      className="border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                    >
                      {deleting === property.id ? 'Deleting…' : 'Delete property'}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
