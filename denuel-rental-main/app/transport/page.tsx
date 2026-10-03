'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Link from 'next/link';

interface Driver {
  id: string;
  user: { name: string; image?: string };
  vehicleType: string;
  vehiclePlate: string;
  rating: number;
  totalTrips: number;
  isOnline: boolean;
}

export default function TransportPage() {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimate, setEstimate] = useState<{ price: number; duration: string; distance: string } | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [activeTab, setActiveTab] = useState<'book' | 'moving' | 'deliveries'>('book');

  const vehicleTypes = [
    { id: 'car', name: 'Standard Car', icon: '🚗', description: 'Comfortable sedan for 4 passengers', basePrice: 50 },
    { id: 'suv', name: 'SUV', icon: '🚙', description: 'Spacious SUV for 6 passengers', basePrice: 80 },
    { id: 'van', name: 'Mini Van', icon: '🚐', description: 'Van for groups up to 12', basePrice: 120 },
    { id: 'truck', name: 'Pickup Truck', icon: '🛻', description: 'For moving small items', basePrice: 150 },
    { id: 'moving', name: 'Moving Truck', icon: '🚚', description: 'Full-size moving truck', basePrice: 300 },
  ];

  const getEstimate = async () => {
    if (!pickupAddress || !dropoffAddress) return;
    setEstimating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const basePrice = vehicleTypes.find(v => v.id === vehicleType)?.basePrice || 50;
    const randomMultiplier = 1 + Math.random() * 0.5;
    const price = Math.round(basePrice * randomMultiplier);
    
    setEstimate({
      price,
      duration: `${15 + Math.floor(Math.random() * 30)} mins`,
      distance: `${5 + Math.floor(Math.random() * 20)} km`
    });
    setEstimating(false);
  };

  const handleBooking = async () => {
    setBooking(true);
    
    try {
      const res = await fetch('/api/transport/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddressText: pickupAddress,
          dropoffAddressText: dropoffAddress,
          vehicleType,
          priceEstimateZmw: estimate?.price,
          scheduledAt: scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null,
        }),
      });

      if (res.ok) {
        setBookingSuccess(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Booking failed');
      }
    } catch (error) {
      alert('Failed to create booking');
    }
    
    setBooking(false);
  };

  if (bookingSuccess) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Booking Confirmed!</h1>
            <p className="text-gray-600 mb-8">Your transport request has been submitted. A driver will accept your request shortly.</p>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pickup:</span>
                  <span className="font-medium">{pickupAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dropoff:</span>
                  <span className="font-medium">{dropoffAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Price:</span>
                  <span className="font-bold text-blue-600">K{estimate?.price}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors"
              >
                Track Your Ride
              </Link>
              <button
                onClick={() => {
                  setBookingSuccess(false);
                  setEstimate(null);
                  setPickupAddress('');
                  setDropoffAddress('');
                }}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Book Another
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Transport & Moving Services</h1>
          <p className="text-xl text-purple-100 mb-6">Book rides, moving trucks, and delivery services across Zambia</p>
          
          {/* Service Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('book')}
              className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                activeTab === 'book' ? 'bg-white text-purple-700' : 'bg-purple-500 text-white hover:bg-purple-400'
              }`}
            >
              🚗 Book a Ride
            </button>
            <button
              onClick={() => setActiveTab('moving')}
              className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                activeTab === 'moving' ? 'bg-white text-purple-700' : 'bg-purple-500 text-white hover:bg-purple-400'
              }`}
            >
              🚚 Moving Services
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                activeTab === 'deliveries' ? 'bg-white text-purple-700' : 'bg-purple-500 text-white hover:bg-purple-400'
              }`}
            >
              📦 Deliveries
            </button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {activeTab === 'book' && 'Book a Ride'}
                {activeTab === 'moving' && 'Book Moving Services'}
                {activeTab === 'deliveries' && 'Schedule a Delivery'}
              </h2>

              <div className="space-y-6">
                {/* Pickup Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500">📍</span>
                    <input
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="Enter pickup address..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Dropoff Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dropoff Location</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500">📍</span>
                    <input
                      type="text"
                      value={dropoffAddress}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                      placeholder="Enter dropoff address..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Vehicle Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {vehicleTypes
                      .filter(v => {
                        if (activeTab === 'book') return ['car', 'suv', 'van'].includes(v.id);
                        if (activeTab === 'moving') return ['truck', 'moving', 'van'].includes(v.id);
                        return true;
                      })
                      .map((vehicle) => (
                        <button
                          key={vehicle.id}
                          onClick={() => setVehicleType(vehicle.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-colors ${
                            vehicleType === vehicle.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-200'
                          }`}
                        >
                          <div className="text-2xl mb-2">{vehicle.icon}</div>
                          <div className="font-semibold text-gray-900">{vehicle.name}</div>
                          <div className="text-sm text-gray-500">{vehicle.description}</div>
                          <div className="text-sm font-medium text-purple-600 mt-2">From K{vehicle.basePrice}</div>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Schedule (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule for Later (Optional)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Get Estimate Button */}
                <button
                  onClick={getEstimate}
                  disabled={!pickupAddress || !dropoffAddress || estimating}
                  className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {estimating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Calculating...
                    </span>
                  ) : (
                    'Get Price Estimate'
                  )}
                </button>

                {/* Price Estimate */}
                {estimate && (
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Trip Estimate</h3>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">K{estimate.price}</div>
                        <div className="text-sm text-gray-600">Estimated Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{estimate.duration}</div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">{estimate.distance}</div>
                        <div className="text-sm text-gray-600">Distance</div>
                      </div>
                    </div>
                    <button
                      onClick={handleBooking}
                      disabled={booking}
                      className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {booking ? 'Booking...' : 'Confirm Booking'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">1</span>
                  </div>
                  <h4 className="font-semibold mb-1">Enter Location</h4>
                  <p className="text-sm text-gray-600">Tell us where you're going</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">2</span>
                  </div>
                  <h4 className="font-semibold mb-1">Choose Vehicle</h4>
                  <p className="text-sm text-gray-600">Select the right vehicle</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">3</span>
                  </div>
                  <h4 className="font-semibold mb-1">Get Matched</h4>
                  <p className="text-sm text-gray-600">Driver accepts your request</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">4</span>
                  </div>
                  <h4 className="font-semibold mb-1">Enjoy Your Ride</h4>
                  <p className="text-sm text-gray-600">Track and pay securely</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Become a Driver CTA */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Become a Driver</h3>
              <p className="text-yellow-100 mb-4">Earn money driving with Denuel. Flexible hours, weekly payouts.</p>
              <Link
                href="/driver/apply"
                className="block w-full bg-white text-orange-600 text-center py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors"
              >
                Apply Now
              </Link>
            </div>

            {/* Safety Features */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Safety First</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700">Verified drivers</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700">Real-time tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700">24/7 support</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700">Secure payments</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
                  <span className="text-gray-700">Trip insurance</span>
                </li>
              </ul>
            </div>

            {/* Recent Trips */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Popular Routes</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="font-medium">Lusaka → Kitwe</div>
                  <div className="text-sm text-gray-600">From K450</div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="font-medium">Lusaka → Livingstone</div>
                  <div className="text-sm text-gray-600">From K500</div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="font-medium">Lusaka City Rides</div>
                  <div className="text-sm text-gray-600">From K50</div>
                </button>
              </div>
            </div>

            {/* Contact Support */}
            <div className="bg-gray-900 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-2">Need Help?</h3>
              <p className="text-gray-400 text-sm mb-4">Our support team is available 24/7</p>
              <a
                href="tel:+260123456789"
                className="block w-full bg-white text-gray-900 text-center py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Call Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
