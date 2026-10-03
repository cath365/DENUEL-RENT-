'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface ServiceProvider {
  id: string;
  businessName: string;
  category: string;
  description: string;
  phone: string;
  email: string;
  city: string;
  area: string;
  profilePhotoUrl: string;
  logoUrl: string;
  priceRange: string;
  hourlyRate: number;
  minimumCharge: number;
  yearsInBusiness: number;
  isVerified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  serviceAreas: string[];
  documents: ServiceDocument[];
  portfolio: PortfolioItem[];
  bookings: Booking[];
}

interface ServiceDocument {
  id: string;
  type: string;
  name: string;
  fileUrl: string;
  isVerified: boolean;
  uploadedAt: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  projectDate: string;
}

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  scheduledAt: string;
  status: string;
  estimatedPrice: number;
  notes: string;
  createdAt: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface ProfileView {
  id: string;
  viewerId: string | null;
  viewerName: string | null;
  viewerEmail: string | null;
  viewerPhone: string | null;
  viewerCity: string | null;
  source: string | null;
  searchQuery: string | null;
  createdAt: string;
}

interface Inquiry {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  serviceNeeded: string;
  description: string | null;
  preferredDate: string | null;
  budget: string | null;
  propertyAddress: string | null;
  city: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadProvider: number;
  status: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-red-100 text-red-800',
  NEW: 'bg-purple-100 text-purple-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  QUOTED: 'bg-orange-100 text-orange-800',
  CONVERTED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const CATEGORY_LABELS: Record<string, string> = {
  GARDENER: 'Garden & Landscaping',
  LANDSCAPER: 'Landscaping',
  PEST_CONTROL: 'Pest Control',
  MOVER: 'Moving Services',
  CLEANER: 'Cleaning',
  MAID: 'Maid Services',
  PAINTER: 'Painting',
  PLUMBER: 'Plumbing',
  SECURITY: 'Security',
  INTERIOR_DESIGNER: 'Interior Design',
  ELECTRICIAN: 'Electrical',
  CONTRACTOR: 'Contractor',
  HOME_INSPECTOR: 'Home Inspection',
  HVAC: 'HVAC',
  ROOFING: 'Roofing',
  FLOORING: 'Flooring',
  PHOTOGRAPHER: 'Photography',
  OTHER: 'Other Services',
};

function ServiceProviderDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Profile Views
  const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
  const [viewStats, setViewStats] = useState<any>(null);

  // Inquiries
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>({});
  const [selectedInquiryStatus, setSelectedInquiryStatus] = useState('ALL');

