'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface Agent {
  id: string;
  userId: string;
  bio: string | null;
  specialties: string[];
  areasServed: string[];
  licenseNumber: string | null;
  yearsExperience: number | null;
  languages: string[];
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  website: string | null;
  totalSales: number;
  totalRentals: number;
  totalVolume: number;
  ratingAvg: number;
  ratingCount: number;
  responseTimeHours: number | null;
  responseRate: number | null;
  isVerified: boolean;
  isFeatured: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  reviews: Review[];
  _count?: {
    transactions: number;
  };
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  review: string;
  createdAt: string;
  reviewer: {
    name: string;
  };
}

const SPECIALTIES = [
  { value: 'RESIDENTIAL_SALES', label: 'Residential Sales' },
  { value: 'RESIDENTIAL_RENTALS', label: 'Residential Rentals' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'LUXURY', label: 'Luxury Homes' },
  { value: 'FIRST_TIME_BUYERS', label: 'First-Time Buyers' },
  { value: 'INVESTMENT', label: 'Investment Properties' },
  { value: 'RELOCATION', label: 'Relocation' },
  { value: 'NEW_CONSTRUCTION', label: 'New Construction' },
];

const ZAMBIAN_CITIES = [
  'Lusaka',
  'Kitwe',
  'Ndola',
  'Livingstone',
  'Kabwe',
  'Chingola',
  'Mufulira',
  'Chipata',
  'Solwezi',
  'Kasama',
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'sales', label: 'Most Sales' },
  { value: 'volume', label: 'Highest Volume' },
  { value: 'experience', label: 'Most Experience' },
];

function AgentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAgents, setTotalAgents] = useState(0);
  const [page, setPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Read from URL params
    const city = searchParams.get('city') || '';
    const specialty = searchParams.get('specialty') || '';
    const sort = searchParams.get('sortBy') || 'rating';
    const verified = searchParams.get('verified') === 'true';

    setSelectedCity(city);
    setSelectedSpecialty(specialty);
    setSortBy(sort);
    setVerifiedOnly(verified);
  }, [searchParams]);

  useEffect(() => {
    fetchAgents();
  }, [selectedCity, selectedSpecialty, verifiedOnly, sortBy, page]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity) params.set('city', selectedCity);
      if (selectedSpecialty) params.set('specialty', selectedSpecialty);
      if (verifiedOnly) params.set('verified', 'true');
      params.set('sortBy', sortBy);
      params.set('page', page.toString());
      params.set('limit', '12');

      const res = await fetch(`/api/agents/profile?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents);
        setTotalAgents(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedCity) params.set('city', selectedCity);
    if (selectedSpecialty) params.set('specialty', selectedSpecialty);
    if (verifiedOnly) params.set('verified', 'true');
    params.set('sortBy', sortBy);
    router.push(`/agents?${params}`);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSelectedCity('');
    setSelectedSpecialty('');
    setVerifiedOnly(false);
    setSortBy('rating');
    router.push('/agents');
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `K${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `K${(amount / 1000).toFixed(0)}K`;
    }
    return `K${amount.toLocaleString()}`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find a Real Estate Agent</h1>
          <p className="text-xl text-blue-100 mb-8">
            Connect with top-rated agents in Zambia who can help you buy, sell, or rent
          </p>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 max-w-3xl">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, area, or specialty..."
                className="w-full px-5 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-5 py-4 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Cities</option>
              {ZAMBIAN_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <button
              onClick={applyFilters}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold transition"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-gray-600 font-medium">{totalAgents} agents found</span>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition md:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>

              <div className="hidden md:flex items-center gap-4">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">All Specialties</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Verified Only</span>
                </label>
              </div>

              {(selectedCity || selectedSpecialty || verifiedOnly) && (
                <button onClick={clearFilters} className="text-blue-600 hover:underline text-sm">
                  Clear All
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="md:hidden mt-4 pt-4 border-t space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Specialty</label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">All Specialties</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-600">Verified Agents Only</span>
              </label>
              <button
                onClick={applyFilters}
                className="w-full bg-blue-600 text-white py-2 rounded-lg"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>

        {/* Featured Agents Banner */}
        {agents.some((a) => a.isFeatured) && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-yellow-500">⭐</span> Featured Agents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {agents
                .filter((a) => a.isFeatured)
                .slice(0, 3)
                .map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6 hover:shadow-lg transition group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {agent.profilePhotoUrl ? (
                          <img
                            src={agent.profilePhotoUrl}
                            alt={agent.user.name}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl text-blue-600">
                            {agent.user.name.charAt(0)}
                          </div>
                        )}
                        {agent.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                          {agent.user.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          {renderStars(Math.round(agent.ratingAvg))}
                          <span className="text-sm text-gray-600">
                            ({agent.ratingCount} reviews)
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {agent.totalSales + agent.totalRentals} transactions
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {agent.specialties?.slice(0, 2).map((spec: string) => (
                        <span
                          key={spec}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {SPECIALTIES.find((s) => s.value === spec)?.label || spec}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* All Agents Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Agents</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : agents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition group overflow-hidden"
                >
                  {/* Cover Photo */}
                  <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600 relative">
                    {agent.coverPhotoUrl && (
                      <img
                        src={agent.coverPhotoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="p-6 -mt-10 relative">
                    {/* Profile Photo */}
                    <div className="flex items-end gap-4 mb-4">
                      <div className="relative">
                        {agent.profilePhotoUrl ? (
                          <img
                            src={agent.profilePhotoUrl}
                            alt={agent.user.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-blue-100 border-4 border-white shadow flex items-center justify-center text-2xl text-blue-600">
                            {agent.user.name.charAt(0)}
                          </div>
                        )}
                        {agent.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition text-lg">
                          {agent.user.name}
                        </h3>
                        {agent.licenseNumber && (
                          <p className="text-xs text-gray-500">License #{agent.licenseNumber}</p>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      {renderStars(Math.round(agent.ratingAvg))}
                      <span className="text-sm font-medium text-gray-700">
                        {agent.ratingAvg.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">({agent.ratingCount} reviews)</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-semibold text-gray-900">{agent.totalSales}</div>
                        <div className="text-xs text-gray-500">Sales</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-semibold text-gray-900">{agent.totalRentals}</div>
                        <div className="text-xs text-gray-500">Rentals</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-semibold text-gray-900">
                          {agent.yearsExperience || 0}
                        </div>
                        <div className="text-xs text-gray-500">Years</div>
                      </div>
                    </div>

                    {/* Bio */}
                    {agent.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{agent.bio}</p>
                    )}

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {agent.specialties?.slice(0, 3).map((spec: string) => (
                        <span
                          key={spec}
                          className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
                        >
                          {SPECIALTIES.find((s) => s.value === spec)?.label || spec}
                        </span>
                      ))}
                    </div>

                    {/* Areas Served */}
                    {agent.areasServed && agent.areasServed.length > 0 && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {agent.areasServed.slice(0, 3).join(', ')}
                        {agent.areasServed.length > 3 && ` +${agent.areasServed.length - 3} more`}
                      </p>
                    )}

                    {/* Response Time */}
                    {agent.responseTimeHours && (
                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                        <span className="text-gray-500">Typical response time</span>
                        <span className="text-green-600 font-medium">
                          {agent.responseTimeHours < 1
                            ? 'Under 1 hour'
                            : agent.responseTimeHours < 24
                            ? `${Math.round(agent.responseTimeHours)} hours`
                            : `${Math.round(agent.responseTimeHours / 24)} days`}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or search criteria
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalAgents > 12 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-gray-600">
              Page {page} of {Math.ceil(totalAgents / 12)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalAgents / 12)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Become an Agent CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Are You a Real Estate Agent?</h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-6">
            Join our platform and connect with buyers and renters actively searching on DENUEL. Showcase
            your listings, build your reputation, and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register?role=AGENT"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Register as Agent
            </Link>
            <Link
              href="/agents/learn-more"
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AgentsPageContent />
    </Suspense>
  );
}