import React from 'react';
import MarketAnalyticsDashboard from '@/components/MarketAnalyticsDashboard';

export const metadata = {
  title: 'Market Analytics | DENUEL Real Estate',
  description: 'Real estate market insights, trends, and analytics for Zambia. Track prices, inventory, and market conditions.',
};

export default function MarketPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">Market Analytics</h1>
          <p className="mt-2 text-indigo-100 max-w-2xl">
            Stay informed with real-time market data, trends, and insights.
            Make smarter decisions with comprehensive analytics.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <MarketAnalyticsDashboard />

        {/* Market Insights */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Understanding Market Types
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
                  S
                </span>
                <div>
                  <p className="font-medium text-gray-900">Seller's Market</p>
                  <p className="text-sm text-gray-600">
                    High demand, low inventory. Properties sell quickly, often above asking price.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">
                  B
                </span>
                <div>
                  <p className="font-medium text-gray-900">Buyer's Market</p>
                  <p className="text-sm text-gray-600">
                    High inventory, low demand. More negotiating power for buyers.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                  =
                </span>
                <div>
                  <p className="font-medium text-gray-900">Balanced Market</p>
                  <p className="text-sm text-gray-600">
                    Supply matches demand. Fair conditions for both buyers and sellers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Key Metrics Explained
            </h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">Median Price</p>
                <p className="text-sm text-gray-600">
                  The middle price point - half the properties cost more, half cost less.
                  More reliable than average as it's not skewed by outliers.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Days on Market (DOM)</p>
                <p className="text-sm text-gray-600">
                  How long properties take to sell. Lower DOM indicates a hot market.
                  Higher DOM may mean more room for negotiation.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Price per Square Meter</p>
                <p className="text-sm text-gray-600">
                  Helps compare properties of different sizes fairly.
                  Useful for identifying good value.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to Find Your Home?</h2>
          <p className="text-blue-100 mb-6">
            Now that you understand the market, start your search with confidence.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/rent"
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Browse Rentals
            </a>
            <a
              href="/buy"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition"
            >
              Properties for Sale
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
