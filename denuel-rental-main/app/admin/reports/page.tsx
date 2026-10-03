'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../../components/Header';
import Link from 'next/link';

interface Report {
  id: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    city: string;
    images: { url: string }[];
  };
  reporter: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const res = await fetch(`/api/admin/reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
    setLoading(false);
  };

  const handleAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'remove_listing') => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/${action}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchReports();
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Error processing report:', error);
    }
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      'SPAM': 'bg-yellow-100 text-yellow-800',
      'SCAM': 'bg-red-100 text-red-800',
      'INAPPROPRIATE': 'bg-orange-100 text-orange-800',
      'MISLEADING': 'bg-purple-100 text-purple-800',
      'DUPLICATE': 'bg-blue-100 text-blue-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'DISMISSED': 'bg-gray-100 text-gray-800',
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
          <span className="text-gray-900">Reports</span>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reported Listings</h1>
            <p className="text-gray-600 mt-1">Review and manage reported content</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'All Reports' },
            { id: 'pending', label: 'Pending' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'dismissed', label: 'Dismissed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reports to review</h3>
            <p className="text-gray-600">All reported listings have been processed</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reports List */}
            <div className="space-y-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`bg-white rounded-xl shadow-sm border cursor-pointer transition-all ${
                    selectedReport?.id === report.id
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {report.listing?.images?.[0] ? (
                          <img
                            src={report.listing.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No img
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{report.listing?.title || 'Deleted Listing'}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{report.listing?.city}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getReasonBadge(report.reason)}`}>
                            {report.reason}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Report Detail Panel */}
            {selectedReport ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Report Details</h2>

                {/* Listing Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Reported Listing</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      {selectedReport.listing?.images?.[0] ? (
                        <img
                          src={selectedReport.listing.images[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{selectedReport.listing?.title || 'Deleted Listing'}</p>
                      <p className="text-sm text-gray-500">{selectedReport.listing?.city}</p>
                      {selectedReport.listing && (
                        <Link
                          href={`/property/${selectedReport.listing.id}`}
                          className="text-sm text-blue-600 hover:underline"
                          target="_blank"
                        >
                          View Listing →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Report Info */}
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reason</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReasonBadge(selectedReport.reason)}`}>
                      {selectedReport.reason}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Details</p>
                    <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                      {selectedReport.details || 'No additional details provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reported By</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {selectedReport.reporter?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{selectedReport.reporter?.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">{selectedReport.reporter?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Reported On</p>
                    <p className="text-gray-900">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Actions */}
                {selectedReport.status === 'PENDING' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAction(selectedReport.id, 'remove_listing')}
                      className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      Remove Listing
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAction(selectedReport.id, 'resolve')}
                        className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => handleAction(selectedReport.id, 'dismiss')}
                        className="bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Dismiss Report
                      </button>
                    </div>
                  </div>
                )}

                {selectedReport.status !== 'PENDING' && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-600">This report has been {selectedReport.status.toLowerCase()}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-12 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p>Select a report to review</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
