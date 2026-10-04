'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

const cities = ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe', 'Solwezi'];
const specialties = [
  ['RESIDENTIAL_SALES', 'Residential sales'],
  ['RESIDENTIAL_RENTALS', 'Residential rentals'],
  ['COMMERCIAL', 'Commercial'],
  ['INVESTMENT', 'Investment property'],
  ['RELOCATION', 'Relocation'],
];

function AgentsContent() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [verified, setVerified] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const p = new URLSearchParams();
    if (city) p.set('city', city);
    if (specialty) p.set('specialty', specialty);
    if (verified) p.set('verified', 'true');
    p.set('sortBy', sortBy);
    p.set('limit', '30');

    setLoading(true);
    fetch('/api/agents/profile?' + p.toString())
      .then((r) => r.json())
      .then((data) => {
        setAgents(Array.isArray(data.agents) ? data.agents : []);
        setTotal(Number(data.pagination?.total || 0));
      })
      .catch(() => {
        setAgents([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [city, specialty, verified, sortBy]);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">Real estate agents</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Find agents by area, specialty, experience and verification status.
          </p>

          <div className="mt-7 grid gap-2 border border-slate-300 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
            <select value={city} onChange={(e) => setCity(e.target.value)} className="h-11 border border-slate-300 px-3 text-sm">
              <option value="">All cities</option>
              {cities.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="h-11 border border-slate-300 px-3 text-sm">
              <option value="">All specialties</option>
              {specialties.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-11 border border-slate-300 px-3 text-sm">
              <option value="rating">Highest rated</option>
              <option value="reviews">Most reviewed</option>
              <option value="sales">Most sales</option>
              <option value="experience">Most experience</option>
            </select>
            <label className="flex h-11 items-center gap-2 border border-slate-300 px-3 text-sm text-slate-700">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} />
              Verified only
            </label>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{loading ? 'Loading agents…' : total + ' agents'}</div>
            <div className="mt-1 text-sm text-slate-500">Profiles available on DENUEL</div>
          </div>
          <Link href="/auth/register?role=AGENT" className="bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">
            Join as an agent
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 animate-pulse border border-slate-200 bg-slate-100" />)}
          </div>
        ) : agents.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Link key={agent.id} href={'/agents/' + agent.id} className="border border-slate-200 bg-white p-5 transition hover:border-slate-400">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    {agent.profilePhotoUrl ? (
                      <img src={agent.profilePhotoUrl} alt={agent.user?.name || 'Agent'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
                        {(agent.user?.name || 'A').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-semibold text-slate-950">{agent.user?.name || 'Agent'}</h2>
                      {agent.isVerified && <span className="text-xs font-semibold text-blue-700">Verified</span>}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {Number(agent.ratingAvg || 0).toFixed(1)} rating · {agent.ratingCount || 0} reviews
                    </div>
                    {agent.yearsExperience ? <div className="mt-1 text-sm text-slate-500">{agent.yearsExperience} years experience</div> : null}
                  </div>
                </div>

                {agent.bio && <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{agent.bio}</p>}

                <div className="mt-4 grid grid-cols-3 border-t border-slate-100 pt-4 text-sm">
                  <div><div className="font-semibold text-slate-950">{agent.totalSales || 0}</div><div className="text-xs text-slate-500">Sales</div></div>
                  <div><div className="font-semibold text-slate-950">{agent.totalRentals || 0}</div><div className="text-xs text-slate-500">Rentals</div></div>
                  <div><div className="font-semibold text-slate-950">{agent.responseTimeHours ? Math.round(agent.responseTimeHours) + 'h' : '—'}</div><div className="text-xs text-slate-500">Response</div></div>
                </div>

                {Array.isArray(agent.areasServed) && agent.areasServed.length > 0 && (
                  <p className="mt-4 text-xs text-slate-500">Areas: {agent.areasServed.slice(0, 4).join(', ')}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-slate-200 bg-slate-50 p-10">
            <h2 className="text-xl font-semibold">No agents match these filters</h2>
            <p className="mt-2 text-sm text-slate-500">Try another city or remove a filter.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AgentsPage() {
  return <Suspense fallback={<div className="min-h-screen bg-white" />}><AgentsContent /></Suspense>;
}
