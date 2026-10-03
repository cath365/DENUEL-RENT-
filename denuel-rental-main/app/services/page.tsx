import React from 'react';
import Link from 'next/link';
import ServicesMarketplace from '@/components/ServicesMarketplace';

export const metadata = {
  title: 'Home Services | DENUEL Real Estate',
  description: 'Find trusted home service providers - movers, cleaners, plumbers, electricians, and more.',
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">Home Services</h1>
          <p className="mt-2 text-green-100 max-w-2xl">
            Find trusted professionals for all your home needs. From moving to repairs,
            we've got you covered with verified service providers.
          </p>
        </div>
      </div>

      {/* Service Provider CTA */}
      <div className="bg-orange-50 border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-orange-800">Are you a service provider?</h3>
            <p className="text-orange-700 text-sm">
              Join our platform - gardeners, cleaners, plumbers, painters, security guards, movers, and more!
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/services/register"
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition font-medium"
            >
              Register as Provider
            </Link>
            <Link
              href="/auth/login"
              className="border border-orange-600 text-orange-600 px-6 py-2 rounded-lg hover:bg-orange-50 transition font-medium"
            >
              Provider Login
            </Link>
            <Link
              href="/services/dashboard"
              className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <ServicesMarketplace />

        {/* Why Use Our Services */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mx-auto mb-4">
              ✓
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Verified Providers
            </h3>
            <p className="text-gray-600">
              All our service providers are verified and vetted for quality and reliability.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-4">
              ⭐
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Real Reviews
            </h3>
            <p className="text-gray-600">
              Read honest reviews from real customers to find the right provider for your needs.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-3xl mx-auto mb-4">
              📅
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Easy Booking
            </h3>
            <p className="text-gray-600">
              Book services directly through our platform with just a few clicks.
            </p>
          </div>
        </div>

        {/* Categories Highlight */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Popular Services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { icon: '🚚', name: 'Moving', desc: 'Relocate stress-free' },
              { icon: '🧹', name: 'Cleaning', desc: 'Professional deep clean' },
              { icon: '🔧', name: 'Plumbing', desc: 'Fix leaks & pipes' },
              { icon: '⚡', name: 'Electrical', desc: 'Safe installations' },
              { icon: '🎨', name: 'Painting', desc: 'Refresh your space' },
              { icon: '🌿', name: 'Landscaping', desc: 'Beautiful gardens' },
              { icon: '🔍', name: 'Inspection', desc: 'Pre-purchase checks' },
              { icon: '🛋️', name: 'Design', desc: 'Interior makeovers' },
              { icon: '🐜', name: 'Pest Control', desc: 'Keep pests away' },
              { icon: '🔒', name: 'Security', desc: 'Protect your home' },
            ].map((service) => (
              <div
                key={service.name}
                className="border rounded-lg p-4 text-center hover:shadow-md transition cursor-pointer"
              >
                <div className="text-3xl mb-2">{service.icon}</div>
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                <p className="text-xs text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
