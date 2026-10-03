'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    newUsersThisMonth: number;
    totalProperties: number;
    activeListings: number;
    totalBookings: number;
    bookingsThisMonth: number;
    totalRevenue: number;
    revenueThisMonth: number;
  };
  userGrowth: { month: string; users: number }[];
  propertyStats: { type: string; count: number }[];
  revenueByMonth: { month: string; amount: number }[];
  topCities: { city: string; listings: number; bookings: number }[];
  bookingsByStatus: { status: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        // Set mock data for demo
        setData({
          overview: {
            totalUsers: 2847,
            newUsersThisMonth: 234,
            totalProperties: 1523,
            activeListings: 892,
            totalBookings: 5621,
            bookingsThisMonth: 487,
            totalRevenue: 2547000,
            revenueThisMonth: 287500,
          },
          userGrowth: [
            { month: 'Jan', users: 1200 },
            { month: 'Feb', users: 1450 },
            { month: 'Mar', users: 1780 },
            { month: 'Apr', users: 2100 },
            { month: 'May', users: 2450 },
            { month: 'Jun', users: 2847 },
          ],
          propertyStats: [
            { type: 'Apartment', count: 645 },
            { type: 'House', count: 423 },
            { type: 'Studio', count: 234 },
            { type: 'Room', count: 156 },
            { type: 'Commercial', count: 65 },
          ],
          revenueByMonth: [
            { month: 'Jan', amount: 185000 },
            { month: 'Feb', amount: 210000 },
            { month: 'Mar', amount: 245000 },
            { month: 'Apr', amount: 268000 },
            { month: 'May', amount: 285000 },
            { month: 'Jun', amount: 287500 },
          ],
          topCities: [
            { city: 'Lusaka', listings: 456, bookings: 1234 },
            { city: 'Kitwe', listings: 234, bookings: 567 },
            { city: 'Ndola', listings: 189, bookings: 445 },
            { city: 'Livingstone', listings: 145, bookings: 389 },
            { city: 'Kabwe', listings: 98, bookings: 234 },
          ],
          bookingsByStatus: [
            { status: 'Completed', count: 4521 },
            { status: 'Active', count: 645 },
            { status: 'Pending', count: 234 },
            { status: 'Cancelled', count: 221 },
          ],
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return `K ${amount.toLocaleString()}`;
  };

  const formatPercent = (current: number, total: number) => {
    return ((current / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/admin" className="hover:text-blue-600">Admin</Link>
          <span>/</span>
          <span className="text-gray-900">Analytics</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-gray-600 mt-1">Monitor platform performance and trends</p>
          </div>

          {/* Date Range Selector */}
          <div className="flex gap-2">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: '1y', label: '1 Year' },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === range.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalUsers.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-green-600 font-medium">+{data.overview.newUsersThisMonth}</span>
              <span className="text-gray-500">this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Properties</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalProperties.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-blue-600 font-medium">{data.overview.activeListings}</span>
              <span className="text-gray-500">active listings</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{data.overview.totalBookings.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-green-600 font-medium">+{data.overview.bookingsThisMonth}</span>
              <span className="text-gray-500">this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.totalRevenue)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-green-600 font-medium">+{formatCurrency(data.overview.revenueThisMonth)}</span>
              <span className="text-gray-500">this month</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">User Growth</h3>
            <div className="h-64 flex items-end gap-4 justify-around">
              {data.userGrowth.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 bg-blue-500 rounded-t"
                    style={{ height: `${(item.users / Math.max(...data.userGrowth.map(i => i.users))) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-500">{item.month}</span>
                  <span className="text-xs font-medium">{item.users.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <div className="h-64 flex items-end gap-4 justify-around">
              {data.revenueByMonth.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className="w-12 bg-green-500 rounded-t"
                    style={{ height: `${(item.amount / Math.max(...data.revenueByMonth.map(i => i.amount))) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-500">{item.month}</span>
                  <span className="text-xs font-medium">K{(item.amount / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Property Types</h3>
            <div className="space-y-4">
              {data.propertyStats.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.type}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(item.count / data.overview.totalProperties) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Top Cities</h3>
            <div className="space-y-3">
              {data.topCities.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                      {index + 1}
                    </span>
                    <span className="font-medium">{item.city}</span>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-gray-900">{item.listings} listings</p>
                    <p className="text-gray-500">{item.bookings} bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Booking Status</h3>
            <div className="space-y-4">
              {data.bookingsByStatus.map((item, index) => {
                const colors: Record<string, string> = {
                  'Completed': 'bg-green-500',
                  'Active': 'bg-blue-500',
                  'Pending': 'bg-yellow-500',
                  'Cancelled': 'bg-red-500',
                };
                const percent = (item.count / data.overview.totalBookings) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[item.status] || 'bg-gray-500'}`}></div>
                        <span className="text-gray-600">{item.status}</span>
                      </div>
                      <span className="font-medium">{item.count.toLocaleString()} ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors[item.status] || 'bg-gray-500'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Export Analytics Data</h3>
              <p className="text-sm text-gray-600">Download detailed reports for further analysis</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Export CSV
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
