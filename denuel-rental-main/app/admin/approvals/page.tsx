'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';

type ProviderType = 'all' | 'driver' | 'maid' | 'cleaner' | 'security' | 'gardener' | 'plumber' | 'electrician' | 'painter' | 'mover';

interface ServiceApplication {
  id: string;
  type: ProviderType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    profileImage: string | null;
    nrcNumber?: string;
  };
  businessName?: string;
  experience: string;
  description: string;
  serviceAreas: string[];
  documents: {
    id: string;
    type: string;
    name: string;
    url: string;
    verified: boolean;
  }[];
  // Driver specific
  licenseNumber?: string;
  vehicleType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  plateNumber?: string;
  // Service provider specific
  services?: string[];
  hourlyRate?: number;
  availability?: string[];
}

const PROVIDER_TYPES: { id: ProviderType; label: string; icon: string; color: string }[] = [
  { id: 'all', label: 'All Applications', icon: '📋', color: 'bg-gray-500' },
  { id: 'driver', label: 'Drivers', icon: '🚗', color: 'bg-blue-500' },
  { id: 'maid', label: 'Maids/Housekeepers', icon: '🏠', color: 'bg-pink-500' },
  { id: 'cleaner', label: 'Cleaners', icon: '🧹', color: 'bg-cyan-500' },
  { id: 'security', label: 'Security Guards', icon: '🛡️', color: 'bg-red-500' },
  { id: 'gardener', label: 'Gardeners', icon: '🌳', color: 'bg-green-500' },
  { id: 'plumber', label: 'Plumbers', icon: '🔧', color: 'bg-orange-500' },
  { id: 'electrician', label: 'Electricians', icon: '⚡', color: 'bg-yellow-500' },
  { id: 'painter', label: 'Painters', icon: '🎨', color: 'bg-purple-500' },
  { id: 'mover', label: 'Movers', icon: '📦', color: 'bg-amber-500' },
];

const REQUIRED_DOCUMENTS: Record<ProviderType, string[]> = {
  all: [],
  driver: ['NRC Copy', 'Driver\'s License', 'Vehicle Registration', 'Insurance', 'Police Clearance'],
  maid: ['NRC Copy', 'Police Clearance', 'Reference Letter'],
  cleaner: ['NRC Copy', 'Police Clearance', 'Business Registration (if company)'],
  security: ['NRC Copy', 'Police Clearance', 'Security Training Certificate', 'ZICSA Registration'],
  gardener: ['NRC Copy', 'Police Clearance'],
  plumber: ['NRC Copy', 'Trade Certificate', 'Business Registration'],
  electrician: ['NRC Copy', 'EIZ License', 'Trade Certificate'],
  painter: ['NRC Copy', 'Police Clearance'],
  mover: ['NRC Copy', 'Police Clearance', 'Vehicle Registration', 'Business Registration'],
};

