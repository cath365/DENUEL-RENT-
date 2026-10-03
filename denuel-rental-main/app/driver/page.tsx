"use client";
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DriverRequestModal from '../../components/driver/DriverRequestModal';
import DriverNotifications from '../../components/driver/DriverNotifications';
import LocationTracker from '../../components/driver/LocationTracker';
import Header from '../../components/Header';

// Icons
const TruckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4 9V3m-6 6h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
  </svg>
);

const DollarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`w-5 h-5 ${filled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function DriverDashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<'overview' | 'requests' | 'history' | 'earnings' | 'ratings'>('overview');
  const router = useRouter();

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const me = await axios.get('/api/auth/me');
      if (!me.data?.user) return router.push('/auth/login');
      
      // Fetch driver profile
      const p = await axios.get('/api/driver/profile');
      setProfile(p.data.profile);
      
      if (!p.data.profile) return setLoading(false);
      
      setIsOnline(p.data.profile.isOnline);
      
      // Fetch all data in parallel
      const [requestsRes, historyRes, earningsRes, ratingsRes, activeTripRes] = await Promise.all([
        axios.get('/api/driver/requests').catch(() => ({ data: [] })),
        axios.get('/api/driver/trips/history').catch(() => ({ data: [] })),
        axios.get('/api/driver/earnings').catch(() => ({ data: null })),
        axios.get('/api/driver/ratings').catch(() => ({ data: [] })),
        axios.get('/api/driver/trips/active').catch(() => ({ data: null })),
      ]);
      
      setRequests(requestsRes.data || []);
      setHistory(historyRes.data || []);
      setEarnings(earningsRes.data);
      setRatings(ratingsRes.data || []);
      setActiveTrip(activeTripRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle online status
  const toggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await axios.post('/api/driver/online', { isOnline: newStatus });
      setIsOnline(newStatus);
      setProfile({ ...profile, isOnline: newStatus });
      
      if (newStatus) {
        startLocationTracking();
      } else {
        stopLocationTracking();
      }
    } catch (e) {
      console.error('Failed to toggle online status', e);
    }
  };

  // Location tracking
  const startLocationTracking = () => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await axios.post('/api/driver/location', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        } catch (e) {
          console.error('Failed to update location', e);
        }
      },
      (error) => console.error('Geolocation error', error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    setLocationWatchId(watchId);
  };

  const stopLocationTracking = () => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
  };

  // Update trip status
  const updateTripStatus = async (tripId: string, status: string) => {
    try {
      await axios.post(`/api/driver/trips/${tripId}/status`, { status });
      loadData();
    } catch (e) {
      console.error('Failed to update trip status', e);
    }
  };

  // Calculate stats
  const todayEarnings = earnings?.today || 0;
  const weekEarnings = earnings?.week || 0;
  const monthEarnings = earnings?.month || 0;
  const totalTrips = history.length;
  const completedTrips = history.filter(t => t.status === 'COMPLETED').length;
  const avgRating = profile?.ratingAvg || 0;

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TruckIcon />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Become a Driver</h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Join our network of professional drivers and start earning money by helping people move. 
                Complete a short application and get approved to start receiving transport requests.
              </p>
              <div className="space-y-4">
                <Link 
                  href="/driver/apply" 
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Apply to be a Driver
                </Link>
                <p className="text-sm text-gray-500">
                  Already applied? Your application is being reviewed.
                </p>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Handle location updates
  const handleLocationUpdate = async (location: any) => {
    try {
      await axios.post('/api/driver/location', {
        lat: location.latitude,
        lng: location.longitude,
        speed: location.speed,
        heading: location.heading,
      });
    } catch (e) {
      console.error('Failed to send location update', e);
    }
  };

  return (
    <>
      <Header />
      {/* Push Notifications Handler */}
      <DriverNotifications enabled={isOnline} onNewRequest={() => loadData()} />
      
      <main className="min-h-screen bg-gray-50">
        {/* Top Bar with Online Toggle */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">
                    {profile.user?.name?.charAt(0) || 'D'}
                  </span>
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">{profile.user?.name || 'Driver'}</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <StarIcon key={i} filled={i <= Math.round(avgRating)} />
                      ))}
                      <span className="ml-1">{avgRating.toFixed(1)}</span>
                    </span>
                    <span>•</span>
                    <span>{profile.vehicleType}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {!profile.isApproved && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                    Pending Approval
                  </span>
                )}
                <button
                  onClick={toggleOnline}
                  disabled={!profile.isApproved}
                  className={`relative inline-flex h-10 w-24 items-center rounded-full transition-colors ${
                    isOnline ? 'bg-green-500' : 'bg-gray-300'
                  } ${!profile.isApproved ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform ${
                    isOnline ? 'translate-x-14' : 'translate-x-1'
                  }`} />
                  <span className={`absolute text-xs font-semibold ${isOnline ? 'left-2 text-white' : 'right-2 text-gray-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Trip Banner */}
        {activeTrip && (
          <div className="bg-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <TruckIcon />
                  </div>
                  <div>
                    <p className="font-semibold">Active Trip</p>
                    <p className="text-sm text-blue-100">
                      {activeTrip.pickupAddressText} → {activeTrip.dropoffAddressText}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                    {activeTrip.status}
                  </span>
                  {activeTrip.status === 'DRIVER_ASSIGNED' && (
                    <button
                      onClick={() => updateTripStatus(activeTrip.id, 'DRIVER_ARRIVING')}
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
                    >
                      On My Way
                    </button>
                  )}
                  {activeTrip.status === 'DRIVER_ARRIVING' && (
                    <button
                      onClick={() => updateTripStatus(activeTrip.id, 'IN_PROGRESS')}
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
                    >
                      Start Trip
                    </button>
                  )}
                  {activeTrip.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => updateTripStatus(activeTrip.id, 'COMPLETED')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                    >
                      Complete Trip
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex gap-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'requests', label: 'Requests', count: requests.length },
                { id: 'history', label: 'History' },
                { id: 'earnings', label: 'Earnings' },
                { id: 'ratings', label: 'Ratings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                    currentTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Overview Tab */}
          {currentTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Today&apos;s Earnings</p>
                      <p className="text-2xl font-bold text-gray-900">K{todayEarnings.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarIcon />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">This Week</p>
                      <p className="text-2xl font-bold text-gray-900">K{weekEarnings.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarIcon />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Completed Trips</p>
                      <p className="text-2xl font-bold text-gray-900">{completedTrips}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircleIcon />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                        <StarIcon filled={true} />
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 text-xl">★</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Available Requests */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b">
                    <h2 className="font-semibold text-gray-900">Available Requests</h2>
                  </div>
                  <div className="p-6">
                    {requests.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TruckIcon />
                        </div>
                        <p className="text-gray-500">No requests available</p>
                        <p className="text-sm text-gray-400 mt-1">Stay online to receive new requests</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {requests.slice(0, 3).map((req) => (
                          <div key={req.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <LocationIcon />
                                  <span>{req.distanceKmEstimated?.toFixed(1) || '?'} km</span>
                                  <span>•</span>
                                  <ClockIcon />
                                  <span>{req.durationMinEstimated || '?'} min</span>
                                </div>
                                <p className="font-medium text-gray-900">{req.pickupAddressText}</p>
                                <p className="text-gray-600">→ {req.dropoffAddressText}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-600">K{req.priceEstimateZmw}</p>
                                <button
                                  onClick={() => setShowModal(req)}
                                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                >
                                  Accept
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {requests.length > 3 && (
                          <button
                            onClick={() => setCurrentTab('requests')}
                            className="w-full text-center text-blue-600 font-medium hover:underline"
                          >
                            View all {requests.length} requests
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="p-6 border-b">
                    <h2 className="font-semibold text-gray-900">Your Profile</h2>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="text-center pb-4 border-b">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl font-bold text-blue-600">
                          {profile.user?.name?.charAt(0) || 'D'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{profile.user?.name}</h3>
                      <p className="text-sm text-gray-500">{profile.user?.email}</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">License</span>
                        <span className="font-medium">{profile.licenseNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Vehicle</span>
                        <span className="font-medium">{profile.vehicleType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Plate</span>
                        <span className="font-medium">{profile.vehiclePlate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Trips</span>
                        <span className="font-medium">{totalTrips}</span>
                      </div>
                    </div>
                    
                    <Link
                      href="/driver/apply"
                      className="block w-full text-center py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 mt-4"
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>

                {/* Location Tracker Card */}
                {isOnline && (
                  <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-700">
                      <h2 className="font-semibold text-white">📍 Live Location</h2>
                    </div>
                    <LocationTracker 
                      enabled={isOnline} 
                      onLocationUpdate={handleLocationUpdate}
                      updateInterval={5000}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {currentTab === 'requests' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <h2 className="font-semibold text-gray-900">Available Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Accept requests to start earning</p>
              </div>
              <div className="p-6">
                {requests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TruckIcon />
                    </div>
                    <p className="text-gray-500 font-medium">No requests available</p>
                    <p className="text-sm text-gray-400 mt-1">New requests will appear here when available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((req) => (
                      <div key={req.id} className="p-6 border rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                                {req.vehicleType}
                              </span>
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <LocationIcon />
                                {req.distanceKmEstimated?.toFixed(1)} km
                              </span>
                              <span className="flex items-center gap-1 text-sm text-gray-600">
                                <ClockIcon />
                                ~{req.durationMinEstimated} min
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                                <div>
                                  <p className="text-sm text-gray-500">Pickup</p>
                                  <p className="font-medium">{req.pickupAddressText}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                                <div>
                                  <p className="text-sm text-gray-500">Dropoff</p>
                                  <p className="font-medium">{req.dropoffAddressText}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">K{req.priceEstimateZmw}</p>
                            <p className="text-sm text-gray-500 mb-3">Estimated fare</p>
                            <button
                              onClick={() => setShowModal(req)}
                              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                              Accept Request
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {currentTab === 'history' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b">
                <h2 className="font-semibold text-gray-900">Trip History</h2>
                <p className="text-sm text-gray-500 mt-1">{history.length} total trips</p>
              </div>
              <div className="divide-y">
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClockIcon />
                    </div>
                    <p className="text-gray-500 font-medium">No trip history</p>
                    <p className="text-sm text-gray-400 mt-1">Complete trips to see them here</p>
                  </div>
                ) : (
                  history.map((trip) => (
                    <div key={trip.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              trip.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-700' 
                                : trip.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {trip.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(trip.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">{trip.pickupAddressText}</p>
                          <p className="text-gray-600">→ {trip.dropoffAddressText}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {trip.distanceKmEstimated?.toFixed(1)} km • {trip.durationMinEstimated} min
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            K{trip.lockedPriceZmw || trip.priceEstimateZmw}
                          </p>
                          {trip.Rating && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                              {[1,2,3,4,5].map(i => (
                                <StarIcon key={i} filled={i <= trip.Rating.stars} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Earnings Tab */}
          {currentTab === 'earnings' && (
            <div className="space-y-6">
              {/* Earnings Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <p className="text-green-100">Today</p>
                  <p className="text-3xl font-bold mt-1">K{todayEarnings.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <p className="text-blue-100">This Week</p>
                  <p className="text-3xl font-bold mt-1">K{weekEarnings.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <p className="text-purple-100">This Month</p>
                  <p className="text-3xl font-bold mt-1">K{monthEarnings.toLocaleString()}</p>
                </div>
              </div>

              {/* Earnings List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b">
                  <h2 className="font-semibold text-gray-900">Earnings History</h2>
                </div>
                <div className="divide-y">
                  {earnings?.list?.length === 0 || !earnings?.list ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarIcon />
                      </div>
                      <p className="text-gray-500 font-medium">No earnings yet</p>
                      <p className="text-sm text-gray-400 mt-1">Complete trips to start earning</p>
                    </div>
                  ) : (
                    earnings.list.map((earning: any) => (
                      <div key={earning.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Trip Completed</p>
                            <p className="text-sm text-gray-500">
                              {new Date(earning.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+K{earning.netZmw}</p>
                            <p className="text-xs text-gray-500">
                              Gross: K{earning.grossZmw} | Fee: K{earning.platformFeeZmw}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Ratings Tab */}
          {currentTab === 'ratings' && (
            <div className="space-y-6">
              {/* Rating Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {[1,2,3,4,5].map(i => (
                        <StarIcon key={i} filled={i <= Math.round(avgRating)} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{profile.ratingCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5,4,3,2,1].map(stars => {
                      const count = ratings.filter(r => r.stars === stars).length;
                      const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-3">{stars}</span>
                          <StarIcon filled={true} />
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b">
                  <h2 className="font-semibold text-gray-900">Customer Reviews</h2>
                </div>
                <div className="divide-y">
                  {ratings.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">⭐</span>
                      </div>
                      <p className="text-gray-500 font-medium">No reviews yet</p>
                      <p className="text-sm text-gray-400 mt-1">Complete trips to receive reviews</p>
                    </div>
                  ) : (
                    ratings.map((rating) => (
                      <div key={rating.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {rating.tenant?.name || 'Customer'}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {[1,2,3,4,5].map(i => (
                                  <StarIcon key={i} filled={i <= rating.stars} />
                                ))}
                              </div>
                            </div>
                            {rating.comment && (
                              <p className="text-gray-600">{rating.comment}</p>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Request Modal */}
        {showModal && (
          <DriverRequestModal 
            request={showModal} 
            onClose={() => setShowModal(null)} 
            onAccepted={() => { 
              setShowModal(null); 
              setRequests(requests.filter(r => r.id !== showModal.id));
              loadData();
            }} 
          />
        )}
      </main>
    </>
  );
}
