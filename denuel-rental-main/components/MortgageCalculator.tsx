'use client';

import React, { useState, useEffect } from 'react';

interface MortgageResult {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  loanAmount: number;
  downPaymentAmount: number;
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
  affordability: {
    maxHomePrice: number;
    maxLoanAmount: number;
    monthlyBudget: number;
    debtToIncomeRatio: number;
  };
}

interface MortgageCalculatorProps {
  propertyPrice?: number;
  className?: string;
}

export default function MortgageCalculator({ propertyPrice = 500000, className = '' }: MortgageCalculatorProps) {
  const [homePrice, setHomePrice] = useState(propertyPrice);
  const [downPayment, setDownPayment] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTerm, setLoanTerm] = useState(20);
  const [monthlyIncome, setMonthlyIncome] = useState(50000);
  const [monthlyDebts, setMonthlyDebts] = useState(5000);
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAmortization, setShowAmortization] = useState(false);

  useEffect(() => {
    if (propertyPrice) {
      setHomePrice(propertyPrice);
    }
  }, [propertyPrice]);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mortgage/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homePrice,
          downPaymentPercent: downPayment,
          interestRate,
          loanTermYears: loanTerm,
          monthlyIncome,
          monthlyDebts,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Mortgage Calculator</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Home Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Home Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ZMW
              </span>
              <input
                type="number"
                value={homePrice}
                onChange={(e) => setHomePrice(Number(e.target.value))}
                className="w-full pl-14 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <input
              type="range"
              min="100000"
              max="5000000"
              step="50000"
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value))}
              className="w-full mt-2 accent-blue-600"
            />
          </div>

          {/* Down Payment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Down Payment: {downPayment}% ({formatCurrency(homePrice * downPayment / 100)})
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={downPayment}
              onChange={(e) => setDownPayment(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interest Rate: {interestRate}%
            </label>
            <input
              type="range"
              min="5"
              max="20"
              step="0.5"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5%</span>
              <span>20%</span>
            </div>
          </div>

          {/* Loan Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Term
            </label>
            <div className="flex gap-2">
              {[10, 15, 20, 25, 30].map((term) => (
                <button
                  key={term}
                  onClick={() => setLoanTerm(term)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition ${
                    loanTerm === term
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {term} yr
                </button>
              ))}
            </div>
          </div>

          {/* Affordability Inputs */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Affordability Analysis
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Monthly Income
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Monthly Debts
                </label>
                <input
                  type="number"
                  value={monthlyDebts}
                  onChange={(e) => setMonthlyDebts(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={calculate}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate Payment'}
          </button>
        </div>

        {/* Results Section */}
        <div className="bg-gray-50 rounded-xl p-6">
          {result ? (
            <div className="space-y-6">
              {/* Monthly Payment */}
              <div className="text-center pb-4 border-b">
                <p className="text-sm text-gray-600">Your Monthly Payment</p>
                <p className="text-4xl font-bold text-blue-600">
                  {formatCurrency(result.monthlyPayment)}
                </p>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Amount</span>
                  <span className="font-semibold">{formatCurrency(result.loanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Down Payment</span>
                  <span className="font-semibold">{formatCurrency(result.downPaymentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Interest</span>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(result.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total Cost</span>
                  <span>{formatCurrency(result.totalPayment + result.downPaymentAmount)}</span>
                </div>
              </div>

              {/* Payment Breakdown Visual */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Payment Breakdown</p>
                <div className="h-4 rounded-full overflow-hidden bg-gray-200 flex">
                  <div
                    className="bg-blue-600"
                    style={{ width: `${(result.loanAmount / (result.totalPayment + result.downPaymentAmount)) * 100}%` }}
                  />
                  <div
                    className="bg-orange-500"
                    style={{ width: `${(result.totalInterest / (result.totalPayment + result.downPaymentAmount)) * 100}%` }}
                  />
                  <div
                    className="bg-green-500"
                    style={{ width: `${(result.downPaymentAmount / (result.totalPayment + result.downPaymentAmount)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Principal
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Interest
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Down Payment
                  </span>
                </div>
              </div>

              {/* Affordability */}
              {result.affordability && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Affordability Analysis
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Home Price</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(result.affordability.maxHomePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Debt-to-Income Ratio</span>
                      <span className={`font-semibold ${
                        result.affordability.debtToIncomeRatio <= 36
                          ? 'text-green-600'
                          : result.affordability.debtToIncomeRatio <= 43
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {result.affordability.debtToIncomeRatio.toFixed(1)}%
                      </span>
                    </div>
                    {result.affordability.debtToIncomeRatio > 43 && (
                      <p className="text-xs text-red-600 mt-2">
                        ⚠️ Your debt-to-income ratio exceeds recommended limits
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Toggle Amortization */}
              <button
                onClick={() => setShowAmortization(!showAmortization)}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                {showAmortization ? 'Hide' : 'Show'} Amortization Schedule
              </button>

              {showAmortization && result.schedule && (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="text-left text-gray-600">
                        <th className="py-1">Month</th>
                        <th className="py-1">Payment</th>
                        <th className="py-1">Principal</th>
                        <th className="py-1">Interest</th>
                        <th className="py-1">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.filter((_, i) => i % 12 === 0).map((row) => (
                        <tr key={row.month} className="border-t">
                          <td className="py-1">{row.month}</td>
                          <td className="py-1">{formatCurrency(row.payment)}</td>
                          <td className="py-1">{formatCurrency(row.principal)}</td>
                          <td className="py-1">{formatCurrency(row.interest)}</td>
                          <td className="py-1">{formatCurrency(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p>Enter your details and click Calculate to see your mortgage breakdown</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
