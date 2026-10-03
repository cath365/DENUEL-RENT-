'use client';

import React, { useState, useEffect } from 'react';

interface OpenHouse {
  id: string;
  propertyId: string;
  startTime: string;
  endTime: string;
  instructions?: string;
  maxAttendees?: number;
  currentRSVPs: number;
  property: {
    title: string;
    address: string;
    city: string;
    images: Array<{ url: string }>;
  };
  userRSVP?: {
    id: string;
    status: string;
  };
}

interface OpenHouseSchedulerProps {
  propertyId?: string;
  className?: string;
}

export default function OpenHouseScheduler({ propertyId, className = '' }: OpenHouseSchedulerProps) {
  const [openHouses, setOpenHouses] = useState<OpenHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRSVPModal, setShowRSVPModal] = useState<string | null>(null);
  const [rsvpData, setRsvpData] = useState({
    attendees: 1,
    phone: '',
    notes: '',
  });

  useEffect(() => {
    fetchOpenHouses();
  }, [propertyId]);

  const fetchOpenHouses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (propertyId) params.append('propertyId', propertyId);
      params.append('upcoming', 'true');

      const response = await fetch(`/api/open-houses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOpenHouses(data.openHouses || []);
      }
    } catch (error) {
      console.error('Failed to fetch open houses:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRSVP = async (openHouseId: string) => {
    try {
      const response = await fetch('/api/open-houses/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openHouseId,
          ...rsvpData,
        }),
      });

      if (response.ok) {
        setShowRSVPModal(null);
        setRsvpData({ attendees: 1, phone: '', notes: '' });
        fetchOpenHouses();
        alert('RSVP confirmed! You will receive a reminder before the open house.');
      }
    } catch (error) {
      console.error('Failed to RSVP:', error);
    }
  };

  const cancelRSVP = async (openHouseId: string) => {
    try {
      const response = await fetch('/api/open-houses/rsvp', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openHouseId }),
      });

      if (response.ok) {
        fetchOpenHouses();
      }
    } catch (error) {
      console.error('Failed to cancel RSVP:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (openHouses.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500">No upcoming open houses scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="p-6 border-b bg-orange-50">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          Open Houses
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Visit properties in person - no appointment needed
        </p>
      </div>

      <div className="divide-y">
        {openHouses.map((oh) => (
          <div key={oh.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{oh.property.title}</p>
                <p className="text-sm text-gray-600">{oh.property.address}, {oh.property.city}</p>
                
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-orange-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(oh.startTime)}
                  </span>
                  <span className="flex items-center gap-1 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(oh.startTime)} - {formatTime(oh.endTime)}
                  </span>
                </div>

                {oh.maxAttendees && (
                  <p className="text-xs text-gray-500 mt-1">
                    {oh.currentRSVPs} / {oh.maxAttendees} spots taken
                  </p>
                )}
              </div>

              <div>
                {oh.userRSVP ? (
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      ✓ You're going
                    </span>
                    <button
                      onClick={() => cancelRSVP(oh.id)}
                      className="block mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Cancel RSVP
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRSVPModal(oh.id)}
                    disabled={oh.maxAttendees ? oh.currentRSVPs >= oh.maxAttendees : false}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    RSVP
                  </button>
                )}
              </div>
            </div>

            {oh.instructions && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                📍 {oh.instructions}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* RSVP Modal */}
      {showRSVPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">RSVP for Open House</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Attendees
                </label>
                <select
                  value={rsvpData.attendees}
                  onChange={(e) => setRsvpData({ ...rsvpData, attendees: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={rsvpData.phone}
                  onChange={(e) => setRsvpData({ ...rsvpData, phone: e.target.value })}
                  placeholder="For reminders"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Questions or Notes
                </label>
                <textarea
                  value={rsvpData.notes}
                  onChange={(e) => setRsvpData({ ...rsvpData, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowRSVPModal(null)}
                className="flex-1 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => submitRSVP(showRSVPModal)}
                className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Confirm RSVP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
