'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import { csrfFetch } from '../../../lib/csrf';

export default function RevenueDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchRevenue();
  }, [period]);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await csrfFetch(`/api/admin/revenue?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-blue-600">
              K{data?.summary?.totalRevenue?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-gray-600 text-sm mb-1">Platform Commission</p>
            <p className="text-3xl font-bold text-green-600">
              K{data?.summary?.totalCommission?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-gray-600 text-sm mb-1">Monthly Recurring</p>
            <p className="text-3xl font-bold text-purple-600">
              K{data?.summary?.monthlyRecurring?.toLocaleString() || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-gray-600 text-sm mb-1">Transactions</p>
            <p className="text-3xl font-bold text-gray-900">
              {data?.summary?.transactionCount?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-blue-100 text-sm mb-1">Active Subscriptions</p>
            <p className="text-4xl font-bold">{data?.summary?.activeSubscriptions || 0}</p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-green-100 text-sm mb-1">Active Boosts</p>
            <p className="text-4xl font-bold">{data?.summary?.activeBoosts || 0}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <p className="text-purple-100 text-sm mb-1">Avg Transaction</p>
            <p className="text-4xl font-bold">
              K{data?.summary?.transactionCount > 0 
                ? Math.round(data.summary.totalRevenue / data.summary.transactionCount)
                : 0}
            </p>
          </div>
        </div>

        {/* Revenue by Type */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Revenue by Type</h2>
          <div className="space-y-4">
            {data?.revenueByType?.map((item: any) => (
              <div key={item.type} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{item.type.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-600">{item._count} transactions</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  K{(item._sum.amount || 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Property</th>
                  <th className="text-right py-3 px-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTransactions?.slice(0, 20).map((tx: any) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {tx.user?.name || tx.user?.email || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {tx.property?.title || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      K{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
