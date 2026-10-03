'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalProperties: number;
  activeLeases: number;
  pendingRentAmount: number;
  maintenanceRequests: number;
  rentCollected: number;
  screeningRequests: number;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
  property: {
    title: string;
  };
}

interface UpcomingPayment {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  tenant: { name: string };
  property: { title: string };
}

export default function LandlordDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'maintenance' | 'payments' | 'leases' | 'expenses'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [maintenanceRes, paymentsRes, propertiesRes, leasesRes, screeningsRes] = await Promise.all([
        fetch('/api/landlord/maintenance'),
        fetch('/api/landlord/rent-payments?role=landlord'),
        fetch('/api/properties/mine'),
        fetch('/api/landlord/leases'),
        fetch('/api/landlord/screening?role=landlord'),
      ]);

      const maintenanceData = maintenanceRes.ok ? await maintenanceRes.json() : { requests: [] };
      const paymentData = paymentsRes.ok ? await paymentsRes.json() : { payments: [], stats: {} };
      const propertyData = propertiesRes.ok ? await propertiesRes.json() : { items: [] };
      const leaseData = leasesRes.ok ? await leasesRes.json() : [];
      const screeningData = screeningsRes.ok ? await screeningsRes.json() : [];

      const requests = Array.isArray(maintenanceData.requests) ? maintenanceData.requests : [];
      setMaintenanceRequests(requests.filter((r: any) => ['OPEN', 'IN_PROGRESS'].includes(r.status)));

      const payments = Array.isArray(paymentData.payments) ? paymentData.payments : [];
      setUpcomingPayments(payments
        .filter((p: any) => p.status === 'PENDING')
        .slice(0, 8)
        .map((p: any) => ({
          id: p.id,
          amount: p.amount,
          dueDate: p.dueDate,
          status: p.status,
          tenant: { name: p.lease?.tenant?.name || 'Tenant' },
          property: { title: p.lease?.property?.title || 'Property' },
        })));

      const leases = Array.isArray(leaseData) ? leaseData : [];
      const screenings = Array.isArray(screeningData) ? screeningData : [];
      const properties = Array.isArray(propertyData.items) ? propertyData.items : [];

      setStats({
        totalProperties: properties.length,
        activeLeases: leases.filter((l: any) => l.status === 'ACTIVE').length,
        pendingRentAmount: Number(paymentData.stats?.totalDue || 0),
        maintenanceRequests: requests.filter((r: any) => ['OPEN', 'IN_PROGRESS'].includes(r.status)).length,
        rentCollected: Number(paymentData.stats?.totalPaid || 0),
        screeningRequests: screenings.filter((x: any) => x.status === 'PENDING').length,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Landlord Dashboard</h1>
          <p className="text-indigo-100 mt-1">
            Manage your properties, tenants, and finances
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-600">Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-600">Active Leases</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeLeases}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-600">Pending Rent</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingRentAmount)}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">{stats.maintenanceRequests}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-600">Screenings</p>
              <p className="text-2xl font-bold text-purple-600">{stats.screeningRequests}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-sm text-gray-600">Rent Collected</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.rentCollected)}</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
            { id: 'payments', label: 'Payments', icon: '💰' },
            { id: 'leases', label: 'Leases', icon: '📄' },
            { id: 'expenses', label: 'Expenses', icon: '📈' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Maintenance Requests */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Recent Maintenance Requests</h3>
                <Link href="/landlord/maintenance" className="text-sm text-indigo-600 hover:text-indigo-700">
                  View all →
                </Link>
              </div>
              <div className="divide-y">
                {maintenanceRequests.length > 0 ? (
                  maintenanceRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{request.title}</p>
                          <p className="text-sm text-gray-600">{request.property.title}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-500">No pending maintenance requests</p>
                )}
              </div>
            </div>

            {/* Upcoming Payments */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Upcoming Rent Payments</h3>
                <Link href="/landlord/payments" className="text-sm text-indigo-600 hover:text-indigo-700">
                  View all →
                </Link>
              </div>
              <div className="divide-y">
                {upcomingPayments.length > 0 ? (
                  upcomingPayments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{payment.tenant.name}</p>
                          <p className="text-sm text-gray-600">{payment.property.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-500">No upcoming payments</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/properties/new"
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <span className="text-xl">➕</span>
                  <span className="font-medium">Add Property</span>
                </Link>
                <Link
                  href="/landlord/screening"
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <span className="text-xl">🔍</span>
                  <span className="font-medium">Screen Tenant</span>
                </Link>
                <Link
                  href="/landlord/leases"
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <span className="text-xl">📝</span>
                  <span className="font-medium">Create Lease</span>
                </Link>
                <Link
                  href="/landlord/expenses"
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <span className="text-xl">📊</span>
                  <span className="font-medium">Track Expenses</span>
                </Link>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Landlord Resources</h3>
              <div className="space-y-2">
                <Link
                  href="/guides?category=landlord"
                  className="block text-sm text-indigo-600 hover:text-indigo-700"
                >
                  📚 Landlord Guide
                </Link>
                <Link
                  href="/landlord/leases"
                  className="block text-sm text-indigo-600 hover:text-indigo-700"
                >
                  📄 Lease Templates
                </Link>
                <Link
                  href="/market"
                  className="block text-sm text-indigo-600 hover:text-indigo-700"
                >
                  📈 Market Trends
                </Link>
                <Link
                  href="/services"
                  className="block text-sm text-indigo-600 hover:text-indigo-700"
                >
                  🔧 Service Providers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
