'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

type DashboardTab = 'overview' | 'leads' | 'messages' | 'bookings' | 'portfolio' | 'analytics' | 'profile';

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
  description?: string | null;
  imageUrl: string;
  category?: string | null;
  projectDate?: string | null;
}

interface Booking {
  id: string;
  customerName?: string | null;
  customerPhone?: string | null;
  serviceType: string;
  scheduledAt: string;
  status: string;
  estimatedPrice?: number | null;
  finalPrice?: number | null;
  notes?: string | null;
  createdAt: string;
  customer?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

interface ServiceProvider {
  id: string;
  providerType?: string;
  verificationStatus?: string;
  rejectionReason?: string | null;
  profileCompletion?: number;
  businessName: string;
  category: string;
  description?: string | null;
  phone: string;
  email: string;
  city: string;
  area?: string | null;
  website?: string | null;
  profilePhotoUrl?: string | null;
  logoUrl?: string | null;
  coverPhotoUrl?: string | null;
  priceRange?: string | null;
  hourlyRate?: number | null;
  minimumCharge?: number | null;
  yearsInBusiness?: number | null;
  isVerified: boolean;
  isActive: boolean;
  isAvailable: boolean;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  serviceAreas?: any;
  documents: ServiceDocument[];
  portfolio: PortfolioItem[];
  bookings: Booking[];
}

interface ProfileView {
  id: string;
  source?: string | null;
  searchQuery?: string | null;
  createdAt: string;
}

interface Inquiry {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone: string;
  serviceNeeded: string;
  description?: string | null;
  preferredDate?: string | null;
  budget?: string | null;
  propertyAddress?: string | null;
  city?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
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

const CATEGORY_LABELS: Record<string, string> = {
  HOME_INSPECTOR: 'Home inspection',
  MOVER: 'Moving',
  CLEANER: 'Cleaning',
  PHOTOGRAPHER: 'Property photography',
  CONTRACTOR: 'Construction / contractor',
  ELECTRICIAN: 'Electrical',
  PLUMBER: 'Plumbing',
  PAINTER: 'Painting',
  LANDSCAPER: 'Gardening & landscaping',
  PEST_CONTROL: 'Pest control',
  HOME_INSURANCE: 'Home insurance',
  HOME_WARRANTY: 'Home warranty',
  LEGAL: 'Legal',
  MORTGAGE_BROKER: 'Mortgage broker',
  INTERIOR_DESIGNER: 'Interior design',
  SECURITY: 'Security',
  HVAC: 'HVAC',
  ROOFING: 'Roofing',
  FLOORING: 'Flooring',
  OTHER: 'Other services',
};

const INQUIRY_STATUSES = ['NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'CLOSED'] as const;

function money(value?: number | null) {
  return 'K' + Number(value || 0).toLocaleString();
}

function humanize(value?: string | null) {
  if (!value) return 'Not specified';
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  if (status === 'COMPLETED' || status === 'CONVERTED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'CONFIRMED' || status === 'CONTACTED') return 'border-blue-200 bg-blue-50 text-blue-800';
  if (status === 'QUOTED') return 'border-violet-200 bg-violet-50 text-violet-800';
  if (status === 'CANCELED' || status === 'CLOSED') return 'border-slate-200 bg-slate-50 text-slate-600';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

async function readResponse(res: Response) {
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  return { text, data };
}

function ServiceProviderDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
  const [viewStats, setViewStats] = useState<any>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedInquiryStatus, setSelectedInquiryStatus] = useState('ALL');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    category: '',
    image: null as File | null,
  });

  const [profileForm, setProfileForm] = useState({
    businessName: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    city: '',
    area: '',
    priceRange: '',
    yearsInBusiness: '',
  });

  const syncProfileForm = (nextProvider: ServiceProvider) => {
    setProfileForm({
      businessName: nextProvider.businessName || '',
      description: nextProvider.description || '',
      phone: nextProvider.phone || '',
      email: nextProvider.email || '',
      website: nextProvider.website || '',
      city: nextProvider.city || '',
      area: nextProvider.area || '',
      priceRange: nextProvider.priceRange || '',
      yearsInBusiness: nextProvider.yearsInBusiness != null ? String(nextProvider.yearsInBusiness) : '',
    });
  };

