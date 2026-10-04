'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-ZM', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AgentClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/agent/dashboard')
      .then(async (response) => {
        if (response.status === 401) {
          window.location.href = '/auth/login?redirect=/agent/clients';
          return null;
        }
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to load clients.');
        return data;
      })
      .then((data) => {
        if (data) setClients(Array.isArray(data.clients) ? data.clients : []);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load clients.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((client) =>
      [client.name, client.email, client.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [clients, query]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="border-b border-slate-200 pb-6">
          <Link href="/agent" className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]">← Agent dashboard</Link>
          <div className="mt-4 text-sm font-semibold text-[#16A34A]">Real client activity</div>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">Clients</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            This list is derived only from real enquiries, applications, viewings and leases on properties you manage.
          </p>
        </div>

        <section className="mt-7 border border-slate-200 bg-white p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search client name, email or phone"
            className="h-11 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#16A34A]"
          />
        </section>

        {error && <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="mt-6 h-72 animate-pulse border border-slate-200 bg-white" />
        ) : clients.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">No client activity yet</h2>
            <p className="mt-2 text-sm text-slate-500">Clients will appear when real users interact with your listings.</p>
          </section>
        ) : filtered.length === 0 ? (
          <div className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">No client matches your search.</div>
        ) : (
          <section className="mt-6 overflow-x-auto border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Applications</th>
                  <th className="px-5 py-3 font-semibold">Viewings</th>
                  <th className="px-5 py-3 font-semibold">Conversations</th>
                  <th className="px-5 py-3 font-semibold">Leases</th>
                  <th className="px-5 py-3 font-semibold">Latest activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((client) => (
                  <tr key={client.id}>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-950">{client.name || client.email || 'Client'}</div>
                      <div className="mt-1 text-xs text-slate-500">{[client.email, client.phone].filter(Boolean).join(' · ')}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        {client.isIdVerified && <span className="bg-emerald-50 px-2 py-1 text-emerald-700">ID verified</span>}
                        {client.isPhoneVerified && <span className="bg-emerald-50 px-2 py-1 text-emerald-700">Phone verified</span>}
                        {client.isEmailVerified && <span className="bg-emerald-50 px-2 py-1 text-emerald-700">Email verified</span>}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold">{client.applications}</td>
                    <td className="px-5 py-4 font-semibold">{client.viewings}</td>
                    <td className="px-5 py-4 font-semibold">{client.conversations}</td>
                    <td className="px-5 py-4 font-semibold">{client.leases}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDateTime(client.lastActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
