"use client";
import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { LoadingSpinner } from '../../components/Loading';

interface SavedSearch {
  id: string;
  name: string;
  filters: any;
  createdAt: string;
  lastRun?: string;
  notificationCount: number;
}

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const res = await fetch('/api/saved-search');
      if (!res.ok) throw new Error('Failed to load saved searches');
      const data = await res.json();
      // API returns { items: [...] }
      setSearches(Array.isArray(data) ? data : (data.items || data.searches || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-search/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete search');
      setSearches(searches.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete search');
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <Header />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Saved Searches</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create New Search
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : searches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved searches yet</h3>
            <p className="text-gray-600 mb-4">Save your search criteria to get notified when new properties match your preferences.</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Start Searching
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {searches.map((search) => (
              <div key={search.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{search.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {search.filters.minPrice && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          ${search.filters.minPrice}+
                        </span>
                      )}
                      {search.filters.maxPrice && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          Up to ${search.filters.maxPrice}
                        </span>
                      )}
                      {search.filters.bedrooms && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {search.filters.bedrooms}+ beds
                        </span>
                      )}
                      {search.filters.city && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                          {search.filters.city}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Created: {new Date(search.createdAt).toLocaleDateString()}</p>
                      {search.lastRun && <p>Last run: {new Date(search.lastRun).toLocaleDateString()}</p>}
                      <p className="text-blue-600 font-medium">{search.notificationCount} new matches</p>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => deleteSearch(search.id)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}