  const redirectToLogin = () => {
    router.push('/auth/login?redirect=/services/dashboard&reason=session');
  };

  async function loadProfile() {
    const res = await fetch('/api/services/me', { credentials: 'same-origin' });
    const { text, data } = await readResponse(res);

    if (res.status === 401) {
      redirectToLogin();
      return null;
    }
    if (res.status === 404) {
      router.push('/services/register');
      return null;
    }
    if (!res.ok || !data?.provider) {
      throw new Error(data?.message || text || 'Unable to load your service profile.');
    }

    setProvider(data.provider);
    syncProfileForm(data.provider);
    return data.provider as ServiceProvider;
  }

  async function loadViews() {
    const res = await fetch('/api/services/views?days=30', { credentials: 'same-origin' });
    const { text, data } = await readResponse(res);
    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    if (!res.ok) throw new Error(data?.error || text || 'Unable to load profile analytics.');
    setProfileViews(Array.isArray(data.views) ? data.views : []);
    setViewStats(data.stats || null);
  }

  async function loadInquiries() {
    const res = await fetch('/api/services/inquiries', { credentials: 'same-origin' });
    const { text, data } = await readResponse(res);
    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    if (!res.ok) throw new Error(data?.error || text || 'Unable to load service inquiries.');
    setInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
    setInquiryCounts(data.counts || {});
  }

  async function loadConversations() {
    const res = await fetch('/api/services/conversations', { credentials: 'same-origin' });
    const { text, data } = await readResponse(res);
    if (res.status === 401) {
      redirectToLogin();
      return;
    }
    if (!res.ok) throw new Error(data?.error || text || 'Unable to load conversations.');
    setConversations(Array.isArray(data.conversations) ? data.conversations : []);
    setTotalUnread(Number(data.totalUnread || 0));
  }

