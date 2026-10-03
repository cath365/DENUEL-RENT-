'use client';

import React, { useState, useEffect } from 'react';

interface NeighborhoodData {
  id: string;
  name: string;
  city: string;
  description?: string;
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
  safetyScore?: number;
  medianHomePrice?: number;
  medianRentPrice?: number;
  population?: number;
  medianAge?: number;
  medianIncome?: number;
  schools: Array<{
    id: string;
    name: string;
    type: string;
    rating?: number;
    grades?: string;
    distance?: number;
  }>;
  amenities: Array<{
    id: string;
    name: string;
    category: string;
    distance?: number;
    rating?: number;
  }>;
}

interface NeighborhoodScoresProps {
  neighborhoodId?: string;
  city?: string;
  area?: string;
  lat?: number;
  lng?: number;
}

export default function NeighborhoodScores({
  neighborhoodId,
  city,
  area,
  lat,
  lng,
}: NeighborhoodScoresProps) {
  const [neighborhood, setNeighborhood] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'amenities'>('overview');

  useEffect(() => {
    fetchNeighborhood();
  }, [neighborhoodId, city, area]);

  const fetchNeighborhood = async () => {
    setLoading(true);
    try {
      let url = '/api/neighborhoods';
      if (neighborhoodId) {
        url = `/api/neighborhoods/${neighborhoodId}`;
      } else if (city && area) {
        url = `/api/neighborhoods?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setNeighborhood(Array.isArray(data) ? data[0] : data);
      }
    } catch (error) {
      console.error('Failed to fetch neighborhood:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Walker's Paradise";
    if (score >= 70) return 'Very Walkable';
    if (score >= 50) return 'Somewhat Walkable';
    if (score >= 25) return 'Car-Dependent';
    return 'Almost All Errands Require a Car';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!neighborhood) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <p className="text-gray-500">Neighborhood data not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">{neighborhood.name}</h2>
        <p className="text-gray-600">{neighborhood.city}</p>
        {neighborhood.description && (
          <p className="mt-2 text-gray-700">{neighborhood.description}</p>
        )}
      </div>

      {/* Scores */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Walk Score */}
          {neighborhood.walkScore !== undefined && (
            <div className="text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(
                  neighborhood.walkScore
                )}`}
              >
                {neighborhood.walkScore}
              </div>
              <p className="mt-2 font-semibold text-gray-900">Walk Score</p>
              <p className="text-xs text-gray-600">{getScoreLabel(neighborhood.walkScore)}</p>
            </div>
          )}

          {/* Transit Score */}
          {neighborhood.transitScore !== undefined && (
            <div className="text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(
                  neighborhood.transitScore
                )}`}
              >
                {neighborhood.transitScore}
              </div>
              <p className="mt-2 font-semibold text-gray-900">Transit Score</p>
              <p className="text-xs text-gray-600">
                {neighborhood.transitScore >= 70 ? 'Excellent Transit' : 'Some Transit'}
              </p>
            </div>
          )}

          {/* Bike Score */}
          {neighborhood.bikeScore !== undefined && (
            <div className="text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(
                  neighborhood.bikeScore
                )}`}
              >
                {neighborhood.bikeScore}
              </div>
              <p className="mt-2 font-semibold text-gray-900">Bike Score</p>
              <p className="text-xs text-gray-600">
                {neighborhood.bikeScore >= 70 ? 'Very Bikeable' : 'Bikeable'}
              </p>
            </div>
          )}

          {/* Safety Score */}
          {neighborhood.safetyScore !== undefined && (
            <div className="text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${getScoreColor(
                  neighborhood.safetyScore
                )}`}
              >
                {neighborhood.safetyScore}
              </div>
              <p className="mt-2 font-semibold text-gray-900">Safety Score</p>
              <p className="text-xs text-gray-600">
                {neighborhood.safetyScore >= 70 ? 'Very Safe' : 'Moderate'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          {(['overview', 'schools', 'amenities'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Market Data */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Market Data</h3>
              <div className="space-y-3">
                {neighborhood.medianHomePrice && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Median Home Price</span>
                    <span className="font-semibold">
                      {formatCurrency(neighborhood.medianHomePrice)}
                    </span>
                  </div>
                )}
                {neighborhood.medianRentPrice && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Median Rent</span>
                    <span className="font-semibold">
                      {formatCurrency(neighborhood.medianRentPrice)}/mo
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Demographics */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Demographics</h3>
              <div className="space-y-3">
                {neighborhood.population && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Population</span>
                    <span className="font-semibold">
                      {neighborhood.population.toLocaleString()}
                    </span>
                  </div>
                )}
                {neighborhood.medianAge && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Median Age</span>
                    <span className="font-semibold">{neighborhood.medianAge} years</span>
                  </div>
                )}
                {neighborhood.medianIncome && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Median Household Income</span>
                    <span className="font-semibold">
                      {formatCurrency(neighborhood.medianIncome)}/year
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schools' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Nearby Schools</h3>
            {neighborhood.schools.length > 0 ? (
              <div className="space-y-3">
                {neighborhood.schools.map((school) => (
                  <div
                    key={school.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        {school.rating ? (
                          <span className="font-bold">{school.rating}</span>
                        ) : (
                          <span className="text-xs">N/A</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{school.name}</p>
                        <p className="text-sm text-gray-600">
                          {school.type} • {school.grades}
                        </p>
                      </div>
                    </div>
                    {school.distance && (
                      <span className="text-sm text-gray-500">
                        {school.distance.toFixed(1)} km away
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No school data available</p>
            )}
          </div>
        )}

        {activeTab === 'amenities' && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Nearby Amenities</h3>
            {neighborhood.amenities.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-3">
                {neighborhood.amenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{amenity.name}</p>
                      <p className="text-sm text-gray-600">{amenity.category}</p>
                    </div>
                    <div className="text-right">
                      {amenity.rating && (
                        <div className="flex items-center text-yellow-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="ml-1 text-sm">{amenity.rating}</span>
                        </div>
                      )}
                      {amenity.distance && (
                        <span className="text-xs text-gray-500">
                          {amenity.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No amenity data available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
