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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const imageUrl = property?.images?.[0]?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
  const locationLabel = [property?.area, property?.city].filter(Boolean).join(', ') || property?.city || '';
  const has360 = property?.images?.some((img: any) => img.is360) || false;

  // Check if property is favorited on mount
  React.useEffect(() => {
    checkFavoriteStatus();
  }, [property.id]);

  const checkFavoriteStatus = async () => {
    try {
      const res = await fetch(`/api/favorites/check?propertyId=${property.id}`);
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (error) {
      // User not logged in or error - keep as false
    }
  };

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
      
      if (!res.ok) {
        // If unauthorized, redirect to login
        if (res.status === 401) {
          window.location.href = `/auth/login?redirect=/property/${property.id}`;
          return;
        }
        throw new Error('Failed to update favorite');
      }
      
      const data = await res.json();
      setIsFavorited(!data.removed);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Check out this property: ${property.title}`,
        url: window.location.origin + `/property/${property.id}`,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/property/${property.id}`);
    }
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-0 border border-gray-100 hover:border-gray-200 overflow-hidden group">
      <Link href={`/property/${property.id}`} className="block">
        {/* Image Container */}
        <div className="relative h-56 bg-gray-100 rounded-t-2xl overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-t-2xl"></div>
          )}
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            priority={false}
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleFavorite}
              disabled={favoriteLoading}
              className={`p-2 rounded-full backdrop-blur-sm border transition-all duration-200 ${
                isFavorited
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-white/80 border-white/50 text-gray-700 hover:bg-white'
              } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {favoriteLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/80 border border-white/50 text-gray-700 hover:bg-white transition-all duration-200 backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>

          {/* Status Badge */}
          {property.status === 'APPROVED' && (
            <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Verified
            </div>
          )}
          
          {/* 360° View Badge */}
          {has360 && (
            <div className="absolute bottom-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              360° Tour
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {property.title}
            </h3>
          </div>

          <div className="flex items-center text-gray-600 text-sm mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {locationLabel}
          </div>

          <div className="flex justify-between items-center mb-3">
            <div className={`font-bold text-2xl ${isSale ? 'text-emerald-600' : 'text-gray-900'}`}>
              K{property.price?.toLocaleString?.() ?? property.price}
              {!isSale && <span className="text-sm font-normal text-gray-500">/month</span>}
            </div>
            {isSale ? (
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                For Sale
              </span>
            ) : (
              <div className="text-blue-600 text-sm font-medium">
                Est: K{Math.round((property.price || 0) * 1.05).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-gray-600 text-sm mb-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {property.bedrooms} bed
              </span>
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {property.bathrooms} bath
              </span>
            </div>
          </div>

          {/* Key Features */}
          <div className="flex flex-wrap gap-2 mb-4">
            {property.petFriendly && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                🐕 Pet Friendly
              </span>
            )}
            {(property.parkingSpaces ?? 0) > 0 && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                🚗 Parking
              </span>
            )}
            {property.furnished && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                🪑 Furnished
              </span>
            )}
          </div>

          {/* CTA Button */}
          <button className={`w-full ${isSale ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 px-4 rounded-xl transition-colors font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200`}>
            {isSale ? 'View Property' : 'View Details'}
          </button>
        </div>
      </Link>
    </article>
  );
}