export default function SuperAdminApprovalsPage() {
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ProviderType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApplication, setSelectedApplication] = useState<ServiceApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, [selectedType, statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const res = await fetch(`/api/admin/approvals?${params}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      } else {
        // Mock data for demo
        const mockApplications: ServiceApplication[] = [
          {
            id: '1',
            type: 'driver',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            user: { id: '1', name: 'John Banda', email: 'john@email.com', phone: '+260971234567', profileImage: null, nrcNumber: '123456/10/1' },
            experience: '5 years',
            description: 'Experienced driver with clean record. Previously worked for a logistics company.',
            serviceAreas: ['Lusaka', 'Kafue', 'Chongwe'],
            documents: [
              { id: '1', type: 'nrc', name: 'NRC Copy', url: '/docs/nrc.pdf', verified: false },
              { id: '2', type: 'license', name: 'Driver\'s License', url: '/docs/license.pdf', verified: false },
              { id: '3', type: 'vehicle_reg', name: 'Vehicle Registration', url: '/docs/reg.pdf', verified: false },
            ],
            licenseNumber: 'DL123456',
            vehicleType: 'SUV',
            vehicleMake: 'Toyota',
            vehicleModel: 'Land Cruiser',
            vehicleYear: 2020,
            plateNumber: 'ABZ 1234',
          },
          {
            id: '2',
            type: 'maid',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            user: { id: '2', name: 'Mary Phiri', email: 'mary@email.com', phone: '+260972345678', profileImage: null, nrcNumber: '234567/20/1' },
            experience: '8 years',
            description: 'Reliable housekeeper with experience in large households. Can cook, clean, and do laundry.',
            serviceAreas: ['Lusaka'],
            documents: [
              { id: '4', type: 'nrc', name: 'NRC Copy', url: '/docs/nrc.pdf', verified: false },
              { id: '5', type: 'clearance', name: 'Police Clearance', url: '/docs/clearance.pdf', verified: false },
            ],
            services: ['Cooking', 'Cleaning', 'Laundry', 'Childcare'],
            hourlyRate: 25,
            availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          },
          {
            id: '3',
            type: 'security',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            user: { id: '3', name: 'Peter Zulu', email: 'peter@email.com', phone: '+260973456789', profileImage: null, nrcNumber: '345678/30/1' },
            experience: '10 years',
            description: 'Former military police. Trained in security operations and first aid.',
            serviceAreas: ['Lusaka', 'Ndola', 'Kitwe'],
            documents: [
              { id: '6', type: 'nrc', name: 'NRC Copy', url: '/docs/nrc.pdf', verified: false },
              { id: '7', type: 'clearance', name: 'Police Clearance', url: '/docs/clearance.pdf', verified: false },
              { id: '8', type: 'cert', name: 'Security Training Certificate', url: '/docs/cert.pdf', verified: false },
            ],
            services: ['Day Shift', 'Night Shift', 'Armed Response'],
            hourlyRate: 35,
            availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          },
          {
            id: '4',
            type: 'cleaner',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            user: { id: '4', name: 'Grace Tembo', email: 'grace@email.com', phone: '+260974567890', profileImage: null, nrcNumber: '456789/40/1' },
            businessName: 'Sparkle Clean Services',
            experience: '3 years',
            description: 'Professional cleaning company specializing in residential and office cleaning.',
            serviceAreas: ['Lusaka'],
            documents: [
              { id: '9', type: 'nrc', name: 'NRC Copy', url: '/docs/nrc.pdf', verified: false },
              { id: '10', type: 'business', name: 'Business Registration', url: '/docs/business.pdf', verified: false },
            ],
            services: ['Deep Cleaning', 'Regular Cleaning', 'Move-in/Move-out', 'Office Cleaning'],
            hourlyRate: 50,
          },
        ];
        
        const filtered = mockApplications.filter(app => {
          if (selectedType !== 'all' && app.type !== selectedType) return false;
          if (statusFilter !== 'all' && app.status.toLowerCase() !== statusFilter) return false;
          return true;
        });
        
        setApplications(filtered);
        setStats({
          total: mockApplications.length,
          pending: mockApplications.filter(a => a.status === 'PENDING').length,
          approved: mockApplications.filter(a => a.status === 'APPROVED').length,
          rejected: mockApplications.filter(a => a.status === 'REJECTED').length,
        });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
    setLoading(false);
  };

  const handleApprove = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/admin/approvals/${applicationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        fetchApplications();
        setSelectedApplication(null);
        alert('Application approved successfully!');
      }
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication || !rejectReason.trim()) return;
    
    try {
      const res = await fetch(`/api/admin/approvals/${selectedApplication.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        fetchApplications();
        setSelectedApplication(null);
        setShowRejectModal(false);
        setRejectReason('');
        alert('Application rejected.');
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  const handleVerifyDocument = async (applicationId: string, documentId: string) => {
    try {
      const res = await fetch(`/api/admin/approvals/${applicationId}/documents/${documentId}/verify`, {
        method: 'POST',
      });
      if (res.ok) {
        // Update local state
        setApplications(prev => prev.map(app => {
          if (app.id === applicationId) {
            return {
              ...app,
              documents: app.documents.map(doc =>
                doc.id === documentId ? { ...doc, verified: true } : doc
              ),
            };
          }
          return app;
        }));
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(prev => prev ? {
            ...prev,
            documents: prev.documents.map(doc =>
              doc.id === documentId ? { ...doc, verified: true } : doc
            ),
          } : null);
        }
      }
    } catch (error) {
      console.error('Error verifying document:', error);
    }
  };

  const getTypeInfo = (type: ProviderType) => {
    return PROVIDER_TYPES.find(t => t.id === type) || PROVIDER_TYPES[0];
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/admin" className="hover:text-blue-600">Admin</Link>
          <span>/</span>
          <span className="text-gray-900">Service Provider Approvals</span>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Provider Approvals</h1>
            <p className="text-gray-600 mt-1">Review and approve service provider applications</p>
          </div>
          
          {/* Stats Summary */}
          <div className="flex gap-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-xs text-yellow-700">Pending</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-xs text-green-700">Approved</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-xs text-red-700">Rejected</p>
            </div>
          </div>
        </div>

        {/* Provider Type Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {PROVIDER_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedType === type.id
                    ? `${type.color} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications to review</h3>
            <p className="text-gray-600">All {selectedType === 'all' ? '' : getTypeInfo(selectedType).label.toLowerCase()} applications have been processed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Applications List */}
            <div className="space-y-4">
              {applications.map((app) => {
                const typeInfo = getTypeInfo(app.type);
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApplication(app)}
                    className={`bg-white rounded-xl shadow-sm border cursor-pointer transition-all ${
                      selectedApplication?.id === app.id
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 ${typeInfo.color} rounded-xl flex items-center justify-center flex-shrink-0 text-2xl text-white`}>
                          {typeInfo.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{app.user.name}</h3>
                              <p className="text-sm text-gray-500">{app.businessName || typeInfo.label}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{app.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                            <span>📍 {app.serviceAreas.slice(0, 2).join(', ')}{app.serviceAreas.length > 2 ? ` +${app.serviceAreas.length - 2}` : ''}</span>
                            <span>🕐 {app.experience}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">
                              Applied: {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {app.documents.filter(d => d.verified).length}/{app.documents.length} docs verified
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Application Detail Panel */}
            {selectedApplication ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Applicant Profile */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 ${getTypeInfo(selectedApplication.type).color} rounded-xl flex items-center justify-center text-3xl text-white`}>
                      {selectedApplication.user.profileImage ? (
                        <img src={selectedApplication.user.profileImage} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        getTypeInfo(selectedApplication.type).icon
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedApplication.user.name}</h3>
                      {selectedApplication.businessName && (
                        <p className="text-gray-600">{selectedApplication.businessName}</p>
                      )}
                      <p className="text-sm text-gray-500">{selectedApplication.user.email}</p>
                      <p className="text-sm text-gray-500">{selectedApplication.user.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Application Type Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1.5 ${getTypeInfo(selectedApplication.type).color} text-white rounded-lg font-medium`}>
                    {getTypeInfo(selectedApplication.type).icon} {getTypeInfo(selectedApplication.type).label}
                  </span>
                  <span className={`px-3 py-1.5 rounded-lg font-medium ${getStatusBadge(selectedApplication.status)}`}>
                    {selectedApplication.status}
                  </span>
                </div>

                {/* NRC Number */}
                {selectedApplication.user.nrcNumber && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">NRC Number</p>
                    <p className="font-mono bg-gray-100 px-3 py-2 rounded-lg">{selectedApplication.user.nrcNumber}</p>
                  </div>
                )}

                {/* Description */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">About / Description</p>
                  <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{selectedApplication.description}</p>
                </div>

                {/* Experience */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Experience</p>
                  <p className="font-medium">{selectedApplication.experience}</p>
                </div>

                {/* Service Areas */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Service Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.serviceAreas.map((area, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        📍 {area}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Driver-specific Info */}
                {selectedApplication.type === 'driver' && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold text-blue-900 mb-3">🚗 Vehicle Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-blue-700">License Number</p>
                        <p className="font-medium">{selectedApplication.licenseNumber}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Vehicle Type</p>
                        <p className="font-medium">{selectedApplication.vehicleType}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Make & Model</p>
                        <p className="font-medium">{selectedApplication.vehicleMake} {selectedApplication.vehicleModel}</p>
                      </div>
                      <div>
                        <p className="text-blue-700">Year</p>
                        <p className="font-medium">{selectedApplication.vehicleYear}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-blue-700">Plate Number</p>
                        <p className="font-mono font-bold bg-yellow-100 text-yellow-800 px-3 py-1 rounded inline-block">{selectedApplication.plateNumber}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Provider-specific Info */}
                {selectedApplication.services && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Services Offered</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.services.map((service, idx) => (
                        <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                          ✓ {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApplication.hourlyRate && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">Hourly Rate</p>
                    <p className="text-2xl font-bold text-green-600">K{selectedApplication.hourlyRate}/hr</p>
                  </div>
                )}

                {selectedApplication.availability && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Availability</p>
                    <div className="flex flex-wrap gap-1">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                        const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx];
                        const isAvailable = selectedApplication.availability?.includes(fullDay);
                        return (
                          <span
                            key={day}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium ${
                              isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">📄 Submitted Documents</h4>
                  <div className="space-y-2">
                    {selectedApplication.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          doc.verified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            doc.verified ? 'bg-green-100' : 'bg-gray-200'
                          }`}>
                            {doc.verified ? (
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.verified ? 'Verified ✓' : 'Pending verification'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            View
                          </a>
                          {!doc.verified && (
                            <button
                              onClick={() => handleVerifyDocument(selectedApplication.id, doc.id)}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Required Documents Checklist */}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-2">Required Documents for {getTypeInfo(selectedApplication.type).label}:</p>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {REQUIRED_DOCUMENTS[selectedApplication.type]?.map((doc, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-4 h-4 flex items-center justify-center">
                            {selectedApplication.documents.some(d => d.name.toLowerCase().includes(doc.toLowerCase().split(' ')[0].toLowerCase())) ? '✅' : '⚠️'}
                          </span>
                          {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedApplication.status === 'PENDING' && (
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleApprove(selectedApplication.id)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve Application
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject Application
                    </button>
                  </div>
                )}

                {selectedApplication.status !== 'PENDING' && (
                  <div className={`p-4 rounded-lg ${
                    selectedApplication.status === 'APPROVED' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <p className="font-medium">
                      This application has been {selectedApplication.status.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-12 flex items-center justify-center sticky top-24">
                <div className="text-center text-gray-500">
                  <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg font-medium">Select an application to review</p>
                  <p className="text-sm mt-1">Click on any application to see details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this application. This will be sent to the applicant.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
