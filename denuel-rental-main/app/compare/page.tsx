import React from 'react';
import PropertyComparison from '@/components/PropertyComparison';

export const metadata = {
  title: 'Compare Properties | DENUEL Real Estate',
  description: 'Compare multiple properties side by side. See price, size, features, and scores to make the best decision.',
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">Compare Properties</h1>
          <p className="mt-2 text-purple-100 max-w-2xl">
            Can't decide between properties? Add up to 4 properties and compare them side by side
            to find the perfect match for your needs.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <PropertyComparison maxProperties={4} />

        {/* Tips Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Tips for Comparing Properties
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="font-semibold text-gray-900">Price per Square Meter</h3>
                <p className="text-sm text-gray-600">
                  Don't just compare total price - look at price per sqm to understand true value.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <h3 className="font-semibold text-gray-900">Location Matters</h3>
                <p className="text-sm text-gray-600">
                  Consider commute times, nearby amenities, and neighborhood safety.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">🏗️</span>
              <div>
                <h3 className="font-semibold text-gray-900">Age & Condition</h3>
                <p className="text-sm text-gray-600">
                  Newer isn't always better - consider maintenance costs and quality of construction.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <h3 className="font-semibold text-gray-900">Days on Market</h3>
                <p className="text-sm text-gray-600">
                  Properties listed longer may have more room for negotiation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
