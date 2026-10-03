'use client';

import React, { useState } from 'react';

interface PriceAlertButtonProps {
  propertyId: string;
  currentPrice: number;
  propertyTitle: string;
  className?: string;
}

export default function PriceAlertButton({
  propertyId,
  currentPrice,
  propertyTitle,
  className = '',
}: PriceAlertButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [alertActive, setAlertActive] = useState(false);
  const [targetPrice, setTargetPrice] = useState(Math.floor(currentPrice * 0.95));
  const [saving, setSaving] = useState(false);
  const [alertType, setAlertType] = useState<'PRICE_DROP' | 'PRICE_CHANGE'>('PRICE_DROP');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const createAlert = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/alerts/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          targetPrice: alertType === 'PRICE_DROP' ? targetPrice : undefined,
          alertType,
        }),
      });

      if (response.ok) {
        setAlertActive(true);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    } finally {
      setSaving(false);
    }
  };

  const removeAlert = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/alerts/price', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });

      if (response.ok) {
        setAlertActive(false);
      }
    } catch (error) {
      console.error('Failed to remove alert:', error);
    } finally {
      setSaving(false);
    }
  };

  const dropPercentage = Math.round(((currentPrice - targetPrice) / currentPrice) * 100);

  return (
    <>
      <button
        onClick={() => (alertActive ? removeAlert() : setShowModal(true))}
        disabled={saving}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          alertActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${className}`}
      >
        <svg
          className={`w-5 h-5 ${alertActive ? 'text-green-600' : 'text-gray-500'}`}
          fill={alertActive ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {alertActive ? 'Price Alert Active' : 'Get Price Alerts'}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Set Price Alert</h3>
              <p className="text-gray-600 mt-1">
                Get notified when the price changes on this property
              </p>
            </div>

            <div className="p-6">
              {/* Property Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-medium text-gray-900">{propertyTitle}</p>
                <p className="text-lg font-bold text-blue-600">
                  Current Price: {formatCurrency(currentPrice)}
                </p>
              </div>

              {/* Alert Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAlertType('PRICE_DROP')}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition ${
                      alertType === 'PRICE_DROP'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-lg">📉</span>
                      <p className="mt-1">Price Drop</p>
                      <p className="text-xs text-gray-500">Below target</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setAlertType('PRICE_CHANGE')}
                    className={`py-3 px-4 rounded-lg border text-sm font-medium transition ${
                      alertType === 'PRICE_CHANGE'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-lg">🔔</span>
                      <p className="mt-1">Any Change</p>
                      <p className="text-xs text-gray-500">Up or down</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Price (only for price drop) */}
              {alertType === 'PRICE_DROP' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert me when price drops to
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ZMW
                    </span>
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))}
                      max={currentPrice}
                      className="w-full pl-14 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    />
                  </div>
                  <input
                    type="range"
                    min={Math.floor(currentPrice * 0.5)}
                    max={currentPrice}
                    step={1000}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    className="w-full mt-3 accent-blue-600"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>50% off</span>
                    <span>Current price</span>
                  </div>

                  {/* Drop indicator */}
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-green-700">
                      Alert when price drops by{' '}
                      <span className="font-bold">{dropPercentage}%</span> or more
                    </p>
                    <p className="text-sm text-green-600">
                      Save up to {formatCurrency(currentPrice - targetPrice)}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick select buttons */}
              {alertType === 'PRICE_DROP' && (
                <div className="mb-6">
                  <label className="block text-sm text-gray-600 mb-2">
                    Quick select
                  </label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((percent) => (
                      <button
                        key={percent}
                        onClick={() =>
                          setTargetPrice(Math.floor(currentPrice * (1 - percent / 100)))
                        }
                        className={`flex-1 py-2 text-sm rounded-lg border transition ${
                          dropPercentage === percent
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        -{percent}%
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={createAlert}
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Set Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
