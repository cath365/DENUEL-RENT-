"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import { csrfFetch } from '../../../lib/csrf';

type StatusFilter = 'ALL' | 'APPROVED' | 'PENDING' | 'DRAFT' | 'REJECTED';

function formatLocation(property: any) {
  return [property?.area, property?.city].filter(Boolean).join(', ') || property?.city || 'Location not specified';
}

function statusLabel(status: string) {
  if (status === 'APPROVED') return 'Live';
  if (status === 'PENDING') return 'Pending review';
  if (status === 'REJECTED') return 'Needs changes';
  if (status === 'DRAFT') return 'Draft';
  return status;
}

function statusClasses(status: string) {
  if (status === 'APPROVED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'PENDING') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'REJECTED') return 'border-red-200 bg-red-50 text-red-800';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

export default function DashboardPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  async function fetchMine() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/properties/mine', { credentials: 'same-origin' });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/dashboard/properties&reason=session';
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || text || 'Unable to load your properties.');
      }

      setProperties(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your properties.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMine();
  }, []);

  const counts = useMemo(() => ({
    ALL: properties.length,
    APPROVED: properties.filter((property) => property.status === 'APPROVED').length,
    PENDING: properties.filter((property) => property.status === 'PENDING').length,
    DRAFT: properties.filter((property) => property.status === 'DRAFT').length,
    REJECTED: properties.filter((property) => property.status === 'REJECTED').length,
  }), [properties]);

  const visibleProperties = useMemo(
    () => filter === 'ALL' ? properties : properties.filter((property) => property.status === filter),
    [filter, properties],
  );

  async function remove(id: string) {
    if (!window.confirm('Delete this property? This action cannot be undone.')) return;

    setDeletingId(id);
    setError('');

    try {
      const res = await csrfFetch(`/api/properties/${id}`, { method: 'DELETE' });
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/dashboard/properties&reason=session';
        return;
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || text || 'Unable to delete the property.');
      }

      setProperties((current) => current.filter((property) => property.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete the property.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">Property workspace</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">My properties</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage listings, review their approval status and update property information from one place.
            </p>
          </div>

          <Link
            href="/dashboard/properties/new"
            className="inline-flex w-fit items-center justify-center bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add property
          </Link>
        </section>

        <section className="mt-6 grid grid-cols-2 border-l border-t border-slate-200 bg-white sm:grid-cols-5">
          {[
            ['ALL', 'All'],
            ['APPROVED', 'Live'],
            ['PENDING', 'Pending'],
            ['DRAFT', 'Draft'],
            ['REJECTED', 'Needs changes'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value as StatusFilter)}
              className={
                'border-b border-r border-slate-200 px-4 py-4 text-left transition ' +
                (filter === value ? 'bg-slate-950 text-white' : 'bg-white hover:bg-slate-50')
              }
            >
              <div className={filter === value ? 'text-xs text-slate-300' : 'text-xs text-slate-500'}>{label}</div>
              <div className="mt-1 text-xl font-bold">{counts[value as StatusFilter]}</div>
            </button>
          ))}
        </section>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div>{error}</div>
            <button type="button" onClick={fetchMine} className="mt-3 font-semibold underline underline-offset-4">
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden border border-slate-200 bg-white">
                <div className="aspect-[16/9] animate-pulse bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse bg-slate-100" />
                  <div className="h-4 w-1/2 animate-pulse bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleProperties.length === 0 ? (
          <section className="mt-7 border border-slate-200 bg-white p-8 sm:p-10">
            <h2 className="text-xl font-semibold">
              {properties.length === 0 ? 'You have not listed a property yet' : 'No properties in this status'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {properties.length === 0
                ? 'Create your first listing with clear photos, location, pricing and property details. It will enter review before appearing publicly.'
                : 'Choose another status above to see the rest of your listings.'}
            </p>
            {properties.length === 0 && (
              <Link href="/dashboard/properties/new" className="mt-5 inline-flex bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
                Create first listing
              </Link>
            )}
          </section>
        ) : (
          <section className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleProperties.map((property) => {
              const imageUrl =
                property?.images?.[0]?.url ||
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="506"%3E%3Crect fill="%23f1f5f9" width="900" height="506"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="30" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo property image%3C/text%3E%3C/svg%3E';

              return (
                <article key={property.id} className="overflow-hidden border border-slate-200 bg-white">
                  <Link href={`/property/${property.id}`} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                      <img src={imageUrl} alt={property.title} className="h-full w-full object-cover transition duration-300 hover:scale-[1.015]" />
                      <span className={`absolute left-3 top-3 border px-2.5 py-1 text-xs font-semibold ${statusClasses(property.status)}`}>
                        {statusLabel(property.status)}
                      </span>
                    </div>
                  </Link>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold">{property.title}</h2>
                        <p className="mt-1 truncate text-sm text-slate-500">{formatLocation(property)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-bold">K{Number(property.price || 0).toLocaleString()}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {property.listingType === 'SALE' ? 'For sale' : property.isShortStay ? 'Short stay' : 'For rent'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>{property.bedrooms ?? 0} bed</span>
                      <span>{property.bathrooms ?? 0} bath</span>
                      {property.sizeSqm ? <span>{property.sizeSqm} m²</span> : null}
                      <span>{Number(property.viewCount || 0).toLocaleString()} views</span>
                      <span>{Number(property.saveCount || 0).toLocaleString()} saves</span>
                    </div>

                    {property.status === 'PENDING' && (
                      <div className="mt-4 border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                        This listing is waiting for admin review and is not public yet.
                      </div>
                    )}

                    {property.status === 'REJECTED' && (
                      <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-800">
                        Review the listing details and update anything that needs correction before resubmitting.
                      </div>
                    )}

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <Link href={`/property/${property.id}`} className="border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:border-slate-950">
                        View
                      </Link>
                      <Link href={`/dashboard/properties/${property.id}/edit`} className="border border-slate-300 px-3 py-2 text-center text-sm font-medium text-slate-700 hover:border-slate-950">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(property.id)}
                        disabled={deletingId === property.id}
                        className="border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:border-red-400 disabled:opacity-50"
                      >
                        {deletingId === property.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
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
