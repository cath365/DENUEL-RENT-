'use client';

import React, { useState } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';

interface ValuationResult {
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  pricePerSqm: number;
  marketTrend: 'up' | 'down' | 'stable';
  trendPercent: number;
  comparables: {
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sizeSqm: number;
    soldDate: string;
  }[];
}

const neighborhoods: Record<string, { avgPricePerSqm: number; trend: 'up' | 'down' | 'stable'; trendPercent: number }> = {
  'Kabulonga': { avgPricePerSqm: 8500, trend: 'up', trendPercent: 5.2 },
  'Rhodes Park': { avgPricePerSqm: 7200, trend: 'up', trendPercent: 3.8 },
  'Woodlands': { avgPricePerSqm: 5800, trend: 'stable', trendPercent: 0.5 },
  'Ibex Hill': { avgPricePerSqm: 6500, trend: 'up', trendPercent: 4.1 },
  'Roma': { avgPricePerSqm: 6000, trend: 'up', trendPercent: 2.3 },
  'Chelston': { avgPricePerSqm: 3500, trend: 'stable', trendPercent: 1.2 },
  'Avondale': { avgPricePerSqm: 4200, trend: 'up', trendPercent: 2.8 },
  'Mass Media': { avgPricePerSqm: 4800, trend: 'up', trendPercent: 3.5 },
  'Northmead': { avgPricePerSqm: 5200, trend: 'stable', trendPercent: 0.8 },
  'Longacres': { avgPricePerSqm: 5500, trend: 'up', trendPercent: 2.1 },
};

