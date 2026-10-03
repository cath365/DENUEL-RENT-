'use client';

import React, { useState, useMemo } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';

export default function MortgageCalculatorPage() {
  const [homePrice, setHomePrice] = useState(1500000);
  const [downPayment, setDownPayment] = useState(300000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTerm, setLoanTerm] = useState(20);
  const [interestRate, setInterestRate] = useState(18);
  const [propertyTax, setPropertyTax] = useState(1);
  const [insurance, setInsurance] = useState(0.5);

  const handleDownPaymentChange = (value: number) => {
    setDownPayment(value);
    setDownPaymentPercent(Math.round((value / homePrice) * 100));
  };

  const handleDownPaymentPercentChange = (percent: number) => {
    setDownPaymentPercent(percent);
    setDownPayment(Math.round(homePrice * (percent / 100)));
  };

  const handleHomePriceChange = (price: number) => {
    setHomePrice(price);
    setDownPayment(Math.round(price * (downPaymentPercent / 100)));
  };

  const calculations = useMemo(() => {
    const principal = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    // Monthly mortgage payment (P&I)
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    // Monthly property tax
    const monthlyTax = (homePrice * (propertyTax / 100)) / 12;

    // Monthly insurance
    const monthlyInsurance = (homePrice * (insurance / 100)) / 12;

    // Total monthly payment
    const totalMonthly = monthlyPayment + monthlyTax + monthlyInsurance;

    // Total interest over life of loan
    const totalInterest = (monthlyPayment * numberOfPayments) - principal;

    // Total cost of home
    const totalCost = (totalMonthly * numberOfPayments) + downPayment;

    return {
      principal,
      monthlyPayment: isNaN(monthlyPayment) ? 0 : monthlyPayment,
      monthlyTax,
      monthlyInsurance,
      totalMonthly: isNaN(totalMonthly) ? 0 : totalMonthly,
      totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
      totalCost: isNaN(totalCost) ? 0 : totalCost,
    };
  }, [homePrice, downPayment, loanTerm, interestRate, propertyTax, insurance]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate amortization schedule (first 12 months)
  const amortizationSchedule = useMemo(() => {
    const schedule = [];
    let balance = calculations.principal;
    const monthlyRate = interestRate / 100 / 12;

    for (let month = 1; month <= 12; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = calculations.monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment: calculations.monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }

    return schedule;
  }, [calculations.principal, calculations.monthlyPayment, interestRate]);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Link href="/buy" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Buy
            </Link>
            <h1 className="text-4xl font-bold mb-4">Mortgage Calculator</h1>
            <p className="text-xl text-emerald-100">
              Calculate your monthly mortgage payments and see the full cost breakdown
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calculator Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Home Price */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <label className="block text-lg font-semibold text-gray-900 mb-4">Home Price</label>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl font-bold text-emerald-600">K</span>
                  <input
                    type="number"
                    value={homePrice}
                    onChange={(e) => handleHomePriceChange(Number(e.target.value))}
                    className="flex-1 text-3xl font-bold text-gray-900 border-0 focus:ring-0 p-0"
                  />
                </div>
                <input
                  type="range"
                  min={100000}
                  max={10000000}
                  step={50000}
                  value={homePrice}
                  onChange={(e) => handleHomePriceChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>K100,000</span>
                  <span>K10,000,000</span>
                </div>
              </div>

              {/* Down Payment */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <label className="block text-lg font-semibold text-gray-900 mb-4">Down Payment</label>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-500">Amount</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-emerald-600">K</span>
                      <input
                        type="number"
                        value={downPayment}
                        onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                        className="flex-1 text-2xl font-bold text-gray-900 border-0 focus:ring-0 p-0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Percentage</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={downPaymentPercent}
                        onChange={(e) => handleDownPaymentPercentChange(Number(e.target.value))}
                        className="flex-1 text-2xl font-bold text-gray-900 border-0 focus:ring-0 p-0"
                      />
                      <span className="text-xl font-bold text-emerald-600">%</span>
                    </div>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={1}
                  value={downPaymentPercent}
                  onChange={(e) => handleDownPaymentPercentChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>0%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term (Years)</label>
                    <select
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value={10}>10 years</option>
                      <option value={15}>15 years</option>
                      <option value={20}>20 years</option>
                      <option value={25}>25 years</option>
                      <option value={30}>30 years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Property Tax Rate (%/year)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={propertyTax}
                      onChange={(e) => setPropertyTax(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Home Insurance (%/year)</label>
                    <input
                      type="number"
                      step={0.1}
                      value={insurance}
                      onChange={(e) => setInsurance(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Amortization Schedule */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">First Year Payment Schedule</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3">Month</th>
                        <th className="pb-3">Payment</th>
                        <th className="pb-3">Principal</th>
                        <th className="pb-3">Interest</th>
                        <th className="pb-3">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {amortizationSchedule.map((row) => (
                        <tr key={row.month} className="border-b border-gray-100">
                          <td className="py-3">{row.month}</td>
                          <td className="py-3">K{formatCurrency(row.payment)}</td>
                          <td className="py-3 text-emerald-600">K{formatCurrency(row.principal)}</td>
                          <td className="py-3 text-amber-600">K{formatCurrency(row.interest)}</td>
                          <td className="py-3">K{formatCurrency(row.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Payment</h3>
                
                <div className="text-center mb-8">
                  <div className="text-5xl font-bold text-emerald-600 mb-2">
                    K{formatCurrency(calculations.totalMonthly)}
                  </div>
                  <p className="text-gray-500">per month</p>
                </div>

                {/* Payment Breakdown */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-gray-600">Principal & Interest</span>
                    </div>
                    <span className="font-semibold">K{formatCurrency(calculations.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Property Tax</span>
                    </div>
                    <span className="font-semibold">K{formatCurrency(calculations.monthlyTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-gray-600">Insurance</span>
                    </div>
                    <span className="font-semibold">K{formatCurrency(calculations.monthlyInsurance)}</span>
                  </div>
                </div>

                {/* Visual Breakdown */}
                <div className="h-4 rounded-full overflow-hidden flex mb-8">
                  <div 
                    className="bg-emerald-500" 
                    style={{ width: `${(calculations.monthlyPayment / calculations.totalMonthly) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-blue-500" 
                    style={{ width: `${(calculations.monthlyTax / calculations.totalMonthly) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-amber-500" 
                    style={{ width: `${(calculations.monthlyInsurance / calculations.totalMonthly) * 100}%` }}
                  ></div>
                </div>

                {/* Summary */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loan Amount</span>
                    <span className="font-semibold">K{formatCurrency(calculations.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interest</span>
                    <span className="font-semibold text-amber-600">K{formatCurrency(calculations.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-900">Total Cost</span>
                    <span className="font-bold text-emerald-600">K{formatCurrency(calculations.totalCost)}</span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 space-y-3">
                  <Link
                    href="/buy"
                    className="block w-full py-3 bg-emerald-600 text-white text-center font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Find Homes in Budget
                  </Link>
                  <Link
                    href="/agents"
                    className="block w-full py-3 bg-white text-emerald-600 text-center font-semibold rounded-xl border-2 border-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    Talk to an Agent
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
