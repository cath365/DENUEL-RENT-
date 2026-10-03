"use client";
import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { LoadingSpinner } from '../../components/Loading';
import Link from 'next/link';

interface Inquiry {
  id: string;
  property: {
    id: string;
    title: string;
    city: string;
    price: number;
    images: { url: string }[];
  };
  lastMessage: {
    body: string;
    createdAt: string;
    senderId: string;
  };
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/inquiries');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load inquiries');
      }
      const data = await res.json();
      setInquiries(data.items || []);
    } catch (err) {
      console.error('Fetch inquiries error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Messages</h1>
              <p className="text-gray-600 mt-1">Track your conversations about properties</p>
            </div>
          </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No inquiries yet</h3>
            <p className="text-gray-600 mb-4">
              Start a conversation with landlords by clicking &quot;Contact&quot; on properties you&apos;re interested in.
            </p>
            <a
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Browse Properties
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {inquiry.property.images?.[0] ? (
                      <img
                        src={inquiry.property.images[0].url}
                        alt={inquiry.property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {inquiry.property.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-1">
                          {inquiry.property.city} • K{inquiry.property.price}/month
                        </p>
                        <p className="text-xs text-gray-500">
                          Started: {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mb-1">
                          {inquiry.messageCount} messages
                        </div>
                        {inquiry.lastMessage && (
                          <p className="text-xs text-gray-500">
                            Last: {new Date(inquiry.lastMessage.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {inquiry.lastMessage && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {inquiry.lastMessage.body}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link 
                        href={`/inquiries/${inquiry.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Continue Conversation
                      </Link>
                      <Link
                        href={`/property/${inquiry.property.id}`}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        View Property
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </main>
  );
}