"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface MarketingStats {
  totalViews: number;
  totalInquiries: number;
  totalFavorites: number;
  conversionRate: number;
}

interface PropertyPerformance {
  id: string;
  title: string;
  views: number;
  inquiries: number;
  favorites: number;
  conversionRate: number;
}

export default function MarketingPage() {
  const [stats, setStats] = useState<MarketingStats>({
    totalViews: 0,
    totalInquiries: 0,
    totalFavorites: 0,
    conversionRate: 0,
  });
  const [properties, setProperties] = useState<PropertyPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const fetchMarketingData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/marketing");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setProperties(data.properties);
      }
    } catch (err) {
      console.error("Failed to fetch marketing data:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing Tools</h1>
          <p className="text-gray-600 mt-2">
            Analyze performance and promote your properties effectively
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              </div>
              <div className="text-4xl">👁️</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inquiries</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalInquiries.toLocaleString()}</p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Favorites</p>
                <p className="text-3xl font-bold text-pink-600">{stats.totalFavorites.toLocaleString()}</p>
              </div>
              <div className="text-4xl">❤️</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-600">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">🚀</div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Advanced Marketing Tools Coming Soon!
              </h2>
              <p className="text-gray-700 mb-4">
                We're building powerful marketing features to help you attract more tenants:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">📊 Analytics & Insights</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Detailed visitor analytics and demographics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Peak viewing times and trends</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Conversion funnel tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Competitor analysis</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">📣 Promotion Features</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Featured listing upgrades</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Social media auto-posting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Email marketing campaigns</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Targeted advertising to interested users</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">💡 Smart Optimization</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>AI-powered pricing suggestions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Property description optimization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Photo quality analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>SEO recommendations</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">🎯 Lead Management</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Automated follow-up reminders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Lead scoring and prioritization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Response templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Bulk messaging tools</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-purple-300">
                <p className="text-sm font-semibold text-gray-900 mb-1">💰 Flexible Marketing Packages:</p>
                <p className="text-sm text-gray-700">
                  Choose from <span className="font-bold text-purple-600">Basic</span> (free tools), 
                  <span className="font-bold text-purple-600"> Pro</span> (K150/month), or 
                  <span className="font-bold text-purple-600"> Premium</span> (K350/month) plans to boost your property visibility.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Property Performance */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Property Performance
            </h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading...</p>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-600 mb-4">No properties to analyze yet</p>
                <p className="text-sm text-gray-500">
                  Add properties to see their marketing performance
                </p>
                <Link
                  href="/dashboard/properties/new"
                  className="inline-block mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Your First Property
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Inquiries
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Favorites
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Conversion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {properties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {property.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {property.views.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {property.inquiries.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {property.favorites.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`font-semibold ${
                              property.conversionRate >= 10
                                ? "text-green-600"
                                : property.conversionRate >= 5
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {property.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            href={`/property/${property.id}`}
                            className="text-purple-600 hover:text-purple-800 font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/dashboard/properties"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-3">🏘️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Manage Properties</h3>
            <p className="text-sm text-gray-600">
              View and edit your property listings
            </p>
          </Link>
          <Link
            href="/dashboard"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-3">📨</div>
            <h3 className="font-semibold text-gray-900 mb-2">View Inquiries</h3>
            <p className="text-sm text-gray-600">
              Respond to interested tenants
            </p>
          </Link>
          <Link
            href="/contact-support"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="text-3xl mb-3">💡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Request Ads</h3>
            <p className="text-sm text-gray-600">
              Contact admin for advertising options
            </p>
          </Link>
        </div>

        {/* Marketing Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Marketing Tips to Boost Your Listings
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p className="font-semibold mb-1">📸 Use High-Quality Photos</p>
              <p>Properties with 8+ photos get 3x more inquiries</p>
            </div>
            <div>
              <p className="font-semibold mb-1">💰 Competitive Pricing</p>
              <p>Research similar properties in your area</p>
            </div>
            <div>
              <p className="font-semibold mb-1">📝 Detailed Descriptions</p>
              <p>Highlight unique features and nearby amenities</p>
            </div>
            <div>
              <p className="font-semibold mb-1">⚡ Quick Responses</p>
              <p>Reply to inquiries within 24 hours for better results</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
