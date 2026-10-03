'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/lib/SettingsContext';
import { csrfFetch } from '@/lib/csrf';

// Helper function to safely extract error message from any error type
function getErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    // Handle standard Error objects
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    // Handle Zod-like error structure (array of issues)
    if ('issues' in error && Array.isArray((error as any).issues)) {
      const issues = (error as any).issues;
      if (issues.length > 0 && issues[0].message) {
        return String(issues[0].message);
      }
    }
    // Handle API response errors
    if ('error' in error) {
      return getErrorMessage((error as any).error, fallback);
    }
  }
  return fallback;
}

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  maxPropertyImages: number;
  maxFileSize: number;
  commissionRate: number;
  minRentPrice: number;
  maxRentPrice: number;
  featuredListingPrice: number;
  enableDriverFeature: boolean;
  enableServicesFeature: boolean;
  enableTransportFeature: boolean;
  // Branding
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerBgColor: string;
  footerBgColor: string;
  // Social Media Links
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
}

interface Ad {
  id: string;
  name: string;
  imageUrl: string;
  linkUrl: string;
  placement: 'homepage-banner' | 'sidebar' | 'listing-page' | 'search-results' | 'footer';
  isActive: boolean;
  impressions: number;
  clicks: number;
  startDate: string;
  endDate: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { refreshSettings: refreshGlobalSettings } = useSettings();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const adImageInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'DENUEL',
    siteDescription: 'Find your perfect rental property in Zambia',
    contactEmail: 'contact@denuel.local',
    contactPhone: '+260700000000',
    supportEmail: 'support@denuel.local',
    currency: 'ZMW',
    timezone: 'Africa/Lusaka',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
    maxPropertyImages: 10,
    maxFileSize: 5,
    commissionRate: 5,
    minRentPrice: 100,
    maxRentPrice: 100000,
    featuredListingPrice: 50,
    enableDriverFeature: true,
    enableServicesFeature: true,
    enableTransportFeature: true,
    // Branding defaults
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6',
    headerBgColor: '#ffffff',
    footerBgColor: '#1f2937',
    // Social Media Links
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    linkedinUrl: '',
    youtubeUrl: '',
    whatsappNumber: '',
  });

  const [ads, setAds] = useState<Ad[]>([
    {
      id: '1',
      name: 'Homepage Banner - Property Showcase',
      imageUrl: '/ads/banner1.jpg',
      linkUrl: 'https://example.com',
      placement: 'homepage-banner',
      isActive: true,
      impressions: 12450,
      clicks: 342,
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    },
    {
      id: '2',
      name: 'Sidebar Ad - Insurance Partner',
      imageUrl: '/ads/sidebar1.jpg',
      linkUrl: 'https://insurance.example.com',
      placement: 'sidebar',
      isActive: true,
      impressions: 8920,
      clicks: 156,
      startDate: '2026-01-01',
      endDate: '2026-02-28',
    },
  ]);

  const [showAdModal, setShowAdModal] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [newAd, setNewAd] = useState<Partial<Ad>>({
    name: '',
    imageUrl: '',
    linkUrl: '',
    placement: 'homepage-banner',
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  // Load settings and ads from database
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check auth
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        if (authData.user && authData.user.role === 'ADMIN') {
          setUser(authData.user);
        } else {
          router.push('/dashboard');
          return;
        }

        // Load settings
        const settingsRes = await fetch('/api/admin/settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.settings) {
            setSettings(prev => ({ ...prev, ...settingsData.settings }));
          }
        }

        // Load ads
        const adsRes = await fetch('/api/admin/ads');
        if (adsRes.ok) {
          const adsData = await adsRes.json();
          if (adsData.ads) {
            setAds(adsData.ads.map((ad: any) => ({
              ...ad,
              startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
              endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
            })));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const res = await csrfFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(getErrorMessage(errorData, 'Failed to save settings'));
      }
      
      // Refresh global settings so changes apply across the site
      await refreshGlobalSettings();
      
      setMessage({ type: 'success', text: 'Settings saved successfully! Changes will apply across the site.' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to save settings') });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('faviconUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAd(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAd = async () => {
    if (!newAd.name || !newAd.linkUrl) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newAd.name,
          imageUrl: newAd.imageUrl,
          linkUrl: newAd.linkUrl,
          placement: newAd.placement,
          isActive: newAd.isActive,
          startDate: newAd.startDate,
          endDate: newAd.endDate,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Create ad error:', errorData);
        throw new Error(getErrorMessage(errorData, 'Failed to create ad'));
      }
      
      const data = await res.json();
      setAds(prev => [{ ...data.ad, startDate: data.ad.startDate?.split('T')[0] || '', endDate: data.ad.endDate?.split('T')[0] || '' }, ...prev]);
      setShowAdModal(false);
      setNewAd({
        name: '',
        imageUrl: '',
        linkUrl: '',
        placement: 'homepage-banner',
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
      setMessage({ type: 'success', text: 'Ad created successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to create ad') });
    }
  };

  const handleToggleAd = async (id: string) => {
    const ad = ads.find(a => a.id === id);
    if (!ad) return;
    
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(getErrorMessage(errorData, 'Failed to update ad'));
      }
      
      setAds(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to update ad') });
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(getErrorMessage(errorData, 'Failed to delete ad'));
      }
      
      setAds(prev => prev.filter(ad => ad.id !== id));
      setMessage({ type: 'success', text: 'Ad deleted successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to delete ad') });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'branding', label: 'Branding', icon: '🎨' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'listings', label: 'Listings', icon: '🏠' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'features', label: 'Features', icon: '✨' },
    { id: 'ads', label: 'Advertisements', icon: '📢' },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>→</span>
          <Link href="/admin" className="hover:text-blue-600">Admin</Link>
          <span>→</span>
          <span className="text-gray-900 font-medium">Settings</span>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>💾 Save Settings</>
            )}
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {typeof message.text === 'string' ? message.text : String(message.text || 'An error occurred')}
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">General Settings</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => handleChange('siteName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                    <textarea
                      value={settings.siteDescription}
                      onChange={(e) => handleChange('siteDescription', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => handleChange('contactEmail', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                      <input
                        type="tel"
                        value={settings.contactPhone}
                        onChange={(e) => handleChange('contactPhone', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleChange('currency', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="ZMW">ZMW - Zambian Kwacha</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="ZAR">ZAR - South African Rand</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleChange('timezone', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Africa/Lusaka">Africa/Lusaka (CAT)</option>
                        <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Maintenance Mode</span>
                        <p className="text-sm text-gray-500">Enable to show maintenance page to visitors</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.allowRegistration}
                        onChange={(e) => handleChange('allowRegistration', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Allow User Registration</span>
                        <p className="text-sm text-gray-500">Allow new users to create accounts</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requireEmailVerification}
                        onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Require Email Verification</span>
                        <p className="text-sm text-gray-500">Users must verify email before accessing features</p>
                      </div>
                    </label>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium text-gray-900 mb-4">Admin Actions</h3>
                    <div className="flex gap-4">
                      <button className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors">
                        🔄 Clear Cache
                      </button>
                      <button className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors">
                        🚫 Revoke All Sessions
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'listings' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Listing Settings</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Property Images</label>
                      <input
                        type="number"
                        value={settings.maxPropertyImages}
                        onChange={(e) => handleChange('maxPropertyImages', parseInt(e.target.value))}
                        min={1}
                        max={20}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
                      <input
                        type="number"
                        value={settings.maxFileSize}
                        onChange={(e) => handleChange('maxFileSize', parseInt(e.target.value))}
                        min={1}
                        max={20}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Rent Price (ZMW)</label>
                      <input
                        type="number"
                        value={settings.minRentPrice}
                        onChange={(e) => handleChange('minRentPrice', parseInt(e.target.value))}
                        min={0}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Rent Price (ZMW)</label>
                      <input
                        type="number"
                        value={settings.maxRentPrice}
                        onChange={(e) => handleChange('maxRentPrice', parseInt(e.target.value))}
                        min={0}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Settings</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                      <input
                        type="number"
                        value={settings.commissionRate}
                        onChange={(e) => handleChange('commissionRate', parseFloat(e.target.value))}
                        min={0}
                        max={100}
                        step={0.5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">Platform fee on transactions</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Featured Listing Price (ZMW)</label>
                      <input
                        type="number"
                        value={settings.featuredListingPrice}
                        onChange={(e) => handleChange('featuredListingPrice', parseInt(e.target.value))}
                        min={0}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-1">Cost to feature a listing</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium text-gray-900 mb-4">Payment Gateways</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💳</span>
                          <div>
                            <span className="font-medium">MTN Mobile Money</span>
                            <p className="text-sm text-gray-500">Accept MTN MoMo payments</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Active</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📱</span>
                          <div>
                            <span className="font-medium">Airtel Money</span>
                            <p className="text-sm text-gray-500">Accept Airtel Money payments</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Active</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏦</span>
                          <div>
                            <span className="font-medium">Bank Transfer</span>
                            <p className="text-sm text-gray-500">Direct bank transfers</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">Inactive</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'features' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Toggles</h2>
                  <p className="text-gray-600 mb-6">Enable or disable platform features</p>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🚗</span>
                        <div>
                          <span className="font-medium text-gray-900">Driver/Transport Feature</span>
                          <p className="text-sm text-gray-500">Allow users to book property viewing transport</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableDriverFeature}
                        onChange={(e) => handleChange('enableDriverFeature', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔧</span>
                        <div>
                          <span className="font-medium text-gray-900">Services Marketplace</span>
                          <p className="text-sm text-gray-500">Enable home services (cleaners, movers, etc.)</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableServicesFeature}
                        onChange={(e) => handleChange('enableServicesFeature', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🚚</span>
                        <div>
                          <span className="font-medium text-gray-900">Transport Booking</span>
                          <p className="text-sm text-gray-500">Allow transport request bookings</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableTransportFeature}
                        onChange={(e) => handleChange('enableTransportFeature', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'branding' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Branding & Appearance</h2>
                  <p className="text-gray-600 mb-6">Customize the look and feel of your platform</p>
                  
                  {/* Logo Upload */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Site Logo</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {settings.logoUrl ? (
                          <div className="space-y-3">
                            <img src={settings.logoUrl} alt="Logo" className="max-h-20 mx-auto" />
                            <button
                              onClick={() => handleChange('logoUrl', '')}
                              className="text-red-600 text-sm hover:text-red-700"
                            >
                              Remove Logo
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-4xl">🖼️</div>
                            <p className="text-gray-500 text-sm">PNG, JPG or SVG (max 2MB)</p>
                          </div>
                        )}
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Upload Logo
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {settings.faviconUrl ? (
                          <div className="space-y-3">
                            <img src={settings.faviconUrl} alt="Favicon" className="w-16 h-16 mx-auto" />
                            <button
                              onClick={() => handleChange('faviconUrl', '')}
                              className="text-red-600 text-sm hover:text-red-700"
                            >
                              Remove Favicon
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-4xl">⭐</div>
                            <p className="text-gray-500 text-sm">ICO, PNG (32x32 or 64x64)</p>
                          </div>
                        )}
                        <input
                          ref={faviconInputRef}
                          type="file"
                          accept="image/*,.ico"
                          onChange={handleFaviconUpload}
                          className="hidden"
                        />
                        <button
                          onClick={() => faviconInputRef.current?.click()}
                          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Upload Favicon
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Color Scheme */}
                  <div className="pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-4">Color Scheme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.primaryColor}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.primaryColor}
                            onChange={(e) => handleChange('primaryColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.secondaryColor}
                            onChange={(e) => handleChange('secondaryColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.secondaryColor}
                            onChange={(e) => handleChange('secondaryColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={settings.accentColor}
                            onChange={(e) => handleChange('accentColor', e.target.value)}
                            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={settings.accentColor}
                            onChange={(e) => handleChange('accentColor', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Header Background</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.headerBgColor}
                          onChange={(e) => handleChange('headerBgColor', e.target.value)}
                          className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.headerBgColor}
                          onChange={(e) => handleChange('headerBgColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Footer Background</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.footerBgColor}
                          onChange={(e) => handleChange('footerBgColor', e.target.value)}
                          className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.footerBgColor}
                          onChange={(e) => handleChange('footerBgColor', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Media Links */}
                  <div className="pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-4">Social Media Links</h3>
                    <p className="text-sm text-gray-500 mb-4">Add your social media links to display in the footer.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={settings.facebookUrl || ''}
                            onChange={(e) => handleChange('facebookUrl', e.target.value)}
                            placeholder="https://facebook.com/yourpage"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Twitter/X URL</label>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={settings.twitterUrl || ''}
                            onChange={(e) => handleChange('twitterUrl', e.target.value)}
                            placeholder="https://twitter.com/yourhandle"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={settings.instagramUrl || ''}
                            onChange={(e) => handleChange('instagramUrl', e.target.value)}
                            placeholder="https://instagram.com/yourprofile"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={settings.linkedinUrl || ''}
                            onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                            placeholder="https://linkedin.com/company/yourcompany"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </div>
                          <input
                            type="url"
                            value={settings.youtubeUrl || ''}
                            onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                            placeholder="https://youtube.com/@yourchannel"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </div>
                          <input
                            type="tel"
                            value={settings.whatsappNumber || ''}
                            onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                            placeholder="+260971234567"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-4">Preview</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="p-4" style={{ backgroundColor: settings.headerBgColor }}>
                        <div className="flex items-center gap-4">
                          {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="h-8" />
                          ) : (
                            <span className="font-bold text-xl" style={{ color: settings.primaryColor }}>{settings.siteName}</span>
                          )}
                          <div className="flex gap-4 ml-auto">
                            <span style={{ color: settings.primaryColor }}>Home</span>
                            <span style={{ color: settings.primaryColor }}>Rent</span>
                            <span style={{ color: settings.primaryColor }}>Buy</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 bg-gray-50">
                        <button
                          className="px-6 py-2 text-white rounded-lg mr-3"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          Primary Button
                        </button>
                        <button
                          className="px-6 py-2 text-white rounded-lg mr-3"
                          style={{ backgroundColor: settings.secondaryColor }}
                        >
                          Secondary
                        </button>
                        <button
                          className="px-6 py-2 text-white rounded-lg"
                          style={{ backgroundColor: settings.accentColor }}
                        >
                          Accent
                        </button>
                      </div>
                      <div className="p-4 text-white" style={{ backgroundColor: settings.footerBgColor }}>
                        <div className="text-center mb-3">Footer Area</div>
                        <div className="flex justify-center gap-3">
                          {settings.facebookUrl && (
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </div>
                          )}
                          {settings.twitterUrl && (
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </div>
                          )}
                          {settings.instagramUrl && (
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                              </svg>
                            </div>
                          )}
                          {settings.linkedinUrl && (
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ads' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Advertisement Management</h2>
                      <p className="text-gray-600">Create and manage ads displayed across the platform</p>
                    </div>
                    <button
                      onClick={() => setShowAdModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      ➕ Create Ad
                    </button>
                  </div>

                  {/* Ad Stats Overview */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-blue-600 text-sm font-medium">Total Ads</div>
                      <div className="text-2xl font-bold text-blue-900">{ads.length}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-green-600 text-sm font-medium">Active Ads</div>
                      <div className="text-2xl font-bold text-green-900">{ads.filter(a => a.isActive).length}</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-purple-600 text-sm font-medium">Total Impressions</div>
                      <div className="text-2xl font-bold text-purple-900">{ads.reduce((sum, a) => sum + a.impressions, 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-orange-600 text-sm font-medium">Total Clicks</div>
                      <div className="text-2xl font-bold text-orange-900">{ads.reduce((sum, a) => sum + a.clicks, 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Ads List */}
                  <div className="space-y-4">
                    {ads.map(ad => (
                      <div key={ad.id} className="border rounded-lg p-4 flex items-center gap-4">
                        <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {ad.imageUrl ? (
                            <img src={ad.imageUrl} alt={ad.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              📷
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{ad.name}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${ad.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {ad.isActive ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Placement: <span className="capitalize">{ad.placement.replace('-', ' ')}</span>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-600">👁️ {ad.impressions.toLocaleString()} impressions</span>
                            <span className="text-gray-600">🖱️ {ad.clicks.toLocaleString()} clicks</span>
                            <span className="text-gray-600">📊 {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0}% CTR</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleAd(ad.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm ${ad.isActive ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                          >
                            {ad.isActive ? '⏸️ Pause' : '▶️ Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    {ads.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-3">📢</div>
                        <p>No advertisements yet. Create your first ad to get started.</p>
                      </div>
                    )}
                  </div>

                  {/* Ad Placements Info */}
                  <div className="pt-6 border-t">
                    <h3 className="font-medium text-gray-900 mb-4">Available Ad Placements</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium">🏠 Homepage Banner</span>
                        <p className="text-sm text-gray-500 mt-1">Large banner at the top of homepage (1200x300px recommended)</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium">📋 Sidebar</span>
                        <p className="text-sm text-gray-500 mt-1">Vertical ad in sidebar areas (300x600px recommended)</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium">🔍 Search Results</span>
                        <p className="text-sm text-gray-500 mt-1">Between search results (728x90px recommended)</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium">🏡 Listing Page</span>
                        <p className="text-sm text-gray-500 mt-1">On property detail pages (300x250px recommended)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Ad Modal */}
        {showAdModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Create New Advertisement</h3>
                <button onClick={() => setShowAdModal(false)} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad Name *</label>
                  <input
                    type="text"
                    value={newAd.name || ''}
                    onChange={(e) => setNewAd(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Summer Sale Banner"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {newAd.imageUrl ? (
                      <div className="space-y-2">
                        <img src={newAd.imageUrl} alt="Ad preview" className="max-h-32 mx-auto rounded" />
                        <button
                          onClick={() => setNewAd(prev => ({ ...prev, imageUrl: '' }))}
                          className="text-red-600 text-sm hover:text-red-700"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <p className="text-gray-500 text-sm">Click to upload ad image</p>
                      </div>
                    )}
                    <input
                      ref={adImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAdImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => adImageInputRef.current?.click()}
                      className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      Upload Image
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination URL *</label>
                  <input
                    type="url"
                    value={newAd.linkUrl || ''}
                    onChange={(e) => setNewAd(prev => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Placement</label>
                  <select
                    value={newAd.placement || 'homepage-banner'}
                    onChange={(e) => setNewAd(prev => ({ ...prev, placement: e.target.value as Ad['placement'] }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="homepage-banner">Homepage Banner</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="search-results">Search Results</option>
                    <option value="listing-page">Listing Page</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newAd.startDate || ''}
                      onChange={(e) => setNewAd(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={newAd.endDate || ''}
                      onChange={(e) => setNewAd(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAd.isActive ?? true}
                    onChange={(e) => setNewAd(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">Activate immediately</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowAdModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Ad
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
