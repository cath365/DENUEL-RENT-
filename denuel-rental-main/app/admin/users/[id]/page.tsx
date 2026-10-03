'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
  image?: string;
  _count?: {
    properties: number;
    applications: number;
    bookings: number;
    favorites: number;
    inquiries: number;
  };
  properties?: Property[];
  bookings?: Booking[];
}

interface Property {
  id: string;
  title: string;
  price: number;
  status: string;
  listingType: string;
  createdAt: string;
}

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  property: {
    title: string;
  };
}

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('User not found');
        } else {
          throw new Error('Failed to fetch user');
        }
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (newRole: string) => {
    if (!user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUser({ ...user, role: newRole });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
    setUpdating(false);
  };

  const toggleVerification = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/verify`, {
        method: 'POST',
      });
      if (res.ok) {
        setUser({ ...user, isVerified: !user.isVerified });
      }
    } catch (error) {
      console.error('Error toggling verification:', error);
    }
    setUpdating(false);
  };

  const deleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/admin/users');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
    setUpdating(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'LANDLORD': return 'bg-blue-100 text-blue-800';
      case 'AGENT': return 'bg-purple-100 text-purple-800';
      case 'DRIVER': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'User not found'}</p>
            <Link href="/admin/users" className="text-blue-600 hover:underline">
              ← Back to Users
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/admin" className="hover:text-blue-600">Admin</Link>
          <span>→</span>
          <Link href="/admin/users" className="hover:text-blue-600">Users</Link>
          <span>→</span>
          <span className="text-gray-900 font-medium">{user.name}</span>
        </div>

        {/* User Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  {user.isVerified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">✓ Verified</span>
                  )}
                </div>
                <p className="text-gray-600">{user.email}</p>
                {user.phone && <p className="text-gray-500 text-sm">{user.phone}</p>}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
              <select
                value={user.role}
                onChange={(e) => updateUserRole(e.target.value)}
                disabled={updating}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="USER">User</option>
                <option value="LANDLORD">Landlord</option>
                <option value="AGENT">Agent</option>
                <option value="DRIVER">Driver</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                onClick={toggleVerification}
                disabled={updating}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  user.isVerified
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {user.isVerified ? 'Unverify' : 'Verify'}
              </button>
              <button
                onClick={deleteUser}
                disabled={updating}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-600">Properties</p>
            <p className="text-2xl font-bold text-gray-900">{user._count?.properties || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-600">Applications</p>
            <p className="text-2xl font-bold text-gray-900">{user._count?.applications || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-600">Bookings</p>
            <p className="text-2xl font-bold text-gray-900">{user._count?.bookings || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-600">Favorites</p>
            <p className="text-2xl font-bold text-gray-900">{user._count?.favorites || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-600">Inquiries</p>
            <p className="text-2xl font-bold text-gray-900">{user._count?.inquiries || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {['overview', 'properties', 'bookings', 'activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-mono text-sm text-gray-900">{user.id}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="text-gray-900">{user.role}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Joined</p>
                      <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="text-gray-900">{new Date(user.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'properties' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Properties</h3>
                {user.properties && user.properties.length > 0 ? (
                  <div className="space-y-3">
                    {user.properties.map((property) => (
                      <Link
                        key={property.id}
                        href={`/property/${property.id}`}
                        className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{property.title}</p>
                            <p className="text-sm text-gray-600">
                              {property.listingType} • K{property.price.toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            property.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            property.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {property.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No properties found</p>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Bookings</h3>
                {user.bookings && user.bookings.length > 0 ? (
                  <div className="space-y-3">
                    {user.bookings.map((booking) => (
                      <div key={booking.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{booking.property.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No bookings found</p>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <p className="text-gray-500 text-center py-8">Activity log coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
