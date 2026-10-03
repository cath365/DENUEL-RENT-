'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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

interface SettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
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
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings({ ...defaultSettings, ...data.settings });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Apply CSS variables when settings change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', settings.secondaryColor);
      document.documentElement.style.setProperty('--color-accent', settings.accentColor);
      document.documentElement.style.setProperty('--color-header-bg', settings.headerBgColor);
      document.documentElement.style.setProperty('--color-footer-bg', settings.footerBgColor);
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
