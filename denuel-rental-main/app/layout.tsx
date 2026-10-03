import '../styles/globals.css';
import React from 'react';
import NotificationsToast from '../components/NotificationsToast';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import { SettingsProvider } from '../lib/SettingsContext';

export const metadata = {
  title: 'DENUEL | Zambia Property & Living Platform',
  description: 'Find, verify, rent, buy and manage property across Zambia.',
  keywords: 'Zambia property, Lusaka rentals, land for sale Zambia, commercial property Zambia, houses for rent, real estate Zambia',
  openGraph: { title: 'DENUEL | Zambia Property & Living Platform', description: 'Find, verify, rent, buy and manage property across Zambia.', type: 'website' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className="scroll-smooth"><body className="antialiased text-slate-950 bg-white"><SettingsProvider><div className="min-h-screen flex flex-col"><main className="flex-grow">{children}</main><Footer /><NotificationsToast /><BackToTop /></div></SettingsProvider></body></html>;
}
