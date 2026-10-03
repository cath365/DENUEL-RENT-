'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ServiceProvider {
  id: string;
  businessName: string;
  category: string;
  phone: string;
  email: string;
  city: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  user: { name: string; email: string } | null;
  documents: ServiceDocument[];
  _count: { bookings: number; reviews: number };
}

interface ServiceDocument {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  isVerified: boolean;
  uploadedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  GARDENER: 'Gardener',
  LANDSCAPER: 'Landscaper',
  PEST_CONTROL: 'Pest Control',
  MOVER: 'Moving Services',
  CLEANER: 'Cleaning',
  MAID: 'Maid/Housekeeper',
  PAINTER: 'Painting',
  PLUMBER: 'Plumbing',
  SECURITY: 'Security',
  INTERIOR_DESIGNER: 'Interior Design',
  ELECTRICIAN: 'Electrician',
  CONTRACTOR: 'Contractor',
};

export default function AdminServiceProvidersPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [filter]);

  const fetchProviders = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === 'pending') params.append('verified', 'false');
      if (filter === 'verified') params.append('verified', 'true');

      const res = await fetch(`/api/admin/service-providers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
    setLoading(false);
  };

  const verifyProvider = async (providerId: string) => {
    try {
      const res = await fetch(`/api/admin/service-providers/${providerId}/verify`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchProviders();
        setSelectedProvider(null);
      }
    } catch (error) {
      console.error('Error verifying provider:', error);
    }
  };

  const verifyDocument = async (documentId: string) => {
    try {
      const res = await fetch(`/api/admin/service-documents/${documentId}/verify`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchProviders();
        if (selectedProvider) {
          const updated = providers.find(p => p.id === selectedProvider.id);
          setSelectedProvider(updated || null);
        }
      }
    } catch (error) {
      console.error('Error verifying document:', error);
    }
  };

  const toggleProviderStatus = async (providerId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/service-providers/${providerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) {
        fetchProviders();
      }
    } catch (error) {
      console.error('Error updating provider:', error);
    }
  };

  const pendingCount = providers.filter(p => !p.isVerified).length;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Service Providers</h1>
              <p className="text-gray-600">Manage and verify service provider accounts</p>
            </div>
            <Link href="/admin" className="text-blue-600 hover:underline">
              ← Back to Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-blue-600">{providers.length}</div>
            <div className="text-gray-600">Total Providers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-green-600">
              {providers.filter(p => p.isVerified).length}
            </div>
            <div className="text-gray-600">Verified</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-gray-600">Pending Verification</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-3xl font-bold text-purple-600">
              {providers.filter(p => p.isActive).length}
            </div>
            <div className="text-gray-600">Active</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'verified'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Providers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : providers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No providers found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Provider</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Documents</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{provider.businessName}</div>
                      <div className="text-sm text-gray-500">{provider.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {CATEGORY_LABELS[provider.category] || provider.category}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{provider.city}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {provider.documents.filter(d => d.isVerified).length} / {provider.documents.length} verified
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {provider.isVerified ? (
                          <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        ) : (
                          <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                            Pending
                          </span>
                        )}
                        {!provider.isActive && (
                          <span className="inline-block text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedProvider(provider)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </button>
                        {!provider.isVerified && (
                          <button
                            onClick={() => verifyProvider(provider.id)}
                            className="text-green-600 hover:underline text-sm"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => toggleProviderStatus(provider.id, !provider.isActive)}
                          className={`text-sm ${provider.isActive ? 'text-red-600' : 'text-green-600'} hover:underline`}
                        >
                          {provider.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Provider Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedProvider.businessName}</h2>
                  <p className="text-gray-600">{CATEGORY_LABELS[selectedProvider.category]}</p>
                </div>
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="text-gray-800">{selectedProvider.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="text-gray-800">{selectedProvider.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">City:</span>
                    <p className="text-gray-800">{selectedProvider.city}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Registered:</span>
                    <p className="text-gray-800">
                      {new Date(selectedProvider.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Documents</h3>
                {selectedProvider.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProvider.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.type.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View
                          </a>
                          {doc.isVerified ? (
                            <span className="text-green-600 text-sm">✓ Verified</span>
                          ) : (
                            <button
                              onClick={() => verifyDocument(doc.id)}
                              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No documents uploaded</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {!selectedProvider.isVerified && (
                  <button
                    onClick={() => verifyProvider(selectedProvider.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Verify Provider
                  </button>
                )}
                <button
                  onClick={() => toggleProviderStatus(selectedProvider.id, !selectedProvider.isActive)}
                  className={`px-4 py-2 rounded-lg ${
                    selectedProvider.isActive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {selectedProvider.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
