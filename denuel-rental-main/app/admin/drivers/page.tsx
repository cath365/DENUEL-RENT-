'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';

interface Driver {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  licenseNumber: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  plateNumber: string;
  status: string;
  rating: number;
  totalTrips: number;
  verified: boolean;
  createdAt: string;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, [filter]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const res = await fetch(`/api/admin/drivers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
    setLoading(false);
  };

  const handleAction = async (driverId: string, action: 'approve' | 'suspend' | 'activate') => {
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchDrivers();
        setSelectedDriver(null);
      }
    } catch (error) {
      console.error('Error processing driver:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'SUSPENDED': 'bg-red-100 text-red-800',
      'ACTIVE': 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/admin" className="hover:text-blue-600">Admin</Link>
          <span>/</span>
          <span className="text-gray-900">Drivers</span>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
            <p className="text-gray-600 mt-1">Manage and verify transport drivers</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search drivers by name, email, or plate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'suspended', label: 'Suspended' },
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
        ) : filteredDrivers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No drivers found</h3>
            <p className="text-gray-600">No drivers match your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Drivers List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredDrivers.map((driver) => (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={`bg-white rounded-xl shadow-sm border cursor-pointer transition-all ${
                    selectedDriver?.id === driver.id
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {driver.user.profileImage ? (
                          <img
                            src={driver.user.profileImage}
                            alt=""
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-xl font-bold text-blue-600">
                            {driver.user.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{driver.user.name}</h3>
                            <p className="text-sm text-gray-500">{driver.user.email}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(driver.status)}`}>
                            {driver.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            {driver.vehicleType}
                          </span>
                          <span>{driver.vehicleMake} {driver.vehicleModel}</span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{driver.plateNumber}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-yellow-600">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            {driver.rating?.toFixed(1) || 'N/A'}
                          </span>
                          <span className="text-gray-500">{driver.totalTrips || 0} trips</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Driver Detail Panel */}
            {selectedDriver ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24 h-fit">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Driver Details</h2>

                {/* Profile */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    {selectedDriver.user.profileImage ? (
                      <img
                        src={selectedDriver.user.profileImage}
                        alt=""
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-blue-600">
                        {selectedDriver.user.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedDriver.user.name}</h3>
                    <p className="text-gray-500">{selectedDriver.user.email}</p>
                    <p className="text-gray-500">{selectedDriver.user.phone}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedDriver.totalTrips || 0}</p>
                    <p className="text-xs text-gray-500">Trips</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{selectedDriver.rating?.toFixed(1) || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadge(selectedDriver.status)}`}>
                      {selectedDriver.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Status</p>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Vehicle Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type</span>
                      <span className="font-medium">{selectedDriver.vehicleType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make & Model</span>
                      <span className="font-medium">{selectedDriver.vehicleMake} {selectedDriver.vehicleModel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year</span>
                      <span className="font-medium">{selectedDriver.vehicleYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plate Number</span>
                      <span className="font-medium bg-yellow-100 px-2 py-0.5 rounded">{selectedDriver.plateNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">License Number</span>
                      <span className="font-medium">{selectedDriver.licenseNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="flex items-center gap-2 mb-6">
                  {selectedDriver.verified ? (
                    <>
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-green-600 font-medium">Verified Driver</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <span className="text-yellow-600 font-medium">Pending Verification</span>
                    </>
                  )}
                </div>

                {/* Registration Date */}
                <p className="text-sm text-gray-500 mb-6">
                  Registered: {new Date(selectedDriver.createdAt).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  {selectedDriver.status === 'PENDING' && (
                    <button
                      onClick={() => handleAction(selectedDriver.id, 'approve')}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Approve Driver
                    </button>
                  )}
                  {selectedDriver.status === 'APPROVED' && (
                    <button
                      onClick={() => handleAction(selectedDriver.id, 'suspend')}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      Suspend Driver
                    </button>
                  )}
                  {selectedDriver.status === 'SUSPENDED' && (
                    <button
                      onClick={() => handleAction(selectedDriver.id, 'activate')}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Reactivate Driver
                    </button>
                  )}
                  <button
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  >
                    View Trip History
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-12 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p>Select a driver to view details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