  async function loadDashboard() {
    setLoading(true);
    setError('');

    try {
      const currentProvider = await loadProfile();
      if (!currentProvider) return;

      const results = await Promise.allSettled([
        loadViews(),
        loadInquiries(),
        loadConversations(),
      ]);

      const rejected = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
      if (rejected) {
        setError(rejected.reason instanceof Error ? rejected.reason.message : 'Some dashboard data could not be loaded.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your provider dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setNotice('Your service provider profile has been created. Complete verification before it is published.');
    }
    loadDashboard();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const visibleInquiries = useMemo(
    () => selectedInquiryStatus === 'ALL'
      ? inquiries
      : inquiries.filter((inquiry) => inquiry.status === selectedInquiryStatus),
    [inquiries, selectedInquiryStatus],
  );

  const pendingBookings = useMemo(
    () => provider?.bookings?.filter((booking) => booking.status === 'PENDING').length || 0,
    [provider],
  );

  const completedBookings = useMemo(
    () => provider?.bookings?.filter((booking) => booking.status === 'COMPLETED').length || 0,
    [provider],
  );

  async function fetchMessages(conversation: Conversation) {
    setActionLoading('conversation');
    setError('');

    try {
      const res = await fetch('/api/services/conversations/' + conversation.id, {
        credentials: 'same-origin',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error(data?.error || text || 'Unable to load messages.');

      setActiveConversation(data.conversation || conversation);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages.');
    } finally {
      setActionLoading('');
    }
  }

  async function sendMessage() {
    if (!activeConversation || !newMessage.trim()) return;

    setActionLoading('message');
    setError('');

    try {
      const res = await csrfFetch('/api/services/conversations/' + activeConversation.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok || !data?.message) {
        throw new Error(data?.error || text || 'Unable to send message.');
      }

      setMessages((current) => [...current, data.message]);
      setNewMessage('');
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setActionLoading('');
    }
  }

  async function updateInquiryStatus(inquiryId: string, status: string) {
    setActionLoading('inquiry-' + inquiryId);
    setError('');

    try {
      const res = await csrfFetch('/api/services/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, status }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) throw new Error(data?.error || text || 'Unable to update this inquiry.');

      await loadInquiries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this inquiry.');
    } finally {
      setActionLoading('');
    }
  }

  async function updateAvailability(nextAvailable: boolean) {
    setActionLoading('availability');
    setError('');

    try {
      const res = await csrfFetch('/api/services/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextAvailable }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok || !data?.provider) {
        throw new Error(data?.message || text || 'Unable to update availability.');
      }

      setProvider((current) => current ? { ...current, isAvailable: nextAvailable } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update availability.');
    } finally {
      setActionLoading('');
    }
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    setActionLoading('booking-' + bookingId);
    setError('');

    try {
      const res = await csrfFetch('/api/services/bookings/' + bookingId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) {
        throw new Error(data?.message || text || 'Unable to update the booking.');
      }

      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update the booking.');
    } finally {
      setActionLoading('');
    }
  }

  async function uploadImage(file: File) {
    const presignRes = await fetch('/api/uploads/presign', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });
    const presign = await readResponse(presignRes);

    if (presignRes.status === 401) {
      redirectToLogin();
      return null;
    }
    if (!presignRes.ok) {
      throw new Error(presign.data?.error || presign.text || 'Unable to prepare image upload.');
    }

    if (presign.data.useDirectUpload) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', presign.data.key);

      const uploadRes = await fetch('/api/uploads/direct', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
      });
      const upload = await readResponse(uploadRes);

      if (uploadRes.status === 401) {
        redirectToLogin();
        return null;
      }
      if (!uploadRes.ok || !upload.data?.publicUrl) {
        throw new Error(upload.data?.error || upload.text || 'Unable to upload portfolio image.');
      }
      return upload.data.publicUrl as string;
    }

    if (!presign.data.url) throw new Error('Upload URL was not returned.');

    const putRes = await fetch(presign.data.url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!putRes.ok) throw new Error('Unable to upload portfolio image.');

    const verifyRes = await fetch('/api/uploads/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: presign.data.key }),
    });
    const verify = await readResponse(verifyRes);
    if (!verifyRes.ok || !verify.data?.publicUrl) {
      throw new Error(verify.data?.error || verify.text || 'Unable to verify uploaded image.');
    }

    return verify.data.publicUrl as string;
  }

  async function addPortfolioItem() {
    if (!portfolioForm.title.trim() || !portfolioForm.image) {
      setError('Add a title and image before saving portfolio work.');
      return;
    }

    setActionLoading('portfolio');
    setError('');

    try {
      const imageUrl = await uploadImage(portfolioForm.image);
      if (!imageUrl) return;

      const res = await csrfFetch('/api/services/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: portfolioForm.title.trim(),
          description: portfolioForm.description.trim() || undefined,
          category: portfolioForm.category.trim() || undefined,
          imageUrl,
        }),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok || !data?.item) {
        throw new Error(data?.message || text || 'Unable to add portfolio work.');
      }

      setProvider((current) => current ? {
        ...current,
        portfolio: [data.item, ...(current.portfolio || [])],
      } : current);
      setPortfolioForm({ title: '', description: '', category: '', image: null });
      setShowPortfolioModal(false);
      setNotice('Portfolio work added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add portfolio work.');
    } finally {
      setActionLoading('');
    }
  }

  async function deletePortfolioItem(itemId: string) {
    if (!window.confirm('Remove this portfolio item?')) return;

    setActionLoading('portfolio-' + itemId);
    setError('');

    try {
      const res = await csrfFetch('/api/services/portfolio?id=' + encodeURIComponent(itemId), {
        method: 'DELETE',
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok) {
        throw new Error(data?.message || text || 'Unable to remove portfolio item.');
      }

      setProvider((current) => current ? {
        ...current,
        portfolio: current.portfolio.filter((item) => item.id !== itemId),
      } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove portfolio item.');
    } finally {
      setActionLoading('');
    }
  }

  async function saveProfile() {
    setActionLoading('profile');
    setError('');
    setNotice('');

    try {
      const payload = {
        businessName: profileForm.businessName.trim(),
        description: profileForm.description.trim(),
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim(),
        website: profileForm.website.trim() || null,
        city: profileForm.city.trim(),
        area: profileForm.area.trim() || null,
        priceRange: profileForm.priceRange.trim() || null,
        yearsInBusiness: profileForm.yearsInBusiness ? Number(profileForm.yearsInBusiness) : null,
      };

      const res = await csrfFetch('/api/services/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { text, data } = await readResponse(res);

      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (!res.ok || !data?.provider) {
        throw new Error(data?.message || text || 'Unable to update profile.');
      }

      setProvider((current) => current ? { ...current, ...data.provider } : data.provider);
      syncProfileForm({ ...(provider as ServiceProvider), ...data.provider });
      setNotice('Profile changes saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setActionLoading('');
    }
  }

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString('en-ZM', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) : 'Not recorded';

  const formatTimeAgo = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return date.toLocaleDateString('en-ZM');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="h-32 animate-pulse border border-slate-200 bg-white" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse border border-slate-200 bg-white" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h1 className="text-2xl font-bold">No service provider profile found</h1>
          <p className="mt-2 text-sm text-slate-500">Complete provider registration before opening this workspace.</p>
          <Link href="/services/register" className="mt-5 inline-flex bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
            Register provider profile
          </Link>
        </main>
      </div>
    );
  }

  const tabs: { id: DashboardTab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'leads', label: 'Leads', badge: inquiryCounts.NEW || 0 },
    { id: 'messages', label: 'Messages', badge: totalUnread },
    { id: 'bookings', label: 'Bookings', badge: pendingBookings },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header />

      {notice && (
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800">
          {notice}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!provider.isVerified && (
          <section className={
            'mb-6 border p-5 ' +
            (provider.verificationStatus === 'REJECTED'
              ? 'border-red-200 bg-red-50'
              : 'border-amber-200 bg-amber-50')
          }>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">
                  {provider.verificationStatus === 'REJECTED'
                    ? 'Verification needs attention'
                    : 'Verification is required before marketplace publication'}
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                  {provider.verificationStatus === 'REJECTED' && provider.rejectionReason
                    ? provider.rejectionReason
                    : 'Upload the required documents for admin review. Sensitive documents remain private; customers only see verification status.'}
                </p>
              </div>
              <Link href="/services/verification" className="shrink-0 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                Open verification
              </Link>
            </div>
          </section>
        )}

        {error && (
          <section className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div>{error}</div>
            <button type="button" onClick={loadDashboard} className="mt-3 font-semibold underline underline-offset-4">
              Reload dashboard
            </button>
          </section>
        )}

        <section className="border border-slate-200 bg-white">
          {provider.coverPhotoUrl && (
            <div className="h-36 overflow-hidden border-b border-slate-200 sm:h-44">
              <img src={provider.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xl font-bold text-slate-500">
                {provider.logoUrl || provider.profilePhotoUrl ? (
                  <img src={provider.logoUrl || provider.profilePhotoUrl || ''} alt="" className="h-full w-full object-cover" />
                ) : (
                  provider.businessName.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-[-0.03em]">{provider.businessName}</h1>
                  {provider.isVerified && (
                    <span className="border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {CATEGORY_LABELS[provider.category] || humanize(provider.category)}
                  {' · '}
                  {[provider.area, provider.city].filter(Boolean).join(', ') || 'Location not specified'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Profile completion: {Number(provider.profileCompletion || 0)}%
                  {!provider.isActive ? ' · Not yet visible in the marketplace' : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => updateAvailability(!provider.isAvailable)}
                disabled={actionLoading === 'availability'}
                className={
                  'border px-4 py-2.5 text-sm font-semibold ' +
                  (provider.isAvailable
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-600')
                }
              >
                {actionLoading === 'availability'
                  ? 'Updating…'
                  : provider.isAvailable ? 'Available for work' : 'Not available'}
              </button>

              <Link
                href={'/services/' + provider.id}
                className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                View public profile
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 border-l border-t border-slate-200 bg-white sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Views · 30 days', Number(viewStats?.totalViews || 0)],
            ['New leads', Number(inquiryCounts.NEW || 0)],
            ['Unread messages', totalUnread],
            ['Pending bookings', pendingBookings],
            ['Completed jobs', Number(provider.completedJobs || completedBookings)],
            ['Rating', provider.ratingCount ? Number(provider.ratingAvg || 0).toFixed(1) : 'No reviews'],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-b border-r border-slate-200 p-4">
              <div className="text-xs text-slate-500">{label}</div>
              <div className="mt-2 text-xl font-bold">{value}</div>
            </div>
          ))}
        </section>

        <nav className="mt-6 overflow-x-auto border border-slate-200 bg-white">
          <div className="flex min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  'border-r border-slate-200 px-4 py-3 text-sm font-semibold transition ' +
                  (activeTab === tab.id
                    ? 'bg-slate-950 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50')
                }
              >
                {tab.label}
                {tab.badge ? <span className="ml-2 opacity-75">({tab.badge})</span> : null}
              </button>
            ))}
          </div>
        </nav>

        <section className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-semibold">Recent leads</h2>
                    <p className="mt-1 text-xs text-slate-500">Latest customer enquiries.</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab('leads')} className="text-sm font-semibold text-blue-700">
                    View all
                  </button>
                </div>
                {inquiries.length ? (
                  <div className="divide-y divide-slate-100">
                    {inquiries.slice(0, 4).map((inquiry) => (
                      <div key={inquiry.id} className="flex items-start justify-between gap-4 px-5 py-4">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{inquiry.customerName}</div>
                          <div className="mt-1 truncate text-sm text-slate-500">{inquiry.serviceNeeded}</div>
                        </div>
                        <span className={'shrink-0 border px-2 py-1 text-xs font-semibold ' + statusClass(inquiry.status)}>
                          {humanize(inquiry.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-8 text-sm text-slate-500">No enquiries recorded yet.</p>
                )}
              </section>

              <section className="border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-semibold">Recent messages</h2>
                    <p className="mt-1 text-xs text-slate-500">Customer conversations that reached your profile.</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab('messages')} className="text-sm font-semibold text-blue-700">
                    Open inbox
                  </button>
                </div>
                {conversations.length ? (
                  <div className="divide-y divide-slate-100">
                    {conversations.slice(0, 4).map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => {
                          setActiveTab('messages');
                          fetchMessages(conversation);
                        }}
                        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{conversation.customerName}</div>
                          <div className="mt-1 truncate text-sm text-slate-500">{conversation.lastMessage || 'No message preview'}</div>
                        </div>
                        {conversation.unreadProvider > 0 && (
                          <span className="shrink-0 bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
                            {conversation.unreadProvider}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-8 text-sm text-slate-500">No customer conversations yet.</p>
                )}
              </section>

              <section className="border border-slate-200 bg-white p-5 lg:col-span-2">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-semibold">Verification and profile readiness</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {provider.documents?.filter((document) => document.isVerified).length || 0} of {provider.documents?.length || 0} uploaded documents are verified.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/services/verification" className="border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">
                      Verification
                    </Link>
                    <button type="button" onClick={() => setActiveTab('profile')} className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
                      Edit profile
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'leads' && (
            <section className="border border-slate-200 bg-white">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold">Leads and enquiries</h2>
                  <p className="mt-1 text-sm text-slate-500">Track real customer enquiries from first contact to closed work.</p>
                </div>
                <select
                  value={selectedInquiryStatus}
                  onChange={(e) => setSelectedInquiryStatus(e.target.value)}
                  className="h-10 border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="ALL">All statuses</option>
                  {INQUIRY_STATUSES.map((status) => (
                    <option key={status} value={status}>{humanize(status)}</option>
                  ))}
                </select>
              </div>

              {visibleInquiries.length ? (
                <div className="divide-y divide-slate-100">
                  {visibleInquiries.map((inquiry) => (
                    <article key={inquiry.id} className="p-5">
                      <div className="flex flex-col justify-between gap-4 lg:flex-row">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{inquiry.customerName}</h3>
                            <span className={'border px-2 py-1 text-xs font-semibold ' + statusClass(inquiry.status)}>
                              {humanize(inquiry.status)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span>{inquiry.serviceNeeded}</span>
                            {inquiry.city && <span>{inquiry.city}</span>}
                            <span>{formatDate(inquiry.createdAt)}</span>
                          </div>
                          {inquiry.description && (
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{inquiry.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            {inquiry.budget && <span>Budget: {inquiry.budget}</span>}
                            {inquiry.preferredDate && <span>Preferred: {formatDate(inquiry.preferredDate)}</span>}
                            {inquiry.propertyAddress && <span>Address: {inquiry.propertyAddress}</span>}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <div className="flex flex-wrap gap-2 lg:max-w-[280px] lg:justify-end">
                            {inquiry.customerPhone && (
                              <a href={'tel:' + inquiry.customerPhone} className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                                Call
                              </a>
                            )}
                            {inquiry.customerEmail && (
                              <a href={'mailto:' + inquiry.customerEmail} className="border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                                Email
                              </a>
                            )}
                            {INQUIRY_STATUSES.filter((status) => status !== inquiry.status).map((status) => (
                              <button
                                key={status}
                                type="button"
                                disabled={actionLoading === 'inquiry-' + inquiry.id}
                                onClick={() => updateInquiryStatus(inquiry.id, status)}
                                className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                              >
                                {humanize(status)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-sm text-slate-500">No enquiries match this status.</div>
              )}
            </section>
          )}

          {activeTab === 'messages' && (
            <section className="grid min-h-[560px] overflow-hidden border border-slate-200 bg-white lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
                <div className="border-b border-slate-200 px-4 py-3 font-semibold">Conversations</div>
                <div className="max-h-[560px] overflow-y-auto">
                  {conversations.length ? conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => fetchMessages(conversation)}
                      className={
                        'block w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ' +
                        (activeConversation?.id === conversation.id ? 'bg-slate-50' : '')
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold">{conversation.customerName}</span>
                        {conversation.unreadProvider > 0 && (
                          <span className="bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{conversation.unreadProvider}</span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-500">{conversation.lastMessage || 'No preview'}</div>
                      <div className="mt-1 text-xs text-slate-400">{formatTimeAgo(conversation.lastMessageAt)}</div>
                    </button>
                  )) : (
                    <div className="p-6 text-sm text-slate-500">No conversations yet.</div>
                  )}
                </div>
              </div>

              <div className="flex min-h-[420px] flex-col">
                {activeConversation ? (
                  <>
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-4">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{activeConversation.customerName}</div>
                        <div className="mt-1 truncate text-xs text-slate-500">
                          {activeConversation.customerPhone || activeConversation.customerEmail || 'Customer contact not provided'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {activeConversation.customerPhone && (
                          <a href={'tel:' + activeConversation.customerPhone} className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                            Call
                          </a>
                        )}
                        {activeConversation.customerPhone && (
                          <a
                            href={'https://wa.me/' + activeConversation.customerPhone.replace(/[^0-9]/g, '')}
                            target="_blank"
                            rel="noreferrer"
                            className="border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                      {actionLoading === 'conversation' && !messages.length ? (
                        <div className="text-sm text-slate-500">Loading messages…</div>
                      ) : messages.length ? messages.map((message) => (
                        <div key={message.id} className={message.senderType === 'PROVIDER' ? 'flex justify-end' : 'flex justify-start'}>
                          <div className={
                            'max-w-[85%] px-4 py-3 text-sm sm:max-w-[70%] ' +
                            (message.senderType === 'PROVIDER'
                              ? 'bg-slate-950 text-white'
                              : 'bg-slate-100 text-slate-900')
                          }>
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            <div className={'mt-1 text-xs ' + (message.senderType === 'PROVIDER' ? 'text-slate-300' : 'text-slate-400')}>
                              {formatTimeAgo(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-sm text-slate-500">No messages in this conversation.</div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-slate-200 p-4">
                      <div className="flex gap-2">
                        <input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder="Write a message"
                          className="h-11 flex-1 border border-slate-300 px-3 text-sm outline-none focus:border-slate-950"
                        />
                        <button
                          type="button"
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || actionLoading === 'message'}
                          className="bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {actionLoading === 'message' ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
                    Choose a conversation to read and reply.
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'bookings' && (
            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <h2 className="font-semibold">Bookings</h2>
                <p className="mt-1 text-sm text-slate-500">Confirm, complete or cancel real customer booking requests.</p>
              </div>

              {provider.bookings?.length ? (
                <div className="divide-y divide-slate-100">
                  {provider.bookings.map((booking) => (
                    <article key={booking.id} className="p-5">
                      <div className="flex flex-col justify-between gap-4 lg:flex-row">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{booking.customerName || booking.customer?.name || 'Customer'}</h3>
                            <span className={'border px-2 py-1 text-xs font-semibold ' + statusClass(booking.status)}>
                              {humanize(booking.status)}
                            </span>
                          </div>
                          <div className="mt-2 text-sm font-medium text-blue-700">{booking.serviceType}</div>
                          <div className="mt-1 text-sm text-slate-500">Scheduled {formatDate(booking.scheduledAt)}</div>
                          {booking.notes && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">{booking.notes}</p>}
                        </div>

                        <div className="shrink-0 lg:text-right">
                          {booking.estimatedPrice != null && (
                            <div className="font-semibold">Estimate: {money(booking.estimatedPrice)}</div>
                          )}
                          {booking.finalPrice != null && (
                            <div className="mt-1 text-sm text-slate-600">Final: {money(booking.finalPrice)}</div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                            {booking.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={actionLoading === 'booking-' + booking.id}
                                  onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                                  className="bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading === 'booking-' + booking.id}
                                  onClick={() => updateBookingStatus(booking.id, 'CANCELED')}
                                  className="border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {booking.status === 'CONFIRMED' && (
                              <>
                                <button
                                  type="button"
                                  disabled={actionLoading === 'booking-' + booking.id}
                                  onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                                  className="bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  Mark complete
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading === 'booking-' + booking.id}
                                  onClick={() => updateBookingStatus(booking.id, 'CANCELED')}
                                  className="border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-sm text-slate-500">No bookings recorded yet.</div>
              )}
            </section>
          )}

          {activeTab === 'portfolio' && (
            <section className="border border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
                <div>
                  <h2 className="font-semibold">Portfolio</h2>
                  <p className="mt-1 text-sm text-slate-500">Show real work completed by you or your company.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPortfolioModal(true)}
                  className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Add work
                </button>
              </div>

              {provider.portfolio?.length ? (
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {provider.portfolio.map((item) => (
                    <article key={item.id} className="overflow-hidden border border-slate-200">
                      <img src={item.imageUrl} alt={item.title} className="aspect-[4/3] w-full object-cover" />
                      <div className="p-4">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{item.description}</p>}
                        {item.category && <div className="mt-2 text-xs text-slate-400">{item.category}</div>}
                        <button
                          type="button"
                          onClick={() => deletePortfolioItem(item.id)}
                          disabled={actionLoading === 'portfolio-' + item.id}
                          className="mt-4 text-sm font-semibold text-red-700 disabled:opacity-50"
                        >
                          {actionLoading === 'portfolio-' + item.id ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <h3 className="font-semibold">No portfolio work added yet</h3>
                  <p className="mt-2 text-sm text-slate-500">Add real examples of completed work to help customers evaluate your services.</p>
                </div>
              )}
            </section>
          )}

          {activeTab === 'analytics' && (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <section className="border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-5">
                  <h2 className="font-semibold">Profile activity · last 30 days</h2>
                  <p className="mt-1 text-sm text-slate-500">Aggregate viewing activity without exposing visitor contact details.</p>
                </div>
                <div className="grid grid-cols-2 border-b border-slate-200 sm:grid-cols-3">
                  <div className="border-r border-slate-200 p-5">
                    <div className="text-xs text-slate-500">Total views</div>
                    <div className="mt-2 text-2xl font-bold">{Number(viewStats?.totalViews || 0)}</div>
                  </div>
                  <div className="border-r border-slate-200 p-5">
                    <div className="text-xs text-slate-500">Unique signed-in viewers</div>
                    <div className="mt-2 text-2xl font-bold">{Number(viewStats?.uniqueViewers || 0)}</div>
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-slate-500">Recorded search queries</div>
                    <div className="mt-2 text-2xl font-bold">{Number(viewStats?.searchQueries?.length || 0)}</div>
                  </div>
                </div>

                {profileViews.length ? (
                  <div className="divide-y divide-slate-100">
                    {profileViews.slice(0, 30).map((view) => (
                      <div key={view.id} className="flex items-start justify-between gap-4 px-5 py-4">
                        <div>
                          <div className="text-sm font-semibold">Profile view</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {view.source ? 'Source: ' + humanize(view.source) : 'Direct or unknown source'}
                          </div>
                          {view.searchQuery && <div className="mt-1 text-xs text-slate-400">Search: “{view.searchQuery}”</div>}
                        </div>
                        <div className="text-xs text-slate-400">{formatTimeAgo(view.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-sm text-slate-500">No profile views recorded in this period.</div>
                )}
              </section>

              <aside className="h-fit border border-slate-200 bg-white p-5">
                <h2 className="font-semibold">Top search queries</h2>
                <div className="mt-4 space-y-3">
                  {viewStats?.searchQueries?.length ? viewStats.searchQueries.slice(0, 10).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-4 text-sm">
                      <span className="truncate text-slate-600">{item.query || 'Unknown query'}</span>
                      <strong>{Number(item.count || 0)}</strong>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500">No search-query data recorded yet.</p>
                  )}
                </div>
              </aside>
            </div>
          )}

          {activeTab === 'profile' && (
            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 p-5">
                <h2 className="font-semibold">Public profile details</h2>
                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Update customer-facing information here. Verification documents and identity/company records are managed separately.
                </p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Business / professional name
                  <input value={profileForm.businessName} onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Category
                  <input value={CATEGORY_LABELS[provider.category] || humanize(provider.category)} readOnly className="mt-2 h-11 w-full border border-slate-200 bg-slate-50 px-3 text-slate-500" />
                </label>

                <label className="sm:col-span-2 text-sm font-medium text-slate-700">
                  Description
                  <textarea value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} rows={5} className="mt-2 w-full border border-slate-300 p-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Phone
                  <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Email
                  <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Website
                  <input value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} placeholder="https://..." className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Price range
                  <input value={profileForm.priceRange} onChange={(e) => setProfileForm({ ...profileForm, priceRange: e.target.value })} placeholder="e.g. K500–K2,000" className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  City
                  <input value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Area
                  <input value={profileForm.area} onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Years in business / trade
                  <input type="number" min="0" value={profileForm.yearsInBusiness} onChange={(e) => setProfileForm({ ...profileForm, yearsInBusiness: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 px-3" />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={actionLoading === 'profile' || !profileForm.businessName.trim() || !profileForm.phone.trim() || !profileForm.email.trim() || !profileForm.city.trim()}
                    className="h-11 w-full bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {actionLoading === 'profile' ? 'Saving…' : 'Save profile changes'}
                  </button>
                </div>
              </div>
            </section>
          )}
        </section>
      </main>

      {showPortfolioModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Add portfolio work</h2>
                <p className="mt-1 text-sm text-slate-500">Use a real photo from completed work.</p>
              </div>
              <button type="button" onClick={() => setShowPortfolioModal(false)} className="text-sm font-semibold text-slate-500">
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Title
                <input value={portfolioForm.title} onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })} className="mt-2 h-11 w-full border border-slate-300 px-3" />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea value={portfolioForm.description} onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })} rows={4} className="mt-2 w-full border border-slate-300 p-3" />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Category / type of work
                <input value={portfolioForm.category} onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })} placeholder="e.g. CCTV installation" className="mt-2 h-11 w-full border border-slate-300 px-3" />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Project image
                <input type="file" accept="image/*" onChange={(e) => setPortfolioForm({ ...portfolioForm, image: e.target.files?.[0] || null })} className="mt-2 block w-full border border-slate-300 p-3 text-sm" />
              </label>

              <button
                type="button"
                onClick={addPortfolioItem}
                disabled={actionLoading === 'portfolio' || !portfolioForm.title.trim() || !portfolioForm.image}
                className="w-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {actionLoading === 'portfolio' ? 'Uploading…' : 'Add portfolio work'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServiceProviderDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <ServiceProviderDashboardContent />
    </Suspense>
  );
}
