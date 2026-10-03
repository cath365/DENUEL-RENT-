"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import axios from 'axios';

interface EarningRecord {
  id: string;
  amount: number;
  date: string;
  tripId: string;
  pickup: string;
  dropoff: string;
  distance: number;
  customerName: string;
}

interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  total: number;
  list: EarningRecord[];
}

export default function DriverEarningsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      const { data } = await axios.get(`/api/driver/earnings?period=${period}`);
      setEarnings(data);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Mock data for visualization
  const weeklyData = [
    { day: 'Mon', amount: earnings?.today || 0 },
    { day: 'Tue', amount: (earnings?.today || 0) * 1.2 },
    { day: 'Wed', amount: (earnings?.today || 0) * 0.8 },
    { day: 'Thu', amount: (earnings?.today || 0) * 1.5 },
    { day: 'Fri', amount: (earnings?.today || 0) * 2 },
    { day: 'Sat', amount: (earnings?.today || 0) * 1.8 },
    { day: 'Sun', amount: (earnings?.today || 0) * 0.5 },
  ];
  const maxAmount = Math.max(...weeklyData.map(d => d.amount));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/driver')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8">💰 Earnings Overview</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5">
                <p className="text-green-200 text-sm font-medium">Today</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(earnings?.today || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5">
                <p className="text-blue-200 text-sm font-medium">This Week</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(earnings?.week || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5">
                <p className="text-purple-200 text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(earnings?.month || 0)}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-5">
                <p className="text-yellow-200 text-sm font-medium">Total Lifetime</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(earnings?.total || 0)}</p>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Weekly Performance</h2>
              <div className="flex items-end justify-between h-48 gap-2">
                {weeklyData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-700 rounded-t relative flex-1 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t transition-all duration-500"
                        style={{ 
                          height: maxAmount > 0 ? `${(item.amount / maxAmount) * 100}%` : '0%',
                          minHeight: item.amount > 0 ? '4px' : '0'
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Period Filter */}
            <div className="flex gap-2 mb-4">
              {(['week', 'month', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    period === p
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
                </button>
              ))}
            </div>

            {/* Earnings List */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Trip History</h2>
              </div>
              
              {earnings?.list && earnings.list.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {earnings.list.map((record) => (
                    <div key={record.id} className="p-4 hover:bg-gray-750 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-400 font-bold text-lg">
                              {formatCurrency(record.amount)}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                              {record.distance} km
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              <span className="truncate">{record.pickup}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              <span className="truncate">{record.dropoff}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
                          <p className="text-sm text-gray-400 mt-1">{record.customerName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No trips completed in this period</p>
                  <p className="text-sm mt-2">Complete trips to see your earnings here</p>
                </div>
              )}
            </div>

            {/* Withdrawal Section */}
            <div className="mt-8 bg-gradient-to-r from-gray-800 to-gray-750 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Available for Withdrawal</h3>
                  <p className="text-3xl font-bold text-green-400 mt-1">
                    {formatCurrency((earnings?.total || 0) * 0.8)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">20% platform fee already deducted</p>
                </div>
                <button className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Withdraw Funds
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
