'use client';

import React, { useState, useEffect } from 'react';

interface ViewingSlot {
  id: string;
  propertyId: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface ViewingSchedulerProps {
  propertyId: string;
  propertyTitle: string;
  className?: string;
}

export default function ViewingScheduler({
  propertyId,
  propertyTitle,
  className = '',
}: ViewingSchedulerProps) {
  const [slots, setSlots] = useState<ViewingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [propertyId]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/viewings?propertyId=${propertyId}`);
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
        
        // Set initial selected date
        const dates = [...new Set(data.slots?.map((s: ViewingSlot) => s.date) || [])];
        if (dates.length > 0) {
          setSelectedDate(dates[0] as string);
        }
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const bookViewing = async () => {
    if (!selectedSlot) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot,
          propertyId,
          ...bookingData,
        }),
      });

      if (response.ok) {
        setBooked(true);
      }
    } catch (error) {
      console.error('Failed to book viewing:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get unique dates
  const dates = [...new Set(slots.map((s) => s.date))].sort();
  
  // Get slots for selected date
  const dateSlots = slots.filter((s) => s.date === selectedDate);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-16 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (booked) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl mb-4">
            ✓
          </div>
          <h3 className="text-xl font-bold text-gray-900">Viewing Booked!</h3>
          <p className="text-gray-600 mt-2">
            You'll receive a confirmation email shortly with the viewing details.
          </p>
          <button
            onClick={() => {
              setBooked(false);
              setSelectedSlot(null);
              fetchSlots();
            }}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Book Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="p-6 border-b bg-blue-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Schedule a Viewing
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Select a time to visit {propertyTitle}
        </p>
      </div>

      {dates.length > 0 ? (
        <div className="p-6">
          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dates.map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                    selectedDate === date
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {formatDate(date)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              {dateSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  disabled={!slot.available}
                  className={`py-3 rounded-lg text-sm font-medium transition ${
                    selectedSlot === slot.id
                      ? 'bg-blue-600 text-white'
                      : slot.available
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                  }`}
                >
                  {formatTime(slot.startTime)}
                </button>
              ))}
            </div>
            {dateSlots.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No available slots for this date
              </p>
            )}
          </div>

          {/* Contact Form */}
          {selectedSlot && (
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-medium text-gray-900">Your Details</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={bookingData.name}
                    onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={bookingData.email}
                  onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  rows={2}
                  placeholder="Any questions or special requirements?"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={bookViewing}
                disabled={submitting || !bookingData.name || !bookingData.email || !bookingData.phone}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Booking...' : 'Confirm Viewing'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="text-gray-500">No viewing slots available</p>
          <p className="text-sm text-gray-400 mt-1">
            Contact the agent to arrange a viewing
          </p>
        </div>
      )}
    </div>
  );
}
