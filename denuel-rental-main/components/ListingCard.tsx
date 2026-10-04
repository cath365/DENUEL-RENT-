"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { csrfFetch } from '../lib/csrf';

interface ListingCardProps {
  property: any;
  listingType?: 'RENT' | 'SALE';
}

export default function ListingCard({ property, listingType }: ListingCardProps) {
  const isSale = listingType === 'SALE' || property.listingType === 'SALE';
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const imageUrl =
    property?.images?.[0]?.url ||
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23f1f5f9" width="800" height="600"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="28" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo property image%3C/text%3E%3C/svg%3E';

  const locationLabel =
    [property?.area, property?.city].filter(Boolean).join(', ') || property?.city || 'Zambia';

  const has360 = property?.images?.some((img: any) => img.is360) || false;

  React.useEffect(() => {
    fetch('/api/favorites/check?propertyId=' + property.id)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setIsFavorited(Boolean(data.isFavorited)))
      .catch(() => null);
  }, [property.id]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      const res = await csrfFetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      });

      if (res.status === 401) {
        window.location.href = '/auth/login?redirect=/property/' + property.id;
        return;
      }

      if (!res.ok) throw new Error('Failed to update favorite');
      const data = await res.json();
      setIsFavorited(!data.removed);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <article className="group overflow-hidden border border-slate-200 bg-white">
      <Link href={'/property/' + property.id} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.015]"
          />

          <button
            onClick={handleFavorite}
            disabled={favoriteLoading}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/95 text-slate-800 shadow-sm"
            aria-label="Save property"
          >
            <svg
              className="h-[18px] w-[18px]"
              fill={isFavorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
              />
            </svg>
          </button>

          <div className="absolute bottom-3 left-3 flex gap-2">
            <span className="bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm">
              {isSale ? 'For sale' : 'For rent'}
            </span>
            {has360 && (
              <span className="bg-slate-950/85 px-2.5 py-1 text-xs font-medium text-white">
                360 tour
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="text-xl font-bold tracking-[-0.02em] text-slate-950">
            K{property.price?.toLocaleString?.() ?? property.price}
            {!isSale && <span className="ml-1 text-sm font-normal text-slate-500">/ month</span>}
          </div>

          <h3 className="mt-2 line-clamp-1 text-[15px] font-semibold text-slate-900">
            {property.title}
          </h3>

          <p className="mt-1 line-clamp-1 text-sm text-slate-500">{locationLabel}</p>

          <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
            {typeof property.bedrooms === 'number' && <span>{property.bedrooms} bed</span>}
            {typeof property.bathrooms === 'number' && <span>{property.bathrooms} bath</span>}
            {property.sizeSqm ? <span>{property.sizeSqm} m²</span> : null}
          </div>

          {(property.furnished || (property.parkingSpaces ?? 0) > 0) && (
            <div className="mt-3 flex gap-2 text-xs text-slate-500">
              {property.furnished && <span>Furnished</span>}
              {property.furnished && (property.parkingSpaces ?? 0) > 0 && <span>·</span>}
              {(property.parkingSpaces ?? 0) > 0 && <span>{property.parkingSpaces} parking</span>}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
