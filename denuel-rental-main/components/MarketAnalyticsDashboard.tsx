'use client';

import React, { useState, useEffect } from 'react';

interface MarketStats {
  totalListings: number;
  medianPrice: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  medianSize: number;
  averagePricePerSqm: number;
  averageDaysOnMarket: number;
}

interface ByBedroomData {
  bedrooms: number;
  count: number;
  medianPrice: number;
  averagePrice: number;
}

interface ByAreaData {
  area: string;
  count: number;
  averagePrice: number;
  medianPrice: number;
}

interface TrendData {
  month: string;
  value: number;
}

interface MarketIndicators {
  marketType: 'SELLER' | 'BUYER' | 'BALANCED';
  inventoryLevel: 'LOW' | 'MODERATE' | 'HIGH';
  priceDirection: 'UP' | 'DOWN' | 'STABLE';
  affordability: 'HIGH' | 'MODERATE' | 'LOW';
}

interface MarketData {
  filters: {
    city: string | null;
    area: string | null;
    propertyType: string | null;
    listingType: string;
  };
  stats: MarketStats;
  byBedroom: ByBedroomData[];
  byArea: ByAreaData[];
  trends: TrendData[];
  indicators: MarketIndicators;
  lastUpdated: string;
}

interface MarketAnalyticsDashboardProps {
  defaultCity?: string;
  className?: string;
}

export default function MarketAnalyticsDashboard({
  defaultCity = 'Lusaka',
  className = '',
}: MarketAnalyticsDashboardProps) {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(defaultCity);
  const [listingType, setListingType] = useState<'RENT' | 'SALE'>('RENT');
  const [period, setPeriod] = useState('12');

  useEffect(() => {
    fetchMarketData();
  }, [city, listingType, period]);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        city,
        listingType,
        period,
      });
      const response = await fetch(`/api/analytics/market?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
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

  const getIndicatorColor = (value: string) => {
    const colors: Record<string, string> = {
      SELLER: 'bg-red-100 text-red-700',
      BUYER: 'bg-green-100 text-green-700',
      BALANCED: 'bg-blue-100 text-blue-700',
      LOW: 'bg-red-100 text-red-700',
      MODERATE: 'bg-yellow-100 text-yellow-700',
      HIGH: 'bg-green-100 text-green-700',
      UP: 'bg-green-100 text-green-700',
      DOWN: 'bg-red-100 text-red-700',
      STABLE: 'bg-gray-100 text-gray-700',
    };
    return colors[value] || 'bg-gray-100 text-gray-700';
  };

  const getMaxTrendValue = () => {
    if (!data?.trends) return 0;
    return Math.max(...data.trends.map((t) => t.value));
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <p className="text-gray-500 text-center">Failed to load market data</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h2 className="text-2xl font-bold">Market Analytics</h2>
        <p className="text-blue-100 mt-1">
          Real estate market insights and trends
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs text-gray-600 mb-1">City</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Lusaka">Lusaka</option>
            <option value="Kitwe">Kitwe</option>
            <option value="Ndola">Ndola</option>
            <option value="Livingstone">Livingstone</option>
            <option value="Kabwe">Kabwe</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Type</label>
          <div className="flex">
            <button
              onClick={() => setListingType('RENT')}
              className={`px-4 py-2 text-sm border rounded-l-lg ${
                listingType === 'RENT'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              For Rent
            </button>
            <button
              onClick={() => setListingType('SALE')}
              className={`px-4 py-2 text-sm border-t border-b border-r rounded-r-lg ${
                listingType === 'SALE'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              For Sale
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Period</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="3">3 months</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
          </select>
        </div>
      </div>

      {/* Key Stats */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600">Total Listings</p>
          <p className="text-2xl font-bold text-blue-900">
            {data.stats.totalListings.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-600">Median Price</p>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(data.stats.medianPrice)}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-sm text-purple-600">Price/sqm</p>
          <p className="text-2xl font-bold text-purple-900">
            {formatCurrency(data.stats.averagePricePerSqm)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-sm text-orange-600">Avg Days on Market</p>
          <p className="text-2xl font-bold text-orange-900">
            {Math.round(data.stats.averageDaysOnMarket)} days
          </p>
        </div>
      </div>

      {/* Market Indicators */}
      <div className="px-6 pb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Market Indicators</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-600">Market Type</p>
            <span className={`mt-1 inline-block px-2 py-1 rounded text-sm font-medium ${getIndicatorColor(data.indicators.marketType)}`}>
              {data.indicators.marketType === 'SELLER' ? "Seller's Market" :
               data.indicators.marketType === 'BUYER' ? "Buyer's Market" : 'Balanced'}
            </span>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-600">Inventory Level</p>
            <span className={`mt-1 inline-block px-2 py-1 rounded text-sm font-medium ${getIndicatorColor(data.indicators.inventoryLevel)}`}>
              {data.indicators.inventoryLevel}
            </span>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-600">Price Direction</p>
            <span className={`mt-1 inline-block px-2 py-1 rounded text-sm font-medium ${getIndicatorColor(data.indicators.priceDirection)}`}>
              {data.indicators.priceDirection === 'UP' ? '↑ Rising' :
               data.indicators.priceDirection === 'DOWN' ? '↓ Declining' : '→ Stable'}
            </span>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-600">Affordability</p>
            <span className={`mt-1 inline-block px-2 py-1 rounded text-sm font-medium ${
              data.indicators.affordability === 'HIGH' ? 'bg-green-100 text-green-700' :
              data.indicators.affordability === 'LOW' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {data.indicators.affordability}
            </span>
          </div>
        </div>
      </div>

      {/* Price Trends Chart */}
      <div className="p-6 border-t">
        <h3 className="font-semibold text-gray-900 mb-4">Price Trends</h3>
        <div className="relative h-48">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500">
            <span>{formatCurrency(getMaxTrendValue())}</span>
            <span>{formatCurrency(getMaxTrendValue() / 2)}</span>
            <span>0</span>
          </div>
          
          {/* Chart area */}
          <div className="ml-16 h-40 flex items-end gap-1">
            {data.trends.map((trend, index) => {
              const height = (trend.value / getMaxTrendValue()) * 100;
              return (
                <div
                  key={trend.month}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition cursor-pointer group relative"
                    style={{ height: `${height}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {formatCurrency(trend.value)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                    {trend.month.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Price by Bedrooms */}
      <div className="p-6 border-t">
        <h3 className="font-semibold text-gray-900 mb-4">Price by Bedrooms</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2">Bedrooms</th>
                <th className="py-2">Listings</th>
                <th className="py-2">Median Price</th>
                <th className="py-2">Average Price</th>
              </tr>
            </thead>
            <tbody>
              {data.byBedroom.filter(b => b.count > 0).map((item) => (
                <tr key={item.bedrooms} className="border-b">
                  <td className="py-3 font-medium">{item.bedrooms} bed</td>
                  <td className="py-3">{item.count}</td>
                  <td className="py-3">{formatCurrency(item.medianPrice)}</td>
                  <td className="py-3">{formatCurrency(item.averagePrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Areas */}
      <div className="p-6 border-t">
        <h3 className="font-semibold text-gray-900 mb-4">Top Areas by Listings</h3>
        <div className="space-y-3">
          {data.byArea.slice(0, 5).map((area, index) => (
            <div key={area.area} className="flex items-center gap-4">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm flex items-center justify-center font-medium">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{area.area}</span>
                  <span className="text-gray-600">{area.count} listings</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Median: {formatCurrency(area.medianPrice)}</span>
                  <span>Avg: {formatCurrency(area.averagePrice)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 text-center text-xs text-gray-500">
        Data last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
