'use client';

import React, { useState } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';

const buyingSteps = [
  {
    id: 1,
    title: 'Determine Your Budget',
    icon: '💰',
    description: 'Understand what you can afford before starting your home search.',
    details: [
      'Calculate your total savings and how much you can use for a down payment',
      'Check your credit score and work on improving it if needed',
      'Get pre-approved for a mortgage to know your price range',
      'Consider additional costs: closing fees, property taxes, insurance',
      'Use our mortgage calculator to estimate monthly payments',
    ],
    tip: 'Most lenders recommend your total housing costs not exceed 28-30% of your monthly income.',
    link: '/buy/mortgage-calculator',
    linkText: 'Use Mortgage Calculator',
  },
  {
    id: 2,
    title: 'Find a Real Estate Agent',
    icon: '🤝',
    description: 'A good agent can guide you through the entire buying process.',
    details: [
      'Look for agents with experience in your target neighborhoods',
      'Check reviews and ask for references',
      'Interview multiple agents before choosing',
      'Understand how agent commissions work in Zambia',
      'Ensure they understand your needs and budget',
    ],
    tip: 'Buyer\'s agents are typically paid by the seller, so their services are free to you.',
    link: '/agents',
    linkText: 'Find an Agent',
  },
  {
    id: 3,
    title: 'Search for Properties',
    icon: '🔍',
    description: 'Start exploring homes that match your criteria.',
    details: [
      'List your must-haves vs. nice-to-haves',
      'Research neighborhoods for amenities, schools, and safety',
      'Consider commute times to work',
      'Visit properties in person when possible',
      'Take notes and photos during viewings',
    ],
    tip: 'Don\'t just focus on the house - the neighborhood is equally important for long-term satisfaction.',
    link: '/buy',
    linkText: 'Browse Properties',
  },
  {
    id: 4,
    title: 'Make an Offer',
    icon: '📝',
    description: 'Once you find the right home, it\'s time to make your move.',
    details: [
      'Research comparable sales to determine a fair price',
      'Work with your agent to craft a competitive offer',
      'Include contingencies for financing and inspection',
      'Be prepared to negotiate with the seller',
      'Consider offering earnest money to show serious intent',
    ],
    tip: 'In a competitive market, being flexible on closing dates can make your offer more attractive.',
  },
  {
    id: 5,
    title: 'Get a Home Inspection',
    icon: '🔧',
    description: 'A thorough inspection protects you from costly surprises.',
    details: [
      'Hire a licensed home inspector',
      'Attend the inspection if possible',
      'Review the report carefully',
      'Negotiate repairs or price adjustments based on findings',
      'Consider specialized inspections (termites, roof, plumbing)',
    ],
    tip: 'Never skip the inspection - even for new construction. Issues can be negotiated before closing.',
  },
  {
    id: 6,
    title: 'Secure Your Financing',
    icon: '🏦',
    description: 'Finalize your mortgage and prepare for closing.',
    details: [
      'Submit all required documentation to your lender',
      'Lock in your interest rate when favorable',
      'Avoid making large purchases or opening new credit',
      'Review the loan estimate and closing disclosure carefully',
      'Ask questions about anything you don\'t understand',
    ],
    tip: 'Keep all your financial documents organized - you\'ll need pay stubs, tax returns, and bank statements.',
  },
  {
    id: 7,
    title: 'Close the Deal',
    icon: '🎉',
    description: 'The final step to becoming a homeowner!',
    details: [
      'Do a final walkthrough of the property',
      'Review all closing documents before signing',
      'Bring required funds (certified check or wire transfer)',
      'Receive the keys to your new home',
      'Update your address and set up utilities',
    ],
    tip: 'Closing typically takes 2-4 hours. Bring a valid ID and don\'t hesitate to ask questions about any document.',
  },
];

const faqs = [
  {
    question: 'How much down payment do I need?',
    answer: 'In Zambia, most banks require a minimum down payment of 10-20% of the property value. However, putting down more can lower your monthly payments and help you avoid private mortgage insurance.',
  },
  {
    question: 'What are closing costs?',
    answer: 'Closing costs typically include legal fees, stamp duty (property transfer tax), valuation fees, and bank processing fees. These usually total 3-5% of the purchase price.',
  },
  {
    question: 'How long does the buying process take?',
    answer: 'On average, the home buying process in Zambia takes 2-4 months from when you start searching to when you close. Cash purchases can be faster, while mortgage purchases may take longer.',
  },
  {
    question: 'Should I get a home inspection?',
    answer: 'Yes! A home inspection is crucial. It can reveal hidden problems that could cost thousands to repair. Most purchase agreements include an inspection contingency.',
  },
  {
    question: 'What is title insurance?',
    answer: 'Title insurance protects you against any claims or legal issues that may arise regarding the property\'s ownership. It\'s a one-time fee paid at closing.',
  },
  {
    question: 'Can I negotiate the price?',
    answer: 'Absolutely! Most sellers expect some negotiation. Your agent can help you determine a fair offer based on market conditions and comparable sales.',
  },
];

export default function BuyingGuidePage() {
  const [activeStep, setActiveStep] = useState(1);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/buy" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Buy
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Home Buying Guide</h1>
            <p className="text-xl text-emerald-100">
              Your step-by-step guide to buying a home in Zambia
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Start */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h2>
                <p className="text-gray-600 mb-6">
                  Begin your home buying journey with these essential first steps. Whether you&apos;re a first-time buyer or an experienced investor, we&apos;re here to help.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/buy/mortgage-calculator"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Calculate Budget
                  </Link>
                  <Link
                    href="/buy"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl border-2 border-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    Browse Homes
                  </Link>
                </div>
              </div>
              <div className="w-40 h-40 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <span className="text-7xl">🏠</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buying Steps */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">7 Steps to Buying a Home</h2>
          
          {/* Steps Timeline */}
          <div className="hidden md:flex justify-between items-center mb-8 px-4">
            {buyingSteps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                    activeStep === step.id
                      ? 'bg-emerald-600 text-white scale-110'
                      : activeStep > step.id
                      ? 'bg-emerald-200 text-emerald-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.id}
                </button>
                {idx < buyingSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    activeStep > step.id ? 'bg-emerald-400' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          {buyingSteps.map((step) => (
            <div
              key={step.id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-4 transition-all ${
                activeStep === step.id ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              <button
                onClick={() => setActiveStep(activeStep === step.id ? 0 : step.id)}
                className="w-full flex items-start gap-4 text-left"
              >
                <span className="text-4xl">{step.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-emerald-600">Step {step.id}</span>
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                <svg
                  className={`w-6 h-6 text-gray-400 transition-transform ${
                    activeStep === step.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {activeStep === step.id && (
                <div className="mt-6 pl-16">
                  <ul className="space-y-3 mb-6">
                    {step.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div>
                        <p className="font-semibold text-amber-800">Pro Tip</p>
                        <p className="text-amber-700">{step.tip}</p>
                      </div>
                    </div>
                  </div>

                  {step.link && (
                    <Link
                      href={step.link}
                      className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700"
                    >
                      {step.linkText}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedFaq === idx ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFaq === idx && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Checklist Download */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Download Our Home Buying Checklist</h2>
            <p className="text-gray-300 mb-6">
              Stay organized throughout your home buying journey with our comprehensive checklist.
            </p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF Checklist
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
