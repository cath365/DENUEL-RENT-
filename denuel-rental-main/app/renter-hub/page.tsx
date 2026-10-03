'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

export default function RenterHub() {
  const [applications, setApplications] = useState<any[]>([]);
  const [leases, setLeases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/applications'),
      fetch('/api/landlord/leases'),
      fetch('/api/landlord/rent-payments?role=tenant'),
    ])
      .then(async ([a, l, p]) => {
        if (a.ok) {
          const data = await a.json();
          setApplications(Array.isArray(data) ? data : []);
        }
        if (l.ok) {
          const data = await l.json();
          setLeases(Array.isArray(data) ? data.filter((x: any) => x.tenant) : []);
        }
        if (p.ok) {
          const data = await p.json();
          setPayments(Array.isArray(data.payments) ? data.payments : []);
        }
      })
      .catch((err) => {
        console.error('Renter hub error', err);
        setError('Some renter data could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingPayments = payments.filter((p: any) => p.status === 'PENDING');
  const activeLeases = leases.filter((l: any) => l.status === 'ACTIVE');

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <section className="bg-slate-950 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-blue-300">My home</p>
          <h1 className="mt-2 text-4xl font-black">Renter Hub</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Keep your property search, applications, lease information, payments and support in one place.</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {error && <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="text-sm text-slate-500">Applications</div><div className="mt-2 text-3xl font-black">{loading ? '—' : applications.length}</div></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="text-sm text-slate-500">Active leases</div><div className="mt-2 text-3xl font-black">{loading ? '—' : activeLeases.length}</div></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><div className="text-sm text-slate-500">Pending rent payments</div><div className="mt-2 text-3xl font-black">{loading ? '—' : pendingPayments.length}</div></div>
          <Link href="/rent" className="rounded-3xl bg-blue-600 p-6 text-white shadow-sm"><div className="text-sm text-blue-100">Still looking?</div><div className="mt-2 text-xl font-black">Find another property →</div></Link>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-black">Your rental tools</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              ['Saved properties', 'Return to homes you have shortlisted.', '/favorites', '♡'],
              ['Saved searches', 'Manage searches and property alerts.', '/saved-search', '⌕'],
              ['Rent payment', 'Pay rent and review payment information.', '/rent-payment', 'K'],
              ['Applications', 'Track the applications you have submitted.', '#applications', '✓'],
              ['My inquiries', 'Continue conversations about properties.', '/inquiries', '✉'],
              ['Notifications', 'See property, payment and account updates.', '/notifications', '•'],
              ['Budget calculator', 'Check what monthly rent fits your budget.', '/business-tools/budget-calculator', '='],
              ['Renter guide', 'Understand inspections, deposits and renting safely.', '/renters-guide', '?'],
              ['Safety centre', 'Learn how to reduce scam and payment risk.', '/safety-tips', '!'],
            ].map(([title, desc, href, icon]) => (
              <Link href={href} key={title} className="group rounded-3xl border border-slate-200 bg-white p-6 hover:border-blue-300 hover:shadow-lg">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 font-black text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700">{icon}</div>
                <h3 className="mt-5 font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="applications" className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">Applications</h2><Link href="/rent" className="text-sm font-bold text-blue-600">Find properties</Link></div>
            <div className="mt-5 space-y-3">
              {loading ? <p className="text-sm text-slate-500">Loading applications…</p> : applications.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">No applications yet.</p> : applications.slice(0, 6).map((app: any) => <div key={app.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-bold">{app.property?.title || 'Property application'}</div><div className="mt-1 text-xs text-slate-500">{app.appliedAt ? `Applied ${new Date(app.appliedAt).toLocaleDateString('en-ZM')}` : 'Application submitted'}</div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{app.status}</span></div></div>)}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between"><h2 className="text-xl font-black">Lease & payments</h2><Link href="/rent-payment" className="text-sm font-bold text-blue-600">Payment centre</Link></div>
            <div className="mt-5 space-y-3">
              {loading ? <p className="text-sm text-slate-500">Loading lease information…</p> : activeLeases.length === 0 && pendingPayments.length === 0 ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">No active lease or pending rent payment is recorded yet.</p> : <>
                {activeLeases.slice(0, 3).map((lease: any) => <div key={lease.id} className="rounded-2xl bg-emerald-50 p-4"><div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Active lease</div><div className="mt-1 font-bold text-slate-950">{lease.property?.title || 'Property'}</div><div className="mt-1 text-sm text-slate-600">K{Number(lease.monthlyRent || 0).toLocaleString()} / month</div></div>)}
                {pendingPayments.slice(0, 3).map((payment: any) => <div key={payment.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><div className="flex justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wider text-amber-700">Rent due</div><div className="mt-1 text-sm text-slate-600">{new Date(payment.dueDate).toLocaleDateString('en-ZM')}</div></div><div className="text-lg font-black">K{Number(payment.amount || 0).toLocaleString()}</div></div></div>)}
              </>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