export default function HomeValuePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValuationResult | null>(null);
  
  const [formData, setFormData] = useState({
    address: '',
    neighborhood: '',
    propertyType: 'HOUSE',
    bedrooms: 3,
    bathrooms: 2,
    sizeSqm: 200,
    yearBuilt: 2010,
    condition: 'good',
    hasPool: false,
    hasGarage: true,
    hasGarden: true,
    recentRenovations: false,
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateValuation = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const neighborhoodData = neighborhoods[formData.neighborhood] || { avgPricePerSqm: 5000, trend: 'stable' as const, trendPercent: 1.0 };
      
      // Base calculation
      let pricePerSqm = neighborhoodData.avgPricePerSqm;
      
      // Adjustments based on property features
      if (formData.propertyType === 'APARTMENT') pricePerSqm *= 0.85;
      if (formData.propertyType === 'TOWNHOUSE') pricePerSqm *= 0.95;
      if (formData.condition === 'excellent') pricePerSqm *= 1.15;
      if (formData.condition === 'good') pricePerSqm *= 1.05;
      if (formData.condition === 'fair') pricePerSqm *= 0.9;
      if (formData.condition === 'poor') pricePerSqm *= 0.75;
      if (formData.hasPool) pricePerSqm *= 1.08;
      if (formData.hasGarage) pricePerSqm *= 1.05;
      if (formData.recentRenovations) pricePerSqm *= 1.1;
      
      // Age adjustment
      const age = new Date().getFullYear() - formData.yearBuilt;
      if (age < 5) pricePerSqm *= 1.1;
      else if (age > 30) pricePerSqm *= 0.85;
      else if (age > 20) pricePerSqm *= 0.92;
      
      const estimatedValue = Math.round(pricePerSqm * formData.sizeSqm);
      const variance = estimatedValue * 0.1;
      
      setResult({
        estimatedValue,
        lowEstimate: Math.round(estimatedValue - variance),
        highEstimate: Math.round(estimatedValue + variance),
        pricePerSqm: Math.round(pricePerSqm),
        marketTrend: neighborhoodData.trend,
        trendPercent: neighborhoodData.trendPercent,
        comparables: [
          {
            address: `${Math.floor(Math.random() * 100) + 1} ${formData.neighborhood} Road`,
            price: Math.round(estimatedValue * (0.9 + Math.random() * 0.2)),
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms,
            sizeSqm: formData.sizeSqm + Math.floor(Math.random() * 50) - 25,
            soldDate: '2 weeks ago',
          },
          {
            address: `${Math.floor(Math.random() * 100) + 1} ${formData.neighborhood} Avenue`,
            price: Math.round(estimatedValue * (0.85 + Math.random() * 0.3)),
            bedrooms: formData.bedrooms + (Math.random() > 0.5 ? 1 : 0),
            bathrooms: formData.bathrooms,
            sizeSqm: formData.sizeSqm + Math.floor(Math.random() * 80) - 40,
            soldDate: '1 month ago',
          },
          {
            address: `${Math.floor(Math.random() * 100) + 1} ${formData.neighborhood} Close`,
            price: Math.round(estimatedValue * (0.88 + Math.random() * 0.24)),
            bedrooms: formData.bedrooms,
            bathrooms: formData.bathrooms - (Math.random() > 0.5 ? 1 : 0),
            sizeSqm: formData.sizeSqm + Math.floor(Math.random() * 60) - 30,
            soldDate: '6 weeks ago',
          },
        ],
      });
      
      setLoading(false);
      setStep(3);
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/buy" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Buy
            </Link>
            <h1 className="text-4xl font-bold mb-4">Home Value Estimator</h1>
            <p className="text-xl text-emerald-100">
              Get an instant estimate of your property&apos;s market value
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s}
                </div>
                {s < 3 && (
                  <div className={`w-20 h-1 ${step > s ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Location */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Location</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your property address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Neighborhood</label>
                  <select
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select neighborhood</option>
                    {Object.keys(neighborhoods).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['HOUSE', 'APARTMENT', 'CONDO', 'TOWNHOUSE'].map(type => (
                      <button
                        key={type}
                        onClick={() => handleInputChange('propertyType', type)}
                        className={`px-4 py-3 rounded-xl border transition-colors ${
                          formData.propertyType === type
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                        }`}
                      >
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.neighborhood}
                  className="w-full py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Details</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                    <select
                      value={formData.bedrooms}
                      onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                    <select
                      value={formData.bathrooms}
                      onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Size (m²)</label>
                    <input
                      type="number"
                      value={formData.sizeSqm}
                      onChange={(e) => handleInputChange('sizeSqm', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year Built</label>
                    <input
                      type="number"
                      value={formData.yearBuilt}
                      onChange={(e) => handleInputChange('yearBuilt', Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                  <div className="grid grid-cols-4 gap-3">
                    {['excellent', 'good', 'fair', 'poor'].map(cond => (
                      <button
                        key={cond}
                        onClick={() => handleInputChange('condition', cond)}
                        className={`px-4 py-3 rounded-xl border transition-colors ${
                          formData.condition === cond
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                        }`}
                      >
                        {cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Features</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'hasPool', label: 'Swimming Pool' },
                      { key: 'hasGarage', label: 'Garage' },
                      { key: 'hasGarden', label: 'Garden' },
                      { key: 'recentRenovations', label: 'Recent Renovations' },
                    ].map(feature => (
                      <label key={feature.key} className="flex items-center p-3 border border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500">
                        <input
                          type="checkbox"
                          checked={formData[feature.key as keyof typeof formData] as boolean}
                          onChange={(e) => handleInputChange(feature.key, e.target.checked)}
                          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="ml-3 text-gray-700">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={calculateValuation}
                    className="flex-1 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Get Estimate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
              <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Property</h3>
              <p className="text-gray-600">We&apos;re calculating your home&apos;s estimated value based on recent sales and market data...</p>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && result && !loading && (
            <div className="space-y-6">
              {/* Main Estimate */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                <h2 className="text-lg font-semibold text-gray-600 mb-2">Estimated Home Value</h2>
                <div className="text-5xl font-bold text-emerald-600 mb-4">
                  K{formatCurrency(result.estimatedValue)}
                </div>
                <div className="flex items-center justify-center gap-4 text-gray-600 mb-6">
                  <span>Low: K{formatCurrency(result.lowEstimate)}</span>
                  <span>—</span>
                  <span>High: K{formatCurrency(result.highEstimate)}</span>
                </div>
                
                {/* Value Range Bar */}
                <div className="relative h-3 bg-gray-200 rounded-full mb-6">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                    style={{ 
                      left: '10%', 
                      right: '10%',
                    }}
                  ></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-emerald-600 rounded-full"
                    style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
                  ></div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    result.marketTrend === 'up' ? 'bg-green-100 text-green-700' :
                    result.marketTrend === 'down' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {result.marketTrend === 'up' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {result.marketTrend === 'down' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                    {result.trendPercent}% {result.marketTrend === 'up' ? 'increase' : result.marketTrend === 'down' ? 'decrease' : 'change'} this year
                  </span>
                </div>
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">K{formatCurrency(result.pricePerSqm)}</div>
                  <div className="text-sm text-gray-500">Price per m²</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formData.bedrooms}</div>
                  <div className="text-sm text-gray-500">Bedrooms</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formData.bathrooms}</div>
                  <div className="text-sm text-gray-500">Bathrooms</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formData.sizeSqm}m²</div>
                  <div className="text-sm text-gray-500">Total Size</div>
                </div>
              </div>

              {/* Comparable Sales */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales Nearby</h3>
                <div className="space-y-4">
                  {result.comparables.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{comp.address}</p>
                        <p className="text-sm text-gray-500">
                          {comp.bedrooms} bed • {comp.bathrooms} bath • {comp.sizeSqm}m² • Sold {comp.soldDate}
                        </p>
                      </div>
                      <div className="text-lg font-bold text-emerald-600">
                        K{formatCurrency(comp.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/dashboard/properties/new?listingType=SALE"
                  className="block py-4 bg-emerald-600 text-white text-center font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  List This Property
                </Link>
                <Link
                  href="/agents"
                  className="block py-4 bg-white text-emerald-600 text-center font-semibold rounded-xl border-2 border-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  Talk to an Agent
                </Link>
              </div>

              <button
                onClick={() => { setStep(1); setResult(null); }}
                className="w-full py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Calculate Another Property
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
