"use client";
import React, { useEffect, useState } from 'react';
import { useRealtime } from '../realtime/RealtimeProvider';
import axios from 'axios';

type Props = {
  request?: any | null;
  onClose?: () => void;
  onAccepted?: () => void;
};

export default function DriverRequestModal({ request: propRequest, onClose, onAccepted }: Props) {
  const rt = useRealtime();
  const [internalRequest, setInternalRequest] = useState<any | null>(null);
  const [accepting, setAccepting] = useState(false);
  const request = propRequest ?? internalRequest;

  useEffect(() => {
    // only subscribe to realtime if no propRequest is provided
    if (propRequest) return;
    const channel = `driver:${(window as any).__DENUEL_USER_ID || 'guest'}`;
    rt.join(channel);
    const onMessage = (ev: any) => {
      try {
        const d = JSON.parse(ev?.data || '{}');
        if (d.event === 'transport_request') setInternalRequest(d.data);
      } catch (e) {
        // ignore malformed messages
        console.warn('Invalid message payload', e);
      }
    };
    (window as any).addEventListener('message', onMessage);
    return () => {
      (window as any).removeEventListener('message', onMessage);
      try { rt.leave(channel); } catch (e) { /* ignore */ }
    };
  }, [rt, propRequest]);

  async function accept() {
    if (!request || accepting) return;
    setAccepting(true);
    try {
      await axios.post(`/api/driver/requests/${request.requestId || request.id}/accept`);
      onAccepted?.();
      if (!propRequest) setInternalRequest(null);
    } catch (e) {
      console.error('Accept failed', e);
    } finally {
      setAccepting(false);
    }
  }

  function decline() {
    onClose?.();
    if (!propRequest) setInternalRequest(null);
  }

  if (!request) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={decline} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">New Transport Request</h3>
                <p className="text-blue-100 text-sm">A customer needs your help!</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Price */}
            <div className="text-center py-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-600 font-medium">Estimated Fare</p>
              <p className="text-4xl font-bold text-green-700">K{request.priceEstimateZmw || request.lockedPriceZmw}</p>
            </div>

            {/* Route */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Pickup</p>
                  <p className="font-medium text-gray-900">{request.pickupAddressText || `${request.pickupLat}, ${request.pickupLng}`}</p>
                </div>
              </div>
              
              <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4"></div>
              
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Dropoff</p>
                  <p className="font-medium text-gray-900">{request.dropoffAddressText || `${request.dropoffLat}, ${request.dropoffLng}`}</p>
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="flex justify-between py-3 border-t border-b">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{request.distanceKmEstimated?.toFixed(1) || '?'}</p>
                <p className="text-xs text-gray-500">km</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{request.durationMinEstimated || '?'}</p>
                <p className="text-xs text-gray-500">min</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 capitalize">{request.vehicleType?.toLowerCase() || '-'}</p>
                <p className="text-xs text-gray-500">vehicle</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <button 
              onClick={decline}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Decline
            </button>
            <button 
              onClick={accept}
              disabled={accepting}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {accepting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Accepting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
