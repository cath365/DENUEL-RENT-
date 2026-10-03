"use client";
import React, { useState, useEffect } from 'react';
import ListingCard from './ListingCard';
import { PropertyCardSkeleton, LoadingSpinner } from './Loading';

interface ListingsGridProps {
  items: any[];
  loading?: boolean;
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  loadMoreLoading?: boolean;
  listingType?: 'RENT' | 'SALE';
}

export default function ListingsGrid({
  items,
  loading = false,
  showLoadMore = false,
  onLoadMore,
  loadMoreLoading = false,
  listingType
}: ListingsGridProps) {
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (items.length > 0) {
      // Add animation delay for new items
      const newItems = items.slice(displayItems.length);
      newItems.forEach((_, index) => {
        setTimeout(() => {
          setAnimatingItems(prev => new Set([...prev, displayItems.length + index]));
        }, index * 100);
      });
      setDisplayItems(items);
    }
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600 font-medium">Finding perfect homes for you...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <PropertyCardSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (!items.length && !loading) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          We could not find any properties matching your criteria. Try adjusting your search filters or location.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
        >
          Reset Search
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-gray-600">
          <span className="font-semibold text-gray-900">{items.length}</span> properties found
        </div>
        <div className="flex items-center gap-4">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option>Sort by: Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Most Popular</option>
          </select>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayItems.map((property, index) => (
          <div
            key={property.id}
            className={`transform transition-all duration-500 ${
              animatingItems.has(index)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            <ListingCard property={property} listingType={listingType} />
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {showLoadMore && (
        <div className="text-center pt-8">
          <button
            onClick={onLoadMore}
            disabled={loadMoreLoading}
            className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-200 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadMoreLoading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Loading more properties...
              </div>
            ) : (
              'Load More Properties'
            )}
          </button>
        </div>
      )}

      {/* Loading overlay for load more */}
      {loadMoreLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
          <PropertyCardSkeleton count={4} />
        </div>
      )}
    </div>
  );
}