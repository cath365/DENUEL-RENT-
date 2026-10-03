'use client';

import React from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function ApplicationSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for applying to become a service provider on Denuel Rental. 
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
                  <p className="text-sm text-gray-500">We'll verify your submitted documents within 24-48 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Background Check</p>
                  <p className="text-sm text-gray-500">We'll verify your police clearance and credentials</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Approval Notification</p>
                  <p className="text-sm text-gray-500">You'll receive an email and SMS once your application is approved</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Start Earning</p>
                  <p className="text-sm text-gray-500">Once approved, you can start receiving and accepting job requests</p>
                </div>
              </div>
            </div>
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
              href="/dashboard"
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>

          {/* Contact */}
          <p className="text-sm text-gray-500 mt-8">
            Have questions? Contact us at{' '}
            <a href="mailto:support@denuelrental.com" className="text-blue-600 hover:underline">
              support@denuelrental.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
