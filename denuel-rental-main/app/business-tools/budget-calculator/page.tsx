"use client";

import React, { useState } from 'react';

export default function BudgetCalculator() {
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [savings, setSavings] = useState('');
  const [maxRent, setMaxRent] = useState<number | null>(null);

  const calculate = () => {
    const inc = parseFloat(income) || 0;
    const exp = parseFloat(expenses) || 0;
    const sav = parseFloat(savings) || 0;
    // Rule: Rent should be 30% of income
    const recommendedRent = (inc * 0.3) - exp - sav;
    setMaxRent(Math.max(0, recommendedRent));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Rent Budget Calculator</h1>
      <p className="mb-4">Estimate your comfortable monthly rent payment.</p>
      <div className="space-y-4">
        <div>
          <label className="block">Monthly Income ($)</label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block">Monthly Expenses (excluding rent, $)</label>
          <input
            type="number"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block">Monthly Savings Goal ($)</label>
          <input
            type="number"
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <button onClick={calculate} className="bg-blue-500 text-white p-2 rounded">
          Calculate
        </button>
        {maxRent !== null && (
          <div className="mt-4">
            <p>Recommended Max Rent: ${maxRent.toFixed(2)} per month</p>
            <p>(Based on 30% of income rule)</p>
          </div>
        )}
      </div>
    </div>
  );
}