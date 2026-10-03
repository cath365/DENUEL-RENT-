'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../../components/Header';
import Link from 'next/link';

interface PendingProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  area?: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  images: { url: string }[];
  owner: { id: string; name: string; email: string };
  createdAt: string;
  status: string;
}

export default function PendingPropertiesPage() {
  const [properties, setProperties] = useState<PendingProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PendingProperty | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  const fetchPendingProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties?status=PENDING');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching pending properties:', error);
    }
    setLoading(false);
  };

  const handleApprove = async (propertyId: string) => {
    setActionLoading(propertyId);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        setProperties(properties.filter(p => p.id !== propertyId));
        setSelectedProperty(null);
      }
    } catch (error) {
      console.error('Error approving property:', error);
    }
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!selectedProperty) return;
    setActionLoading(selectedProperty.id);
    try {
      const res = await fetch(`/api/admin/properties/${selectedProperty.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      if (res.ok) {
        setProperties(properties.filter(p => p.id !== selectedProperty.id));
        setSelectedProperty(null);
        setShowRejectModal(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error rejecting property:', error);
    }
    setActionLoading(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/admin" className="hover:text-blue-600">Admin</Link>
          <span>/</span>
          <Link href="/admin/properties" className="hover:text-blue-600">Properties</Link>
          <span>/</span>
          <span className="text-gray-900">Pending Approvals</span>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pending Property Approvals</h1>
            <p className="text-gray-600 mt-1">{properties.length} properties waiting for review</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {/* bulk approve */}}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending properties to review</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property List */}
            <div className="space-y-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => setSelectedProperty(property)}
                  className={`bg-white rounded-xl shadow-sm border cursor-pointer transition-all ${
                    selectedProperty?.id === property.id
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {property.images[0] ? (
                        <img
                          src={property.images[0].url}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{property.title}</h3>
                      <p className="text-sm text-gray-600">{property.city}{property.area ? `, ${property.area}` : ''}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">K{property.price.toLocaleString()}/mo</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{property.bedrooms} bed</span>
                        <span>{property.bathrooms} bath</span>
                        <span>{property.propertyType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-gray-600">Submitted by </span>
                        <span className="font-medium">{property.owner.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(property.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Property Detail Panel */}
            {selectedProperty ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Review Property</h2>
                
                {/* Images */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {selectedProperty.images.slice(0, 6).map((img, idx) => (
                    <div key={idx} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {/* Details */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedProperty.title}</h3>
                    <p className="text-sm text-gray-600">{selectedProperty.city}{selectedProperty.area ? `, ${selectedProperty.area}` : ''}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="font-bold text-blue-600">K{selectedProperty.price.toLocaleString()}/mo</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-semibold">{selectedProperty.propertyType}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Bedrooms</p>
                      <p className="font-semibold">{selectedProperty.bedrooms}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Bathrooms</p>
                      <p className="font-semibold">{selectedProperty.bathrooms}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-gray-900">{selectedProperty.description}</p>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-600 mb-2">Submitted by</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-blue-600">
                          {selectedProperty.owner.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{selectedProperty.owner.name}</p>
                        <p className="text-sm text-gray-600">{selectedProperty.owner.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedProperty.id)}
                    disabled={actionLoading === selectedProperty.id}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === selectedProperty.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading === selectedProperty.id}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>

                <Link
                  href={`/property/${selectedProperty.id}`}
                  className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-4"
                >
                  View Full Listing →
                </Link>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-12 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p>Select a property to review</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && selectedProperty && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Property</h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting &quot;{selectedProperty.title}&quot;
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none h-32"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Reject Property
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
