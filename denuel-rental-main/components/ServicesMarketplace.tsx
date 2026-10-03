'use client';

import React, { useState, useEffect } from 'react';

type ServiceCategory = 
  | 'HOME_INSPECTOR'
  | 'MOVER'
  | 'CLEANER'
  | 'PHOTOGRAPHER'
  | 'CONTRACTOR'
  | 'ELECTRICIAN'
  | 'PLUMBER'
  | 'PAINTER'
  | 'LANDSCAPER'
  | 'PEST_CONTROL'
  | 'HOME_INSURANCE'
  | 'HOME_WARRANTY'
  | 'LEGAL'
  | 'MORTGAGE_BROKER'
  | 'INTERIOR_DESIGNER'
  | 'SECURITY'
  | 'HVAC'
  | 'ROOFING'
  | 'FLOORING'
  | 'OTHER';

interface ServiceProvider {
  id: string;
  businessName: string;
  description?: string;
  category: ServiceCategory;
  phone?: string;
  email?: string;
  website?: string;
  servicesOffered?: string[];
  isVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  priceRange?: string;
  logoUrl?: string;
  yearsInBusiness?: number;
}

interface ServiceReview {
  id: string;
  rating: number;
  review: string;
  createdAt: string;
  reviewer: {
    name: string;
  };
}

interface ServicesMarketplaceProps {
  defaultCategory?: ServiceCategory;
  defaultCity?: string;
  className?: string;
}