  // Conversations/Chat
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For portfolio upload
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    category: '',
    image: null as File | null,
  });

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
    fetchProviderProfile();
  }, []);

  useEffect(() => {
    if (provider) {
      if (activeTab === 'views') fetchProfileViews();
      if (activeTab === 'leads') fetchInquiries();
      if (activeTab === 'messages') fetchConversations();
    }
  }, [activeTab, provider]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProviderProfile = async () => {
    try {
      const res = await fetch('/api/services/me');
      if (res.ok) {
        const data = await res.json();
        setProvider(data.provider);
      } else if (res.status === 401) {
        // Not logged in - redirect to login
        router.push('/auth/login?redirect=/services/dashboard');
      } else if (res.status === 404) {
        // Logged in but no provider profile - redirect to register
        router.push('/services/register');
      } else {
        router.push('/services/register');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      router.push('/auth/login?redirect=/services/dashboard');
    }
    setLoading(false);
  };

  const fetchProfileViews = async () => {
    try {
      const res = await fetch('/api/services/views?days=30');
      if (res.ok) {
        const data = await res.json();
        setProfileViews(data.views);
        setViewStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching views:', error);
    }
  };

  const fetchInquiries = async () => {
    try {
      const status = selectedInquiryStatus === 'ALL' ? '' : `?status=${selectedInquiryStatus}`;
      const res = await fetch(`/api/services/inquiries${status}`);
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries);
        setInquiryCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/services/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        setTotalUnread(data.totalUnread);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/services/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setActiveConversation(data.conversation);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const res = await fetch(`/api/services/conversations/${activeConversation.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const updateInquiryStatus = async (inquiryId: string, status: string) => {
    try {
      const res = await fetch('/api/services/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, status }),
      });

      if (res.ok) {
        fetchInquiries();
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
    }
  };

  const updateAvailability = async (isAvailable: boolean) => {
    try {
      const res = await fetch('/api/services/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
      });
      if (res.ok) {
        setProvider(prev => prev ? { ...prev, isAvailable } : null);
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const res = await fetch(`/api/services/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchProviderProfile();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">No Provider Profile Found</h2>
          <Link href="/services/register" className="text-orange-600 hover:underline">
            Register as a Service Provider
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {showSuccessMessage && (
        <div className="bg-green-500 text-white text-center py-3">
          🎉 Welcome! Your service provider account has been created successfully.
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                {provider.profilePhotoUrl ? (
                  <img src={provider.profilePhotoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  '👷'
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{provider.businessName}</h1>
                <p className="text-gray-600">{CATEGORY_LABELS[provider.category] || provider.category}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium">{provider.ratingAvg.toFixed(1)}</span>
                  <span className="text-gray-500">({provider.ratingCount} reviews)</span>
                  {provider.isVerified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">✓ Verified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Available</span>
                <button
                  onClick={() => updateAvailability(!provider.isAvailable)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    provider.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      provider.isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <Link
                href={`/services/${provider.id}`}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
              >
                View Public Profile
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{viewStats?.totalViews || 0}</div>
              <div className="text-sm text-gray-500">Profile Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{inquiryCounts.NEW || 0}</div>
              <div className="text-sm text-gray-500">New Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalUnread}</div>
              <div className="text-sm text-gray-500">Unread Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{provider.completedJobs}</div>
              <div className="text-sm text-gray-500">Completed Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {provider.bookings?.filter(b => b.status === 'PENDING').length || 0}
              </div>
              <div className="text-sm text-gray-500">Pending Bookings</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'leads', label: 'Leads & Inquiries', icon: '📋', badge: inquiryCounts.NEW },
              { id: 'views', label: 'Profile Views', icon: '👁️' },
              { id: 'messages', label: 'Messages', icon: '💬', badge: totalUnread },
              { id: 'bookings', label: 'Bookings', icon: '📅' },
              { id: 'portfolio', label: 'Portfolio', icon: '📸' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'border-orange-600 text-orange-600 bg-orange-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📋</span> Recent Leads
                  </h3>
                  {inquiries.slice(0, 3).map(inquiry => (
                    <div key={inquiry.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{inquiry.customerName}</p>
                        <p className="text-sm text-gray-500">{inquiry.serviceNeeded}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[inquiry.status]}`}>
                        {inquiry.status}
                      </span>
                    </div>
                  ))}
                  {inquiries.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No inquiries yet</p>
                  )}
                  <button onClick={() => setActiveTab('leads')} className="w-full mt-4 text-orange-600 hover:underline text-sm">
                    View All Leads →
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>💬</span> Recent Messages
                  </h3>
                  {conversations.slice(0, 3).map(conv => (
                    <div 
                      key={conv.id} 
                      className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-gray-50"
                      onClick={() => { setActiveTab('messages'); setActiveConversation(conv); fetchMessages(conv.id); }}
                    >
                      <div>
                        <p className="font-medium">{conv.customerName}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadProvider > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{conv.unreadProvider}</span>
                      )}
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No messages yet</p>
                  )}
                  <button onClick={() => setActiveTab('messages')} className="w-full mt-4 text-orange-600 hover:underline text-sm">
                    View All Messages →
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>👁️</span> Profile Views (Last 30 Days)
                </h3>
                <div className="h-40 flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">{viewStats?.totalViews || 0}</p>
                    <p className="text-gray-500">Total Views</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl font-bold text-gray-900">Leads & Inquiries</h2>
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'CLOSED'].map(status => (
                    <button
                      key={status}
                      onClick={() => { setSelectedInquiryStatus(status); fetchInquiries(); }}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedInquiryStatus === status ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status} {inquiryCounts[status] ? `(${inquiryCounts[status]})` : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {inquiries.map(inquiry => (
                  <div key={inquiry.id} className="border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{inquiry.customerName}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[inquiry.status]}`}>{inquiry.status}</span>
                        </div>
                        <p className="text-orange-600 font-medium mt-1">{inquiry.serviceNeeded}</p>
                        {inquiry.description && <p className="text-gray-600 mt-2">{inquiry.description}</p>}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                          <span>📞 {inquiry.customerPhone}</span>
                          {inquiry.customerEmail && <span>✉️ {inquiry.customerEmail}</span>}
                          {inquiry.city && <span>📍 {inquiry.city}</span>}
                          {inquiry.budget && <span>💰 {inquiry.budget}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatTimeAgo(inquiry.createdAt)}</p>
                        <div className="flex gap-2 mt-2">
                          <a href={`tel:${inquiry.customerPhone}`} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Call</a>
                          <a
                            href={`https://wa.me/${inquiry.customerPhone.replace(/[^0-9]/g, '')}?text=Hi ${inquiry.customerName}, regarding your inquiry about ${inquiry.serviceNeeded}...`}
                            target="_blank"
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                      {inquiry.status === 'NEW' && (
                        <button onClick={() => updateInquiryStatus(inquiry.id, 'CONTACTED')} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200">Mark Contacted</button>
                      )}
                      {(inquiry.status === 'NEW' || inquiry.status === 'CONTACTED') && (
                        <button onClick={() => updateInquiryStatus(inquiry.id, 'QUOTED')} className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm hover:bg-orange-200">Quote Sent</button>
                      )}
                      {inquiry.status !== 'CONVERTED' && inquiry.status !== 'CLOSED' && (
                        <>
                          <button onClick={() => updateInquiryStatus(inquiry.id, 'CONVERTED')} className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200">Won Job</button>
                          <button onClick={() => updateInquiryStatus(inquiry.id, 'CLOSED')} className="bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-200">Close</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {inquiries.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-4xl mb-4">📋</p>
                    <p className="text-lg">No inquiries yet</p>
                    <p className="text-sm mt-2">When customers contact you, their inquiries will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Views Tab */}
          {activeTab === 'views' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Who's Viewing Your Profile</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{viewStats?.totalViews || 0}</p>
                  <p className="text-sm text-gray-600">Total Views (30 days)</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{viewStats?.uniqueViewers || 0}</p>
                  <p className="text-sm text-gray-600">Unique Visitors</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{profileViews.filter(v => v.viewerId).length}</p>
                  <p className="text-sm text-gray-600">Logged-in Users</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{viewStats?.searchQueries?.length || 0}</p>
                  <p className="text-sm text-gray-600">Search Queries</p>
                </div>
              </div>

              {viewStats?.searchQueries?.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Search Queries</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewStats.searchQueries.map((q: any, i: number) => (
                      <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm">"{q.query}" ({q.count})</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Recent Profile Visitors</h3>
                </div>
                <div className="divide-y">
                  {profileViews.map(view => (
                    <div key={view.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {view.viewerName ? view.viewerName.charAt(0).toUpperCase() : '👤'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{view.viewerName || 'Anonymous Visitor'}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {view.viewerCity && <span>📍 {view.viewerCity}</span>}
                            {view.source && <span>via {view.source}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatTimeAgo(view.createdAt)}</p>
                        {view.viewerPhone && (
                          <a href={`tel:${view.viewerPhone}`} className="text-sm text-orange-600 hover:underline">Contact →</a>
                        )}
                      </div>
                    </div>
                  ))}

                  {profileViews.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <p className="text-4xl mb-4">👁️</p>
                      <p>No profile views yet</p>
                      <p className="text-sm mt-2">Share your profile to get more visibility</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="flex h-[600px] border rounded-lg overflow-hidden">
              <div className="w-1/3 border-r overflow-y-auto">
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Conversations</h3>
                </div>
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => { setActiveConversation(conv); fetchMessages(conv.id); }}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${activeConversation?.id === conv.id ? 'bg-orange-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{conv.customerName}</p>
                      {conv.unreadProvider > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{conv.unreadProvider}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">{conv.lastMessageAt && formatTimeAgo(conv.lastMessageAt)}</p>
                  </div>
                ))}

                {conversations.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-4xl mb-4">💬</p>
                    <p>No conversations yet</p>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                {activeConversation ? (
                  <>
                    <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                      <div>
                        <h3 className="font-semibold text-gray-900">{activeConversation.customerName}</h3>
                        <p className="text-sm text-gray-500">{activeConversation.customerPhone}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={`tel:${activeConversation.customerPhone}`} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200">📞</a>
                        <a href={`https://wa.me/${activeConversation.customerPhone?.replace(/[^0-9]/g, '')}`} target="_blank" className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200">💬</a>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.senderType === 'PROVIDER' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3 rounded-lg ${msg.senderType === 'PROVIDER' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                            <p>{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.senderType === 'PROVIDER' ? 'text-orange-200' : 'text-gray-500'}`}>
                              {formatTimeAgo(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                        <button onClick={sendMessage} disabled={!newMessage.trim()} className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50">Send</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <p className="text-4xl mb-4">💬</p>
                      <p>Select a conversation to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Bookings</h2>
              
              <div className="space-y-4">
                {provider.bookings?.map(booking => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{booking.customerName}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[booking.status]}`}>{booking.status}</span>
                        </div>
                        <p className="text-orange-600">{booking.serviceType}</p>
                        <p className="text-sm text-gray-500 mt-1">📅 {formatDate(booking.scheduledAt)}</p>
                        {booking.notes && <p className="text-gray-600 mt-2">{booking.notes}</p>}
                      </div>
                      <div className="text-right">
                        {booking.estimatedPrice && <p className="font-semibold text-lg">K{booking.estimatedPrice.toLocaleString()}</p>}
                        <div className="flex gap-2 mt-2">
                          {booking.status === 'PENDING' && (
                            <>
                              <button onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Confirm</button>
                              <button onClick={() => updateBookingStatus(booking.id, 'CANCELED')} className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm">Cancel</button>
                            </>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <button onClick={() => updateBookingStatus(booking.id, 'COMPLETED')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Mark Complete</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(!provider.bookings || provider.bookings.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-4xl mb-4">📅</p>
                    <p className="text-lg">No bookings yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Portfolio</h2>
                <button onClick={() => setShowPortfolioModal(true)} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">+ Add Work</button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {provider.portfolio?.map(item => (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover" />
                    <div className="p-3">
                      <h3 className="font-semibold">{item.title}</h3>
                      {item.description && <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>}
                    </div>
                  </div>
                ))}

                {(!provider.portfolio || provider.portfolio.length === 0) && (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <p className="text-4xl mb-4">📸</p>
                    <p className="text-lg">No portfolio items yet</p>
                    <p className="text-sm mt-2">Showcase your work to attract more customers</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Business Information</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Business Name</label>
                    <input type="text" value={provider.businessName} className="w-full p-3 border rounded-lg bg-gray-50" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                    <input type="text" value={CATEGORY_LABELS[provider.category] || provider.category} className="w-full p-3 border rounded-lg bg-gray-50" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Phone</label>
                    <input type="text" value={provider.phone} className="w-full p-3 border rounded-lg bg-gray-50" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email</label>
                    <input type="text" value={provider.email} className="w-full p-3 border rounded-lg bg-gray-50" readOnly />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Location</h3>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">City</label>
                    <input type="text" value={provider.city} className="w-full p-3 border rounded-lg bg-gray-50" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Area</label>
                    <input type="text" value={provider.area || ''} className="w-full p-3 border rounded-lg bg-gray-50" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Price Range</label>
                    <input type="text" value={provider.priceRange || ''} className="w-full p-3 border rounded-lg bg-gray-50" readOnly />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Link href="/services/register?edit=true" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">Edit Profile</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Modal */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Portfolio Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Title *</label>
                <input
                  type="text"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="e.g., Kitchen Renovation"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <textarea
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  rows={3}
                  placeholder="Describe the project..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, image: e.target.files?.[0] || null })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPortfolioModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg">Cancel</button>
                <button
                  onClick={async () => {
                    if (!portfolioForm.title || !portfolioForm.image) return;
                    setShowPortfolioModal(false);
                  }}
                  className="flex-1 bg-orange-600 text-white py-2 rounded-lg"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceProviderDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ServiceProviderDashboardContent />
    </Suspense>
  );
}
