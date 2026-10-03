'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  pendingApprovals: number;
  totalRevenue: number;
  activeListings: number;
  reportedListings: number;
  newUsersToday: number;
  totalBookings: number;
}

interface RecentActivity {
  id: string;
  type: 'user_register' | 'property_submit' | 'booking' | 'report' | 'payment';
  description: string;
  timestamp: string;
  user?: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'properties' | 'reports'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch actual stats
      const [usersRes, propsRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/users?count=true').catch(() => null),
        fetch('/api/admin/properties?count=true').catch(() => null),
        fetch('/api/admin/bookings?count=true').catch(() => null),
      ]);

      // Use default stats for demo
      setStats({
        totalUsers: 1250,
        totalProperties: 856,
        pendingApprovals: 23,
        totalRevenue: 125000,
        activeListings: 743,
        reportedListings: 5,
        newUsersToday: 18,
        totalBookings: 432,
      });

      setActivities([
        { id: '1', type: 'user_register', description: 'New user registered', timestamp: '2 minutes ago', user: 'John Doe' },
        { id: '2', type: 'property_submit', description: 'New property submitted for approval', timestamp: '15 minutes ago', user: 'Jane Smith' },
        { id: '3', type: 'booking', description: 'New booking confirmed', timestamp: '1 hour ago', user: 'Mike Wilson' },
        { id: '4', type: 'report', description: 'Property reported for review', timestamp: '2 hours ago', user: 'Anonymous' },
        { id: '5', type: 'payment', description: 'Rent payment received', timestamp: '3 hours ago', user: 'Sarah Johnson' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_register': return '👤';
      case 'property_submit': return '🏠';
      case 'booking': return '📅';
      case 'report': return '⚠️';
      case 'payment': return '💰';
      default: return '📌';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_register': return 'bg-blue-100 text-blue-800';
      case 'property_submit': return 'bg-green-100 text-green-800';
      case 'booking': return 'bg-purple-100 text-purple-800';
      case 'report': return 'bg-red-100 text-red-800';
      case 'payment': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your platform</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Export Data
              </button>
              <Link
                href="/admin/settings"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-6">
            {['overview', 'users', 'properties', 'reports'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers.toLocaleString()}</p>
                    <p className="text-sm text-green-600 mt-1">+{stats?.newUsersToday} today</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Properties</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalProperties.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">{stats?.activeListings} active</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Approvals</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats?.pendingApprovals}</p>
                    <p className="text-sm text-gray-500 mt-1">{stats?.reportedListings} reports</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">K{stats?.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">{stats?.totalBookings} bookings</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link
                    href="/admin/properties/pending"
                    className="flex flex-col items-center p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">📋</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Review Properties</span>
                    <span className="text-xs text-yellow-700">{stats?.pendingApprovals} pending</span>
                  </Link>

                  <Link
                    href="/admin/users"
                    className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">👥</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Manage Users</span>
                    <span className="text-xs text-blue-700">{stats?.totalUsers} users</span>
                  </Link>

                  <Link
                    href="/admin/reports"
                    className="flex flex-col items-center p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">View Reports</span>
                    <span className="text-xs text-red-700">{stats?.reportedListings} reports</span>
                  </Link>

                  <Link
                    href="/admin/service-providers"
                    className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">🔧</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Service Providers</span>
                    <span className="text-xs text-green-700">Verify & manage</span>
                  </Link>

                  <Link
                    href="/admin/approvals"
                    className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">✅</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Approve Providers</span>
                    <span className="text-xs text-orange-700">Drivers, Maids, Security</span>
                  </Link>

                  <Link
                    href="/admin/drivers"
                    className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">🚗</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Drivers</span>
                    <span className="text-xs text-purple-700">Manage drivers</span>
                  </Link>

                  <Link
                    href="/admin/payments"
                    className="flex flex-col items-center p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">💳</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Payments</span>
                    <span className="text-xs text-indigo-700">Transactions & payouts</span>
                  </Link>

                  <Link
                    href="/admin/analytics"
                    className="flex flex-col items-center p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-teal-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">📊</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Analytics</span>
                    <span className="text-xs text-teal-700">Stats & insights</span>
                  </Link>

                  <Link
                    href="/admin/subscriptions"
                    className="flex flex-col items-center p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">💎</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Subscriptions</span>
                    <span className="text-xs text-pink-700">Activate plans</span>
                  </Link>

                  <Link
                    href="/admin/revenue"
                    className="flex flex-col items-center p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">💰</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Revenue</span>
                    <span className="text-xs text-emerald-700">Financial reports</span>
                  </Link>

                  <Link
                    href="/admin/support"
                    className="flex flex-col items-center p-4 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-violet-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">💬</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Support Messages</span>
                    <span className="text-xs text-violet-700">User inquiries & ads</span>
                  </Link>

                  <Link
                    href="/admin/verifications"
                    className="flex flex-col items-center p-4 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-sky-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">🆔</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Verifications</span>
                    <span className="text-xs text-sky-700">Review ID & docs</span>
                  </Link>

                  <Link
                    href="/admin/testimonials"
                    className="flex flex-col items-center p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">⭐</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Testimonials</span>
                    <span className="text-xs text-yellow-700">Renters reviews</span>
                  </Link>

                  <Link
                    href="/admin/settings"
                    className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                      <span className="text-lg">⚙️</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Settings</span>
                    <span className="text-xs text-gray-700">System config</span>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        <span className="text-sm">{getActivityIcon(activity.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        {activity.user && (
                          <p className="text-xs text-gray-500">{activity.user}</p>
                        )}
                        <p className="text-xs text-gray-400">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/admin/activity"
                  className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-4"
                >
                  View All Activity →
                </Link>
              </div>
            </div>

            {/* Charts & Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Revenue Chart Placeholder */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-500">Revenue chart visualization</p>
                    <p className="text-sm text-gray-400">Monthly trends & projections</p>
                  </div>
                </div>
              </div>

              {/* User Growth Chart Placeholder */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p className="text-gray-500">User growth chart</p>
                    <p className="text-sm text-gray-400">Daily registrations & retention</p>
                  </div>
                </div>
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-600">⚠️</span>
                    <div>
                      <p className="font-medium text-yellow-800">{stats?.pendingApprovals} properties pending approval</p>
                      <p className="text-sm text-yellow-600">Some have been waiting over 24 hours</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/properties/pending"
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                  >
                    Review Now
                  </Link>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-3">
                    <span className="text-red-600">🚨</span>
                    <div>
                      <p className="font-medium text-red-800">{stats?.reportedListings} reported listings need review</p>
                      <p className="text-sm text-red-600">User reports require admin attention</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/reports"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    View Reports
                  </Link>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">✅</span>
                    <div>
                      <p className="font-medium text-green-800">System running normally</p>
                      <p className="text-sm text-green-600">All services operational</p>
                    </div>
                  </div>
                  <Link
                    href="/admin/system"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    System Status
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}