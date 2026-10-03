'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';
import { csrfFetch } from '../../lib/csrf';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  maxListings: number;
  maxPhotos: number;
  maxBoosts: number;
  hasFeaturedBadge: boolean;
  hasPrioritySupport: boolean;
  hasAnalytics: boolean;
  hasAutoBoost: boolean;
  freeInquiries: number;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/subscriptions/plans');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const res = await csrfFetch('/api/subscriptions');
      const data = await res.json();
      setCurrentPlan(data.subscription);
    } catch (error) {
      // User not logged in or no subscription
    }
  };

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (plan.price === 0) {
      // Free plan - activate immediately
      activateFreePlan(plan.id);
    } else {
      // Paid plan - show payment instructions
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const activateFreePlan = async (planId: string) => {
    try {
      const res = await csrfFetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      
      const data = await res.json();
      alert('Free plan activated!');
      fetchCurrentSubscription();
    } catch (error: any) {
      alert(error.message || 'Failed to activate plan');
    }
  };

  const handlePaymentConfirm = () => {
    alert('Thank you! Your payment will be verified within 1 hour and your account will be upgraded.');
    setShowPaymentModal(false);
    // In production, this would send a notification to admin
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-blue-50 mb-8">Choose the perfect plan for your property business</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 py-16 -mt-20">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-xl p-8 relative ${
                  plan.name === 'Premium' ? 'ring-4 ring-blue-500 scale-105' : ''
                }`}
              >
                {plan.name === 'Premium' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price === 0 ? 'Free' : `K${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-gray-600 ml-2">/month</span>}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-sm">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{plan.maxListings === -1 ? 'Unlimited' : plan.maxListings} listings</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Up to {plan.maxPhotos} photos</span>
                  </li>
                  {plan.maxBoosts > 0 && (
                    <li className="flex items-center text-sm">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{plan.maxBoosts === -1 ? 'Unlimited' : plan.maxBoosts} boosts/month</span>
                    </li>
                  )}
                  {plan.hasFeaturedBadge && (
                    <li className="flex items-center text-sm">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Featured badge</span>
                    </li>
                  )}
                  {plan.hasAnalytics && (
                    <li className="flex items-center text-sm">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Analytics dashboard</span>
                    </li>
                  )}
                  {plan.hasAutoBoost && (
                    <li className="flex items-center text-sm">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Auto boost daily</span>
                    </li>
                  )}
                  {plan.hasPrioritySupport && (
                    <li className="flex items-center text-sm">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Priority support</span>
                    </li>
                  )}
                  <li className="flex items-center text-sm">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{plan.freeInquiries === -1 ? 'Unlimited' : plan.freeInquiries} free inquiries</span>
                  </li>
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={currentPlan?.planId === plan.id}
                  className={`w-full py-3 rounded-full font-semibold transition-all ${
                    currentPlan?.planId === plan.id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : plan.name === 'Premium'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {currentPlan?.planId === plan.id ? 'Current Plan' : 'Choose Plan'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-2xl font-bold mb-4">Subscribe to {selectedPlan.name}</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Amount to Pay:</strong> K{selectedPlan.price}/month
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Send payment via Airtel Money to:</strong>
                </p>
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded-lg border-2 border-blue-300">
                    <p className="text-xl font-bold text-center text-blue-600">0973 914 432</p>
                  </div>
                  <p className="text-center text-gray-500 text-sm">or</p>
                  <div className="bg-white p-3 rounded-lg border-2 border-blue-300">
                    <p className="text-xl font-bold text-center text-blue-600">0779 690 132</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>📱 Steps:</strong>
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li>Dial *115# or open Airtel Money app</li>
                  <li>Send K{selectedPlan.price} to one of the numbers above</li>
                  <li>Click "I've Paid" button below</li>
                  <li>Your account will be upgraded within 1 hour</li>
                </ol>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePaymentConfirm}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-full font-semibold hover:from-green-700 hover:to-green-800 transition-all"
                >
                  ✓ I've Paid via Airtel Money
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                Need help? WhatsApp us: <a href="https://wa.me/260973914432" className="text-blue-600 hover:underline">+260 973 914 432</a>
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Additional Services */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Additional Services</h2>
        <p className="text-center text-gray-600 mb-12">
          Pay via Airtel Money to <strong className="text-blue-600">0973 914 432</strong> or <strong className="text-blue-600">0779 690 132</strong>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-transparent hover:border-blue-500 transition-all">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Featured Listing</h3>
            <p className="text-gray-600 mb-4">Get prominent placement with featured badge</p>
            <div className="text-3xl font-bold text-blue-600 mb-4">K50<span className="text-lg font-normal text-gray-500">/week</span></div>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>✓ Featured badge on listing</li>
              <li>✓ Priority in search results</li>
              <li>✓ 3x more views</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-transparent hover:border-orange-500 transition-all">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Urgent Badge</h3>
            <p className="text-gray-600 mb-4">Highlight urgency to attract quick responses</p>
            <div className="text-3xl font-bold text-orange-600 mb-4">K30<span className="text-lg font-normal text-gray-500">/week</span></div>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>✓ Urgent badge display</li>
              <li>✓ Attracts serious buyers</li>
              <li>✓ Faster inquiries</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-transparent hover:border-purple-500 transition-all">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Homepage Placement</h3>
            <p className="text-gray-600 mb-4">Premium position on our homepage</p>
            <div className="text-3xl font-bold text-purple-600 mb-4">K100<span className="text-lg font-normal text-gray-500">/week</span></div>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>✓ Homepage spotlight</li>
              <li>✓ Maximum visibility</li>
              <li>✓ 10x more views</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">💰 Payment Instructions</h3>
          <p className="text-green-50 mb-4">Send payment via Airtel Money then contact us with:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-green-100 mb-2">Primary Number:</p>
              <a href="tel:+260973914432" className="text-2xl font-bold hover:underline">0973 914 432</a>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-sm text-green-100 mb-2">Alternative Number:</p>
              <a href="tel:+260779690132" className="text-2xl font-bold hover:underline">0779 690 132</a>
            </div>
          </div>
          <p className="text-sm text-green-100 mt-4">
            📱 WhatsApp us after payment with your transaction details for instant activation
          </p>
        </div>
      </section>
    </main>
  );
}
