"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../../components/Header';
import CreatePropertyForm from '../../../components/CreatePropertyForm';
import AnalyticsCard from '../../../components/AnalyticsCard';
import { csrfFetch } from '../../../lib/csrf';

function formatLocation(p: any) {
  return [p?.area, p?.city].filter(Boolean).join(', ') || p?.city || '';
}

export default function DashboardPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchMine() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/properties/mine');
      const json = await res.json();
      setProperties(json.items || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMine();
  }, []);

  async function remove(id: string) {
    if (!confirm('Delete this property?')) return;
    const res = await csrfFetch(`/api/properties/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json?.ok) fetchMine();
    else alert(json?.error || 'Error deleting');
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      <h2 className="text-2xl font-semibold mb-4">Your Properties</h2>

      <div className="mb-6">
        <CreatePropertyForm onCreated={fetchMine} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">My listings</h3>
        {loading && <div className="text-muted">Loading...</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {!loading && properties.length === 0 && <div className="text-muted">No properties yet</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((p) => {
            const imageUrl = p?.images?.[0]?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
            return (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded p-4 shadow">
                <div className="flex items-start gap-4">
                  <img src={imageUrl} className="w-28 h-20 object-cover rounded" alt="" />
                  <div className="flex-1">
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-sm text-muted">{formatLocation(p)}</div>
                    <div className="text-sm text-muted">Status: {p.status}</div>
                    <div className="text-sm mt-1">K{p.price?.toLocaleString?.() ?? p.price}</div>
                    <div className="text-sm mt-2">
                      {p.bedrooms} bd ƒ?› {p.bathrooms} ba
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-56">
                    <div className="text-sm text-muted">
                      Views: {p.viewCount} ƒ?› Saves: {p.saveCount}
                    </div>
                    <AnalyticsCard propertyId={p.id} />
                    <div className="flex flex-col gap-2">
                      <Link href={`/property/${p.id}`} className="text-sm p-2 border rounded text-center">
                        View
                      </Link>
                      <Link href={`/dashboard/properties/${p.id}/edit`} className="text-sm p-2 border rounded text-center">
                        Edit
                      </Link>
                      <button onClick={() => remove(p.id)} className="text-sm p-2 border rounded text-red-600">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

