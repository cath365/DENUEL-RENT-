'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sizeSqm?: number;
  address: string;
  city: string;
  images: Array<{ url: string }>;
  propertyType?: string;
  listingType?: string;
  yearBuilt?: number;
  hoaFees?: number;
  daysOnMarket: number;
  amenities?: string[];
}

interface ComparisonData {
  id: string;
  properties: Property[];
  scoring: {
    pricePerSqm: { id: string; value: number; best: boolean }[];
    spaciousness: { id: string; value: number; best: boolean }[];
    valueScore: { id: string; value: number; best: boolean }[];
    marketTime: { id: string; value: number; best: boolean }[];
  };
}

interface PropertyComparisonProps {
  initialPropertyIds?: string[];
  maxProperties?: number;
}

export default function PropertyComparison({
  initialPropertyIds = [],
  maxProperties = 4,
}: PropertyComparisonProps) {
  const [propertyIds, setPropertyIds] = useState<string[]>(initialPropertyIds);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (propertyIds.length >= 2) {
      fetchComparison();
    }
  }, [propertyIds]);

  const fetchComparison = async () => {
    if (propertyIds.length < 2) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/properties/compare/details?propertyIds=${propertyIds.join(',')}`
      );
      if (response.ok) {
        const data = await response.json();
        setComparison(data);
      }
    } catch (error) {
      console.error('Failed to fetch comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProperties = async () => {
    if (!searchTerm.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(searchTerm)}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.properties || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const addProperty = (property: Property) => {
    if (propertyIds.length >= maxProperties) {
      alert(`Maximum ${maxProperties} properties can be compared`);
      return;
    }
    if (!propertyIds.includes(property.id)) {
      setPropertyIds([...propertyIds, property.id]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeProperty = (id: string) => {
    setPropertyIds(propertyIds.filter((pid) => pid !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const saveComparison = async () => {
    try {
      const response = await fetch('/api/properties/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyIds,
          name: `Comparison - ${new Date().toLocaleDateString()}`,
        }),
      });
      if (response.ok) {
        alert('Comparison saved!');
      }
    } catch (error) {
      console.error('Failed to save comparison:', error);
    }
  };

  const getScoreIndicator = (best: boolean) => {
    return best ? (
      <span className="text-green-600 text-xs ml-1">✓ Best</span>
    ) : null;
  };

  if (propertyIds.length < 2 && !comparison) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Compare Properties
        </h2>
        <p className="text-gray-600 mb-6">
          Add at least 2 properties to compare them side by side
        </p>

        {/* Search Box */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchProperties()}
            placeholder="Search properties to add..."
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={searchProperties}
            disabled={searching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            {searchResults.map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded overflow-hidden bg-gray-100">
                    {property.images?.[0] && (
                      <Image
                        src={property.images[0].url}
                        alt={property.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{property.title}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(property.price)} • {property.bedrooms} bed •{' '}
                      {property.bathrooms} bath
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => addProperty(property)}
                  disabled={propertyIds.includes(property.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {propertyIds.includes(property.id) ? 'Added' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Selected Properties */}
        {propertyIds.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Selected ({propertyIds.length}/{maxProperties})
            </h3>
            <div className="flex gap-2">
              {propertyIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  Property #{id.slice(-4)}
                  <button
                    onClick={() => removeProperty(id)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Loading comparison...</p>
      </div>
    );
  }

  if (!comparison) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Property Comparison</h2>
        <div className="flex gap-2">
          <button
            onClick={saveComparison}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Save Comparison
          </button>
          <button
            onClick={() => setPropertyIds([])}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left w-40 bg-gray-50" />
              {comparison.properties.map((property) => (
                <th key={property.id} className="p-4 text-center min-w-[250px]">
                  <div className="relative">
                    <button
                      onClick={() => removeProperty(property.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full text-sm hover:bg-red-200"
                    >
                      ×
                    </button>
                    <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-gray-100">
                      {property.images?.[0] && (
                        <Image
                          src={property.images[0].url}
                          alt={property.title}
                          width={250}
                          height={140}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <Link
                      href={`/property/${property.id}`}
                      className="font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {property.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{property.address}</p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price */}
            <tr className="border-b bg-blue-50">
              <td className="p-4 font-semibold">Price</td>
              {comparison.properties.map((property) => (
                <td key={property.id} className="p-4 text-center">
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(property.price)}
                  </span>
                  {property.listingType === 'RENT' && (
                    <span className="text-sm text-gray-600">/month</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Bedrooms */}
            <tr className="border-b">
              <td className="p-4 font-semibold">Bedrooms</td>
              {comparison.properties.map((property) => (
                <td key={property.id} className="p-4 text-center">
                  {property.bedrooms} beds
                </td>
              ))}
            </tr>

            {/* Bathrooms */}
            <tr className="border-b bg-gray-50">
              <td className="p-4 font-semibold">Bathrooms</td>
              {comparison.properties.map((property) => (
                <td key={property.id} className="p-4 text-center">
                  {property.bathrooms} baths
                </td>
              ))}
            </tr>

            {/* Size */}
            <tr className="border-b">
              <td className="p-4 font-semibold">Size</td>
              {comparison.properties.map((property) => (
                <td key={property.id} className="p-4 text-center">
                  {property.sizeSqm ? `${property.sizeSqm} sqm` : 'N/A'}
                </td>
              ))}
            </tr>

            {/* Price per sqm */}
            <tr className="border-b bg-gray-50">
              <td className="p-4 font-semibold">Price/sqm</td>
              {comparison.scoring.pricePerSqm.map((item) => (
                <td key={item.id} className="p-4 text-center">
                  {item.value > 0 ? formatCurrency(item.value) : 'N/A'}
                  {getScoreIndicator(item.best)}
                </td>
              ))}
            </tr>

            {/* Property Type */}
            <tr className="border-b">
              <td className="p-4 font-semibold">Property Type</td>
              {comparison.properties.map((property) => (
                <td key={property.id} className="p-4 text-center capitalize">
                  {property.propertyType?.toLowerCase().replace('_', ' ') || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Year Built */}
            <tr className="border-b bg-gray-50">
              <td className="p-4 font-semibold">Year Built</td>
              {comparison.properties.map((property) => (
                <td key={property.id} className="p-4 text-center">
                  {property.yearBuilt || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Days on Market */}
            <tr className="border-b">
              <td className="p-4 font-semibold">Days on Market</td>
              {comparison.scoring.marketTime.map((item) => (
                <td key={item.id} className="p-4 text-center">
                  {item.value} days
                  {getScoreIndicator(item.best)}
                </td>
              ))}
            </tr>

            {/* HOA Fees */}
            <tr className="border-b bg-gray-50">
              <td className="p-4 font-semibold">HOA Fees</td>
              {comparison.properties.map((property) => (
                <td key={property.id} className="p-4 text-center">
                  {property.hoaFees ? formatCurrency(property.hoaFees) + '/month' : 'None'}
                </td>
              ))}
            </tr>

            {/* Value Score */}
            <tr className="border-b bg-green-50">
              <td className="p-4 font-semibold">Value Score</td>
              {comparison.scoring.valueScore.map((item) => (
                <td key={item.id} className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <span className="font-semibold">{item.value}</span>
                    {getScoreIndicator(item.best)}
                  </div>
                </td>
              ))}
            </tr>

            {/* Amenities */}
            <tr className="border-b">
              <td className="p-4 font-semibold align-top">Amenities</td>
              {comparison.properties.map((property) => (
                <td key={property.id} className="p-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {property.amenities?.slice(0, 6).map((amenity, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                    {property.amenities && property.amenities.length > 6 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{property.amenities.length - 6} more
                      </span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Actions */}
            <tr>
              <td className="p-4" />
              {comparison.properties.map((property) => (
                <td key={property.id} className="p-4 text-center">
                  <Link
                    href={`/property/${property.id}`}
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add More */}
      {propertyIds.length < maxProperties && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchProperties()}
              placeholder="Search to add more properties..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchProperties}
              disabled={searching}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 border rounded-lg overflow-hidden bg-white">
              {searchResults.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <span className="text-sm">{property.title}</span>
                  <button
                    onClick={() => addProperty(property)}
                    disabled={propertyIds.includes(property.id)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
