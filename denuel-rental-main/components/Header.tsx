'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSettings } from '@/lib/SettingsContext';

const nav = [
  ['Buy', '/buy'], ['Rent', '/rent'], ['Land', '/land'], ['Commercial', '/commercial'], ['Agents', '/agents'], ['Services', '/services'], ['Market Insights', '/market']
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { settings } = useSettings();

  useEffect(() => { fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => d?.user && setUser(d.user)).catch(() => null); }, []);
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/'; };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-slate-950">
          {settings.logoUrl ? <img src={settings.logoUrl} alt={settings.siteName} className="h-8 max-w-[150px] object-contain" /> : <><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">D</span><span className="text-xl">{settings.siteName || 'DENUEL'}</span></>}
        </Link>
        <nav className="hidden items-center gap-1 xl:flex">
          {user?.role !== 'ADMIN' && nav.map(([label, href]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950">{label}</Link>)}
          {user?.role === 'ADMIN' && <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700">Admin</Link>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user && user.role !== 'ADMIN' && <Link href="/favorites" className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Saved</Link>}
          {user ? <><Link href={user.role === 'ADMIN' ? '/admin' : '/dashboard'} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Dashboard</Link><button onClick={logout} className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600">Sign out</button></> : <Link href="/auth/login" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700">Sign in</Link>}
          {user?.role !== 'ADMIN' && <Link href="/dashboard/properties/new" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">List property</Link>}
        </div>
        <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 md:hidden" aria-label="Open menu"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      </div>
      {open && <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden"><div className="grid grid-cols-2 gap-2">{nav.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} href={href} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{label}</Link>)}</div><div className="mt-3 grid gap-2"><Link href="/dashboard/properties/new" className="rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white">List property</Link><Link href={user ? '/dashboard' : '/auth/login'} className="rounded-xl border border-slate-200 px-4 py-3 text-center font-semibold text-slate-800">{user ? 'Dashboard' : 'Sign in'}</Link></div></div>}
    </header>
  );
}
