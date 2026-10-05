'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSettings } from '@/lib/SettingsContext';

const nav = [
  ['Buy', '/buy'],
  ['Rent', '/rent'],
  ['Land', '/land'],
  ['Commercial', '/commercial'],
  ['Agents', '/agents'],
  ['Services', '/services'],
  ['Market', '/market'],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { settings } = useSettings();

  const dashboardHref =
    user?.role === 'ADMIN' ? '/admin'
      : user?.role === 'DRIVER' ? '/driver'
        : user?.role === 'SERVICE_PROVIDER' ? '/services/dashboard'
          : user?.role === 'LANDLORD' || user?.role === 'AGENT' ? '/dashboard/properties'
            : '/dashboard';

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user && setUser(d.user))
      .catch(() => null);
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.siteName}
              className="h-8 max-w-[150px] object-contain"
            />
          ) : (
            <>
              <span className="flex h-8 w-8 items-center justify-center bg-slate-950 text-sm font-bold text-white">
                D
              </span>
              <span className="text-[19px] font-bold tracking-[-0.03em] text-slate-950">
                {settings.siteName || 'DENUEL'}
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {user?.role !== 'ADMIN' &&
            nav.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                {label}
              </Link>
            ))}
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className="text-sm font-medium text-slate-700">
              Admin
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {user && user.role !== 'ADMIN' && (
            <Link href="/favorites" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              Saved
            </Link>
          )}

          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="text-sm font-medium text-slate-700 hover:text-slate-950"
              >
                Dashboard
              </Link>
              <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-slate-950">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="text-sm font-medium text-slate-700 hover:text-slate-950">
              Sign in
            </Link>
          )}

          {user?.role !== 'ADMIN' && (
            <Link
              href="/dashboard/properties/new"
              className="border border-slate-950 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              List a property
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center border border-slate-200 text-slate-800 md:hidden"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-5 md:hidden">
          <div className="grid gap-1">
            {nav.map(([label, href]) => (
              <Link
                onClick={() => setOpen(false)}
                key={href}
                href={href}
                className="border-b border-slate-100 px-1 py-3 text-sm font-medium text-slate-800"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-5 grid gap-2">
            <Link
              href="/dashboard/properties/new"
              className="bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              List a property
            </Link>
            <Link
              href={user ? dashboardHref : '/auth/login'}
              className="border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800"
            >
              {user ? 'Dashboard' : 'Sign in'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
