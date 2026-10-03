import React from 'react';
import MortgageCalculator from '@/components/MortgageCalculator';

export const metadata = {
  title: 'Mortgage Calculator | DENUEL Real Estate',
  description: 'Calculate your monthly mortgage payments, see amortization schedules, and check what you can afford.',
};

export default function MortgageCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold">Mortgage Calculator</h1>
          <p className="mt-2 text-blue-100 max-w-2xl">
            Estimate your monthly mortgage payments and see how much home you can afford.
            Get a full amortization schedule and understand the true cost of your loan.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <MortgageCalculator />

        {/* Educational Content */}
        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-4">
              💡
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Understanding Your Payment
            </h3>
            <p className="text-gray-600 text-sm">
              Your monthly payment includes principal (loan amount) and interest.
              Early payments are mostly interest, while later payments go mostly toward principal.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              The 28/36 Rule
            </h3>
            <p className="text-gray-600 text-sm">
              Lenders typically want your housing costs under 28% of gross income,
              and total debt payments under 36%. This helps ensure you can afford your mortgage.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-2xl mb-4">
              🏠
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Down Payment Impact
            </h3>
            <p className="text-gray-600 text-sm">
              A larger down payment means lower monthly payments and less interest over time.
              Aim for at least 20% to avoid additional insurance costs.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">
                How is my monthly payment calculated?
              </h3>
              <p className="mt-1 text-gray-600">
                We use the standard amortization formula that takes into account your loan amount,
                interest rate, and loan term. The formula ensures equal monthly payments throughout the loan.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                What interest rate should I use?
              </h3>
              <p className="mt-1 text-gray-600">
                Use the rate offered by your lender. If you're just exploring, current market rates
                in Zambia typically range from 8% to 15% depending on the lender and your creditworthiness.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Does this include property taxes and insurance?
              </h3>
              <p className="mt-1 text-gray-600">
                This calculator shows principal and interest only. Your actual payment may include
                property taxes, homeowner's insurance, and potentially HOA fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
