'use client';

import React from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function DriverApplicationSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🚗</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for applying to become a driver on Denuel Rental Transport. 
            Your application has been received and is now under review.
          </p>

          {/* What's Next */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 text-left">
            <h2 className="font-semibold text-gray-900 mb-4">What happens next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Document Verification</p>
                  <p className="text-sm text-gray-500">We'll verify your license, vehicle documents, and insurance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Background Check</p>
                  <p className="text-sm text-gray-500">We'll verify your police clearance certificate</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Vehicle Inspection</p>
                  <p className="text-sm text-gray-500">Your vehicle details will be verified against registration</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Start Driving</p>
                  <p className="text-sm text-gray-500">Once approved, you'll be notified and can start accepting rides!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Info */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-8 text-white text-left">
            <h3 className="font-semibold mb-3">💰 Earning Potential</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-200">Daily Earnings</p>
                <p className="text-xl font-bold">K200 - K500+</p>
              </div>
              <div>
                <p className="text-blue-200">Weekly Earnings</p>
                <p className="text-xl font-bold">K1,000 - K3,000+</p>
              </div>
            </div>
            <p className="text-blue-200 text-xs mt-3">*Earnings depend on trips completed and hours worked</p>
          </div>

          {/* Timeline */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-yellow-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Estimated Review Time: 1-3 Business Days</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/driver"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Driver Dashboard
            </Link>
          </div>

          {/* Contact */}
          <p className="text-sm text-gray-500 mt-8">
            Have questions? Contact us at{' '}
            <a href="mailto:drivers@denuelrental.com" className="text-blue-600 hover:underline">
              drivers@denuelrental.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
