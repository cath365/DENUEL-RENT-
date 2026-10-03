"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import axios from 'axios';

interface Trip {
  id: string;
  status: string;
  pickupLocation: string;
  dropoffLocation: string;
  fare: number;
  distance: number;
  duration: number;
  createdAt: string;
  completedAt?: string;
  tenant: {
    name: string;
    phone?: string;
  };
  rating?: number;
}

export default function DriverHistoryPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, [filter]);

  const fetchTrips = async () => {
    try {
      const { data } = await axios.get(`/api/driver/trips?status=${filter}`);
      setTrips(data.trips || []);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      COMPLETED: { bg: 'bg-green-900/50', text: 'text-green-400', label: 'Completed' },
      CANCELED: { bg: 'bg-red-900/50', text: 'text-red-400', label: 'Cancelled' },
      IN_PROGRESS: { bg: 'bg-blue-900/50', text: 'text-blue-400', label: 'In Progress' },
      REQUESTED: { bg: 'bg-gray-900/50', text: 'text-gray-400', label: 'Requested' },
      SEARCHING: { bg: 'bg-yellow-900/50', text: 'text-yellow-400', label: 'Searching' },
      DRIVER_ASSIGNED: { bg: 'bg-blue-900/50', text: 'text-blue-400', label: 'Assigned' },
      DRIVER_ARRIVING: { bg: 'bg-purple-900/50', text: 'text-purple-400', label: 'Arriving' },
      EXPIRED: { bg: 'bg-gray-900/50', text: 'text-gray-400', label: 'Expired' },
    };
    const config = statusConfig[status] || { bg: 'bg-gray-900/50', text: 'text-gray-400', label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const renderStars = (rating: number | undefined) => {
    if (!rating) return <span className="text-gray-600 text-sm">Not rated</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Calculate stats
  const stats = {
    total: trips.length,
    completed: trips.filter(t => t.status === 'COMPLETED').length,
    cancelled: trips.filter(t => t.status === 'CANCELLED').length,
    totalEarnings: trips.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + t.fare, 0),
    avgRating: trips.filter(t => t.rating).reduce((sum, t, _, arr) => sum + (t.rating || 0) / arr.length, 0),
  };

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

        <h1 className="text-3xl font-bold mb-8">📋 Trip History</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-sm text-gray-400">Total Trips</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
                <p className="text-sm text-gray-400">Completed</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-red-400">{stats.cancelled}</p>
                <p className="text-sm text-gray-400">Cancelled</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">{formatCurrency(stats.totalEarnings)}</p>
                <p className="text-sm text-gray-400">Total Earnings</p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6">
              {(['all', 'completed', 'cancelled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                    filter === f
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Trips List */}
            <div className="space-y-4">
              {trips.length > 0 ? (
                trips.map((trip) => (
                  <div key={trip.id} className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(trip.status)}
                        <span className="text-lg font-bold text-green-400">
                          {formatCurrency(trip.fare)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(trip.createdAt)}</span>
                    </div>

                    {/* Route */}
                    <div className="flex gap-4 mb-3">
                      <div className="flex flex-col items-center py-1">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="w-0.5 h-8 bg-gray-600"></div>
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">{trip.pickupLocation}</p>
                        <div className="h-6"></div>
                        <p className="text-white truncate">{trip.dropoffLocation}</p>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {trip.distance} km
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDuration(trip.duration)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {trip.tenant.name}
                      </div>
                      <div className="ml-auto">
                        {renderStars(trip.rating)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-800 rounded-xl p-12 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No trips found</p>
                  <p className="text-sm mt-2">
                    {filter === 'all' 
                      ? 'Complete trips to see your history here'
                      : `No ${filter} trips to show`
                    }
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
