'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const MapSplitView = dynamic(() => import('../../components/MapSplitView'), {
  ssr: false,
  loading: () => <div className="h-[600px] animate-pulse rounded-xl bg-slate-100" />,
});

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  area?: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  images: { url: string }[];
  isFeatured?: boolean;
  isShortStay?: boolean;
  petsAllowed?: boolean;
  furnished?: boolean;
  createdAt: string;
}

export default function RentPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    city: '',
    furnished: false,
    petsAllowed: false,
    isShortStay: false,
    sortBy: 'newest'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const cities = ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe', 'Chipata', 'Chingola', 'Mufulira'];
  const propertyTypes = ['APARTMENT', 'HOUSE', 'STUDIO', 'ROOM', 'COMMERCIAL', 'LAND'];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
    setFilters(prev => ({
      ...prev,
      minPrice: params.get('priceMin') || prev.minPrice,
      maxPrice: params.get('priceMax') || prev.maxPrice,
      bedrooms: params.get('bedrooms') || prev.bedrooms,
      bathrooms: params.get('bathrooms') || prev.bathrooms,
      propertyType: params.get('propertyType') || prev.propertyType,
      city: params.get('city') || prev.city,
      furnished: params.get('furnished') === 'true' || prev.furnished,
      petsAllowed: params.get('petsAllowed') === 'true' || prev.petsAllowed,
    }));
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [page, filters, searchQuery]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Filter for RENT and BOTH listings only
      params.append('listingType', 'RENT');
      if (searchQuery) params.append('q', searchQuery);
      if (filters.city) params.append('city', filters.city);
      if (filters.minPrice) params.append('priceMin', filters.minPrice);
      if (filters.maxPrice) params.append('priceMax', filters.maxPrice);
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
      if (filters.bathrooms) params.append('bathrooms', filters.bathrooms);
      if (filters.propertyType) params.append('propertyType', filters.propertyType);
      if (filters.furnished) params.append('furnished', 'true');
      if (filters.petsAllowed) params.append('petsAllowed', 'true');
      if (new URLSearchParams(window.location.search).get('hasParking') === 'true') params.append('hasParking', 'true');
      if (filters.isShortStay) params.append('isShortStay', 'true');
      params.append('sort', filters.sortBy);
      params.append('page', page.toString());
      params.append('pageSize', '12');

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setProperties(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / 12));
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProperties();
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      propertyType: '',
      city: '',
      furnished: false,
      petsAllowed: false,
      isShortStay: false,
      sortBy: 'newest'
    });
    setPage(1);
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sortBy') return false;
    if (typeof value === 'boolean') return value;
    return value !== '';
  }).length;

  return (
    <>
      <Head>
        <title>Properties for Rent in Zambia | Apartments, Houses & Rooms | Denuel</title>
        <meta name="description" content="Find apartments, houses, and rooms for rent across Zambia. Browse verified listings in Lusaka, Kitwe, Ndola and more. Furnished options, pet-friendly rentals, and short-stay accommodations available." />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <Header />
      
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">Find Your Perfect Rental Home</h1>
              <p className="text-xl text-blue-50 mb-8">Discover apartments, houses, and rooms for rent across Zambia</p>
            </div>
          
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 max-w-4xl backdrop-blur-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by location, area, or keyword..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
              <select
                value={filters.city}
                onChange={(e) => setFilters({...filters, city: e.target.value})}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </span>
              </button>
            </div>
          </form>
          </div>
        </section>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFilterCount}</span>
                )}
              </button>

              {/* Quick Filters */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setFilters({...filters, isShortStay: !filters.isShortStay})}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.isShortStay ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Short Stay
                </button>
                <button
                  onClick={() => setFilters({...filters, furnished: !filters.furnished})}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.furnished ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Furnished
                </button>
                <button
                  onClick={() => setFilters({...filters, petsAllowed: !filters.petsAllowed})}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filters.petsAllowed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pet Friendly
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="relevance">Most Relevant</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (K)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (K)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    placeholder="Any"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => setFilters({...filters, bedrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <select
                    value={filters.bathrooms}
                    onChange={(e) => setFilters({...filters, bathrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any</option>
                    {propertyTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count & Save Search */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {loading ? 'Searching...' : `${properties.length} properties found`}
          </p>
          <Link
            href="/saved-search"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved Searches
          </Link>
        </div>

        {/* Property Listings */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No rental properties found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Try adjusting your filters or search in a different area. New properties are added daily!</p>
            <button
              onClick={clearFilters}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/property/${property.id}`}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={property.images?.[0]?.url || '/placeholder-property.jpg'}
                    alt={property.title}
                    loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {property.isFeatured && (
                    <span className="absolute top-3 left-3 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Featured
                    </span>
                  )}
                  {property.isShortStay && (
                    <span className="absolute top-3 right-3 bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Short Stay
                    </span>
                  )}
                  <button className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{property.city}{property.area ? `, ${property.area}` : ''}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {property.bedrooms} bed
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                      {property.bathrooms} bath
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-blue-600">K{property.price.toLocaleString()}</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {properties.map((property) => (
              <Link
                key={property.id}
                href={`/property/${property.id}`}
                className="flex bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="w-64 flex-shrink-0">
                  <img
                    src={property.images?.[0]?.url || '/placeholder-property.jpg'}
                    alt={property.title}
                    loading="lazy" className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h3>
                      <p className="text-gray-600 mb-2">{property.city}{property.area ? `, ${property.area}` : ''}</p>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">K{property.price.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span></span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{property.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{property.bedrooms} bedrooms</span>
                    <span>•</span>
                    <span>{property.bathrooms} bathrooms</span>
                    <span>•</span>
                    <span>{property.propertyType}</span>
                    {property.furnished && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">Furnished</span>}
                    {property.petsAllowed && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Pet Friendly</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <MapSplitView properties={properties} />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page <= 3 ? i + 1 : page + i - 2;
              if (pageNum > totalPages || pageNum < 1) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    page === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* CTA Section */}
        <section className="mt-16 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          </div>
          <div className="max-w-3xl relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Have a Property to Rent?</h2>
            <p className="text-green-50 text-lg mb-6">List your property on Denuel and reach renters actively searching on DENUEL. Our platform makes it easy to manage listings, screen applicants, and collect rent.</p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/dashboard/properties/new"
                className="bg-white text-green-700 px-8 py-4 rounded-full font-bold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                List Your Property
              </Link>
              <Link
                href="/renters-guide"
                className="bg-green-700/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-green-700/30 transition-all border-2 border-white/50 hover:border-white"
              >
                Landlord Guide
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Action Button - List Property */}
      <Link
        href="/dashboard/properties/new"
        className="fixed bottom-8 right-8 z-40 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-full font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-2xl hover:shadow-3xl flex items-center gap-2 group"
        title="List Your Property"
      >
        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden md:inline">List Property</span>
      </Link>
    </main>
    </>
  );
}
