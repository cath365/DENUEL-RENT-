"use client";
import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import ListingsGrid from '../../components/ListingsGrid';
import Link from 'next/link';

export default function FavoritesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/favorites');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/auth/login?redirect=/favorites';
          return;
        }
        throw new Error('Failed to load favorites');
      }
      const json = await res.json();
      setItems((json.items || []).map((i: any) => i.property));
    } catch (err: any) {
      setError(err.message || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600">Properties you've saved for later</p>
            </div>
          </div>
          {!loading && !error && items.length > 0 && (
            <div className="text-sm text-gray-500 mt-2">
              {items.length} {items.length === 1 ? 'property' : 'properties'} saved
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Favorites</h3>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <button
                  onClick={fetchFavorites}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-medium transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Favorites Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start saving properties you love by clicking the heart icon on any listing. They'll appear here for easy access.
            </p>
            <Link
              href="/rent"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              Browse Properties
            </Link>
          </div>
        )}

        {/* Listings Grid */}
        {!error && (
          <ListingsGrid items={items} loading={loading} />
        )}
      </div>
    </main>
  );
}