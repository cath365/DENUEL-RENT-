'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';

interface Payment {
  id: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
  payer: {
    id: string;
    name: string;
    email: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
  };
  property?: {
    id: string;
    title: string;
  };
  stripePaymentId?: string;
}

interface PaymentStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  pendingPayouts: number;
  completedPayments: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setStats(data.stats || {
          totalRevenue: 2547000,
          thisMonthRevenue: 287500,
          pendingPayouts: 45600,
          completedPayments: 4521,
        });
      } else {
        // Mock data for demo
        setPayments([
          {
            id: '1',
            amount: 3500,
            status: 'COMPLETED',
            type: 'RENT',
            createdAt: new Date().toISOString(),
            payer: { id: '1', name: 'John Mwamba', email: 'john@example.com' },
            recipient: { id: '2', name: 'Mary Phiri', email: 'mary@example.com' },
            property: { id: '1', title: '2 Bedroom Apartment in Kabulonga' },
            stripePaymentId: 'pi_123456789',
          },
          {
            id: '2',
            amount: 2800,
            status: 'PENDING',
            type: 'RENT',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            payer: { id: '3', name: 'Peter Zulu', email: 'peter@example.com' },
            recipient: { id: '4', name: 'Grace Banda', email: 'grace@example.com' },
            property: { id: '2', title: 'Studio in Woodlands' },
          },
          {
            id: '3',
            amount: 5000,
            status: 'COMPLETED',
            type: 'DEPOSIT',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            payer: { id: '5', name: 'Sarah Tembo', email: 'sarah@example.com' },
            recipient: { id: '6', name: 'David Mulenga', email: 'david@example.com' },
            property: { id: '3', title: '3 Bedroom House in Roma' },
            stripePaymentId: 'pi_987654321',
          },
        ]);
        setStats({
          totalRevenue: 2547000,
          thisMonthRevenue: 287500,
          pendingPayouts: 45600,
          completedPayments: 4521,
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
    setLoading(false);
  };

  const handleRefund = async (paymentId: string) => {
    if (!confirm('Are you sure you want to refund this payment?')) return;
    
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchPayments();
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error('Error refunding payment:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'COMPLETED': 'bg-green-100 text-green-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'FAILED': 'bg-red-100 text-red-800',
      'REFUNDED': 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'RENT': 'bg-blue-100 text-blue-800',
      'DEPOSIT': 'bg-purple-100 text-purple-800',
      'SERVICE_FEE': 'bg-orange-100 text-orange-800',
      'TRANSPORT': 'bg-teal-100 text-teal-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return `K ${amount.toLocaleString()}`;
  };

  const filteredPayments = payments.filter(payment =>
    payment.payer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.payer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.property?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.id.includes(searchQuery)
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/admin" className="hover:text-blue-600">Admin</Link>
          <span>/</span>
          <span className="text-gray-900">Payments</span>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all platform payments</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.thisMonthRevenue)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-600">Pending Payouts</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingPayouts)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-600">Completed Payments</p>
              <p className="text-2xl font-bold text-blue-600">{stats.completedPayments.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'completed', label: 'Completed' },
              { id: 'pending', label: 'Pending' },
              { id: 'failed', label: 'Failed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-600">No payments match your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payments List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          onClick={() => setSelectedPayment(payment)}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedPayment?.id === payment.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{payment.payer.name}</p>
                              <p className="text-sm text-gray-500">→ {payment.recipient.name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(payment.type)}`}>
                              {payment.type}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payment Detail Panel */}
            {selectedPayment ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24 h-fit">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>

                <div className="space-y-4">
                  {/* Amount */}
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</p>
                    <div className="flex justify-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(selectedPayment.type)}`}>
                        {selectedPayment.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedPayment.status)}`}>
                        {selectedPayment.status}
                      </span>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="space-y-3">
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">FROM</p>
                      <p className="font-medium">{selectedPayment.payer.name}</p>
                      <p className="text-sm text-gray-500">{selectedPayment.payer.email}</p>
                    </div>
                    <div className="flex justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">TO</p>
                      <p className="font-medium">{selectedPayment.recipient.name}</p>
                      <p className="text-sm text-gray-500">{selectedPayment.recipient.email}</p>
                    </div>
                  </div>

                  {/* Property */}
                  {selectedPayment.property && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Property</p>
                      <Link
                        href={`/property/${selectedPayment.property.id}`}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                      >
                        {selectedPayment.property.title}
                      </Link>
                    </div>
                  )}

                  {/* Transaction Info */}
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment ID</span>
                      <span className="font-mono text-gray-900">{selectedPayment.id.slice(0, 8)}...</span>
                    </div>
                    {selectedPayment.stripePaymentId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Stripe ID</span>
                        <span className="font-mono text-gray-900">{selectedPayment.stripePaymentId}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Date</span>
                      <span className="text-gray-900">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedPayment.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleRefund(selectedPayment.id)}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      Issue Refund
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-12 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Select a payment to view details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