export default function ServicesMarketplace({
  defaultCategory,
  defaultCity = 'Lusaka',
  className = '',
}: ServicesMarketplaceProps) {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ServiceCategory | ''>(defaultCategory || '');
  const [city, setCity] = useState(defaultCity);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: '',
    address: '',
  });

  const categories: { value: ServiceCategory; label: string; icon: string }[] = [
    { value: 'MOVER', label: 'Moving', icon: '🚚' },
    { value: 'CLEANER', label: 'Cleaning', icon: '🧹' },
    { value: 'PLUMBER', label: 'Plumbing', icon: '🔧' },
    { value: 'ELECTRICIAN', label: 'Electrical', icon: '⚡' },
    { value: 'PAINTER', label: 'Painting', icon: '🎨' },
    { value: 'LANDSCAPER', label: 'Landscaping', icon: '🌿' },
    { value: 'PEST_CONTROL', label: 'Pest Control', icon: '🐜' },
    { value: 'HOME_INSPECTOR', label: 'Inspection', icon: '🔍' },
    { value: 'INTERIOR_DESIGNER', label: 'Design', icon: '🛋️' },
    { value: 'SECURITY', label: 'Security', icon: '🔒' },
  ];

  useEffect(() => {
    fetchProviders();
  }, [category, city]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (city) params.append('city', city);

      const response = await fetch(`/api/services?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderDetails = async (id: string) => {
    try {
      const [providerRes, reviewsRes] = await Promise.all([
        fetch(`/api/services/${id}`),
        fetch(`/api/services/reviews?providerId=${id}`),
      ]);

      if (providerRes.ok) {
        const provider = await providerRes.json();
        setSelectedProvider(provider);
      }

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch provider details:', error);
    }
  };

  const submitBooking = async () => {
    if (!selectedProvider) return;

    try {
      const response = await fetch('/api/services/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider.id,
          scheduledDate: `${bookingData.date}T${bookingData.time}`,
          notes: bookingData.notes,
          address: bookingData.address,
        }),
      });

      if (response.ok) {
        setShowBookingModal(false);
        setBookingData({ date: '', time: '', notes: '', address: '' });
        alert('Booking request sent! The provider will contact you shortly.');
      }
    } catch (error) {
      console.error('Failed to submit booking:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
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

  const normalizeAreas = (areas?: any) => {
    if (!areas) return [];
    if (Array.isArray(areas)) return areas;
    if (typeof areas === 'string') return areas.split(',').map((a) => a.trim()).filter(Boolean);
    try {
      const parsed = JSON.parse(areas);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-green-600 to-green-700 text-white">
        <h2 className="text-2xl font-bold">Home Services Marketplace</h2>
        <p className="text-green-100 mt-1">
          Find trusted professionals for all your home needs
        </p>
      </div>

      {/* Category Filter */}
      <div className="p-4 border-b overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              !category
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                category === cat.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* City Filter */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Service Area:</span>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="Lusaka">Lusaka</option>
            <option value="Kitwe">Kitwe</option>
            <option value="Ndola">Ndola</option>
            <option value="Livingstone">Livingstone</option>
          </select>
        </div>
      </div>

      {/* Provider List */}
      <div className="p-6">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                onClick={() => fetchProviderDetails(provider.id)}
                className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    {provider.logoUrl ? (
                      <img
                        src={provider.logoUrl}
                        alt={provider.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {categories.find((c) => c.value === provider.category)?.icon || '🏠'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {provider.businessName}
                      </h3>
                      {provider.isVerified && (
                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {categories.find((c) => c.value === provider.category)?.label}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(Math.round(provider.ratingAvg))}
                      <span className="text-sm text-gray-600">
                        ({provider.ratingCount})
                      </span>
                    </div>
                    {provider.priceRange && (
                      <p className="text-sm text-green-600 mt-1">{provider.priceRange}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No service providers found in this area</p>
          </div>
        )}
      </div>

      {/* Provider Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden">
                    {selectedProvider.logoUrl ? (
                      <img
                        src={selectedProvider.logoUrl}
                        alt={selectedProvider.businessName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {categories.find((c) => c.value === selectedProvider.category)?.icon || '🏠'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedProvider.businessName}
                      </h2>
                      {selectedProvider.isVerified && (
                        <span className="text-blue-600">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(Math.round(selectedProvider.ratingAvg))}
                      <span className="text-sm text-gray-600">
                        {selectedProvider.ratingAvg.toFixed(1)} ({selectedProvider.ratingCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              {selectedProvider.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600">{selectedProvider.description}</p>
                </div>
              )}

              {/* Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-600">Service Areas</h4>
                  {(() => {
                    const areas = normalizeAreas((selectedProvider as any).serviceAreas);
                    return areas.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {areas.map((area: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-sm rounded-full text-gray-800 flex items-center gap-2">
                            <span className="text-sm">📍</span>
                            {area}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="font-medium text-gray-500 mt-2">No specific areas listed</p>
                    );
                  })()}
                </div>
                {selectedProvider.yearsInBusiness && (
                  <div>
                    <h4 className="text-sm text-gray-600">Experience</h4>
                    <p className="font-medium">{selectedProvider.yearsInBusiness} years in business</p>
                  </div>
                )}
                {selectedProvider.priceRange && (
                  <div>
                    <h4 className="text-sm text-gray-600">Price Range</h4>
                    <p className="font-medium text-green-600">{selectedProvider.priceRange}</p>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-3">
                {selectedProvider.phone && (
                  <a
                    href={`tel:${selectedProvider.phone}`}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {selectedProvider.phone}
                  </a>
                )}
                {selectedProvider.email && (
                  <a
                    href={`mailto:${selectedProvider.email}`}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </a>
                )}
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book Now
                </button>
              </div>

              {/* Reviews */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Reviews ({reviews.length})
                </h3>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400">
                          {review.reviewer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{review.reviewer.name}</p>
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <span className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-gray-600">{review.review}</p>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No reviews yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedProvider && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                Book {selectedProvider.businessName}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time
                </label>
                <input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Address
                </label>
                <input
                  type="text"
                  value={bookingData.address}
                  onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                  placeholder="Enter your address"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  rows={3}
                  placeholder="Describe what you need..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={submitBooking}
                disabled={!bookingData.date || !bookingData.time || !bookingData.address}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Request Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
