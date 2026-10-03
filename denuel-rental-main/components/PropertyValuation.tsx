'use client';

import React, { useState, useEffect } from 'react';

interface ValuationData {
  id: string;
  propertyId: string;
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  confidence: number;
  method: string;
  comparables: Array<{
    id: string;
    address: string;
    price: number;
    sizeSqm?: number;
    bedrooms: number;
    distance: number;
    soldDate?: string;
  }>;
  priceHistory: Array<{
    date: string;
    price: number;
    event: string;
  }>;
  marketTrend: 'UP' | 'DOWN' | 'STABLE';
  monthlyRentEstimate?: number;
}

interface PropertyValuationProps {
  propertyId: string;
  currentPrice?: number;
  className?: string;
}

export default function PropertyValuation({
  propertyId,
  currentPrice,
  className = '',
}: PropertyValuationProps) {
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComparables, setShowComparables] = useState(false);

  useEffect(() => {
    fetchValuation();
  }, [propertyId]);

  const fetchValuation = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/valuation/${propertyId}`);
      if (response.ok) {
        const data = await response.json();
        setValuation(data);
      }
    } catch (error) {
      console.error('Failed to fetch valuation:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'UP':
        return (
          <span className="text-green-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
            Rising
          </span>
        );
      case 'DOWN':
        return (
          <span className="text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
            </svg>
            Declining
          </span>
        );
      default:
        return (
          <span className="text-gray-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
            </svg>
            Stable
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-12 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!valuation) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <p className="text-gray-500 text-center">Valuation data not available</p>
      </div>
    );
  }

  const priceDiff = currentPrice ? valuation.estimatedValue - currentPrice : 0;
  const priceDiffPercent = currentPrice
    ? ((priceDiff / currentPrice) * 100).toFixed(1)
    : 0;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-purple-200 text-sm">DENUEL Estimate</span>
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded">
                {valuation.confidence}% Confidence
              </span>
            </div>
            <p className="text-4xl font-bold mt-2">
              {formatCurrency(valuation.estimatedValue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-sm">Market Trend</p>
            <div className="mt-1">{getTrendIcon(valuation.marketTrend)}</div>
          </div>
        </div>
      </div>

      {/* Estimate Range */}
      <div className="p-6 border-b">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Estimate Range</h3>
        <div className="relative pt-4">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-purple-500 rounded-full"
              style={{
                marginLeft: `${((valuation.lowEstimate - valuation.lowEstimate) / (valuation.highEstimate - valuation.lowEstimate)) * 100}%`,
                width: `${((valuation.highEstimate - valuation.lowEstimate) / (valuation.highEstimate - valuation.lowEstimate)) * 100}%`,
              }}
            />
            <div
              className="absolute w-4 h-4 bg-purple-600 rounded-full -top-1 transform -translate-x-1/2"
              style={{
                left: `${((valuation.estimatedValue - valuation.lowEstimate) / (valuation.highEstimate - valuation.lowEstimate)) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-600">{formatCurrency(valuation.lowEstimate)}</span>
            <span className="font-medium text-purple-600">
              {formatCurrency(valuation.estimatedValue)}
            </span>
            <span className="text-gray-600">{formatCurrency(valuation.highEstimate)}</span>
          </div>
        </div>
      </div>

      {/* Price Comparison (if listing price available) */}
      {currentPrice && (
        <div className="p-6 border-b">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Compared to Listing Price
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Listing Price</p>
              <p className="text-xl font-bold">{formatCurrency(currentPrice)}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-gray-600">vs Estimate</p>
              <p
                className={`text-xl font-bold ${
                  priceDiff > 0 ? 'text-green-600' : priceDiff < 0 ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {priceDiff > 0 ? '+' : ''}
                {formatCurrency(priceDiff)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Difference</p>
              <p
                className={`text-xl font-bold ${
                  priceDiff > 0 ? 'text-green-600' : priceDiff < 0 ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {Number(priceDiffPercent) > 0 ? '+' : ''}
                {priceDiffPercent}%
              </p>
            </div>
          </div>

          {/* Price Analysis */}
          <div
            className={`mt-4 p-3 rounded-lg ${
              priceDiff > 0
                ? 'bg-green-50 text-green-700'
                : priceDiff < 0
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-gray-50 text-gray-700'
            }`}
          >
            {priceDiff > valuation.estimatedValue * 0.05 ? (
              <p>
                ✨ <strong>Good deal!</strong> This property is priced below our estimate.
              </p>
            ) : priceDiff < -valuation.estimatedValue * 0.05 ? (
              <p>
                ⚠️ <strong>Above estimate.</strong> Consider negotiating or comparing with similar
                properties.
              </p>
            ) : (
              <p>
                ✓ <strong>Fair price.</strong> This listing is priced near our estimated value.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Monthly Rent Estimate */}
      {valuation.monthlyRentEstimate && (
        <div className="p-6 border-b">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Estimated Monthly Rent
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(valuation.monthlyRentEstimate)}/month
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Gross Yield:{' '}
            {(((valuation.monthlyRentEstimate * 12) / valuation.estimatedValue) * 100).toFixed(
              1
            )}
            % annually
          </p>
        </div>
      )}

      {/* Comparables */}
      <div className="p-6">
        <button
          onClick={() => setShowComparables(!showComparables)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="font-semibold text-gray-900">
            Comparable Sales ({valuation.comparables.length})
          </h3>
          <svg
            className={`w-5 h-5 text-gray-500 transform transition ${
              showComparables ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showComparables && (
          <div className="mt-4 space-y-3">
            {valuation.comparables.map((comp) => (
              <div
                key={comp.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{comp.address}</p>
                  <p className="text-sm text-gray-600">
                    {comp.bedrooms} beds • {comp.sizeSqm ? `${comp.sizeSqm} sqm` : 'N/A'} •{' '}
                    {comp.distance.toFixed(1)} km away
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(comp.price)}</p>
                  {comp.soldDate && (
                    <p className="text-xs text-gray-500">
                      Sold {new Date(comp.soldDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price History Chart (simplified) */}
      {valuation.priceHistory.length > 0 && (
        <div className="p-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-4">Price History</h3>
          <div className="space-y-2">
            {valuation.priceHistory.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">
                  {new Date(event.date).toLocaleDateString()} - {event.event}
                </span>
                <span className="font-medium">{formatCurrency(event.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 bg-gray-50 text-center text-xs text-gray-500">
        Estimate based on {valuation.method}. Updated{' '}
        {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}
