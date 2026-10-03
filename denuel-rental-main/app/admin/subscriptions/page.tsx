'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import { csrfFetch } from '../../../lib/csrf';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  userSubscription: {
    plan: {
      id: string;
      name: string;
      price: number;
    };
    status: string;
    currentPeriodEnd: string;
  } | null;
  properties: Array<{ id: string; title: string; status: string }>;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function AdminSubscriptionsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [note, setNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, inactive

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, plansRes] = await Promise.all([
        csrfFetch('/api/admin/subscriptions'),
        fetch('/api/subscriptions/plans'),
      ]);

      const usersData = await usersRes.json();
      const plansData = await plansRes.json();

      setUsers(usersData.users || []);
      setPlans(plansData.plans || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSubscription = async () => {
    if (!selectedUser || !selectedPlan) return;

    try {
      const res = await csrfFetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          planId: selectedPlan,
          note,
        }),
      });

      const data = await res.json();
      alert(data.message);
      setShowModal(false);
      setNote('');
      fetchData();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const openModal = (user: User) => {
    setSelectedUser(user);
    setSelectedPlan(user.userSubscription?.plan.id || plans[0]?.id || '');
    setShowModal(true);
  };

  const filteredUsers = users.filter((user) => {
    if (filter === 'active') return user.userSubscription?.status === 'ACTIVE';
    if (filter === 'inactive') return !user.userSubscription || user.userSubscription.status !== 'ACTIVE';
    return true;
  });

  const activeCount = users.filter(u => u.userSubscription?.status === 'ACTIVE').length;
  const totalRevenue = users.reduce((sum, u) => sum + (u.userSubscription?.plan.price || 0), 0);

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
        <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-gray-600 text-sm mb-1">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-gray-600 text-sm mb-1">Active Subscriptions</p>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-gray-600 text-sm mb-1">Monthly Revenue</p>
            <p className="text-3xl font-bold text-blue-600">K{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <p className="text-gray-600 text-sm mb-1">Free Users</p>
            <p className="text-3xl font-bold text-purple-600">
              {users.filter(u => !u.userSubscription || u.userSubscription.plan.price === 0).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'inactive' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Inactive ({users.length - activeCount})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Contact</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Current Plan</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Properties</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Expires</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <a href={`tel:${user.phone}`} className="text-blue-600 hover:underline">
                        {user.phone}
                      </a>
                    </td>
                    <td className="py-4 px-4">
                      {user.userSubscription ? (
                        <div>
                          <p className="font-semibold">{user.userSubscription.plan.name}</p>
                          <p className="text-sm text-gray-500">K{user.userSubscription.plan.price}/month</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">No plan</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {user.userSubscription?.status === 'ACTIVE' ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold">{user.properties.length}</span>
                      <span className="text-gray-500 text-sm ml-1">listings</span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {user.userSubscription?.currentPeriodEnd
                        ? new Date(user.userSubscription.currentPeriodEnd).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => openModal(user)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activation Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold mb-6">Activate Subscription</h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">User:</p>
              <p className="font-semibold text-lg">{selectedUser.name}</p>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
              <p className="text-sm text-blue-600">{selectedUser.phone}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - K{plan.price}/month
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Airtel Money transaction ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleActivateSubscription}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-full font-semibold hover:from-green-700 hover:to-green-800"
              >
                ✓ Activate Subscription
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
