'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

const cities = ['Lusaka', 'Kitwe', 'Ndola', 'Livingstone', 'Kabwe', 'Solwezi'];
const specialties = [
  ['RESIDENTIAL_SALES', 'Residential sales'],
  ['RESIDENTIAL_RENTALS', 'Residential rentals'],
  ['COMMERCIAL', 'Commercial'],
  ['LUXURY', 'Luxury homes'],
  ['FIRST_TIME_BUYERS', 'First-time buyers'],
  ['INVESTMENT', 'Investment property'],
  ['RELOCATION', 'Relocation'],
  ['NEW_CONSTRUCTION', 'New construction'],
];

function AgentsContent() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [verified, setVerified] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (specialty) params.set('specialty', specialty);
    if (verified) params.set('verified', 'true');
    params.set('sortBy', sortBy);
    params.set('limit', '30');

    setLoading(true);
    setError('');

    fetch('/api/agents/profile?' + params.toString())
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || 'Unable to load agents.');
        }
        setAgents(Array.isArray(data.agents) ? data.agents : []);
        setTotal(Number(data.pagination?.total || 0));
      })
      .catch((loadError) => {
        setAgents([]);
        setTotal(0);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load agents.'
        );
      })
      .finally(() => setLoading(false));
  }, [city, specialty, verified, sortBy]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="text-sm font-semibold text-[#16A34A]">Property professionals</div>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            Real estate agents
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Find Ng&apos;anda agents by service area, specialty, experience and real account verification signals.
          </p>

          <div className="mt-7 grid gap-2 border border-slate-300 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="h-11 border border-slate-300 px-3 text-sm"
            >
              <option value="">All cities</option>
              {cities.map((item) => <option key={item}>{item}</option>)}
            </select>

            <select
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              className="h-11 border border-slate-300 px-3 text-sm"
            >
              <option value="">All specialties</option>
              {specialties.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-11 border border-slate-300 px-3 text-sm"
            >
              <option value="rating">Highest rated</option>
              <option value="reviews">Most reviewed</option>
              <option value="experience">Most experience</option>
              <option value="newest">Newest profiles</option>
            </select>

            <label className="flex h-11 items-center gap-2 border border-slate-300 px-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={verified}
                onChange={(event) => setVerified(event.target.checked)}
              />
              Identity/business verified
            </label>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="text-lg font-semibold text-slate-950">
              {loading ? 'Loading agents…' : total + ' agent profiles'}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Only profiles actually created by agent accounts appear here.
            </div>
          </div>

          <Link
            href="/auth/register"
            className="w-fit bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Join as an agent
          </Link>
        </div>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse border border-slate-200 bg-white" />
            ))}
          </div>
        ) : agents.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => {
              const accountVerified =
                Boolean(agent.user?.isIdVerified) ||
                Boolean(agent.user?.isBusinessVerified);

              return (
                <Link
                  key={agent.id}
                  href={'/agents/' + agent.id}
                  className="border border-slate-200 bg-white p-5 transition hover:border-slate-400"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
                      {agent.profilePhotoUrl ? (
                        <img
                          src={agent.profilePhotoUrl}
                          alt={agent.user?.name || 'Agent'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-500">
                          {(agent.user?.name || 'A').charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-950">
                          {agent.user?.companyName || agent.user?.name || 'Agent'}
                        </h2>
                        {accountVerified && (
                          <span className="bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                            Verified account
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {agent.ratingCount
                          ? Number(agent.ratingAvg || 0).toFixed(1) + '/5 · ' + agent.ratingCount + ' reviews'
                          : 'No reviews yet'}
                      </div>

                      {agent.yearsExperience != null && (
                        <div className="mt-1 text-sm text-slate-500">
                          {agent.yearsExperience} years experience
                        </div>
                      )}
                    </div>
                  </div>

                  {agent.bio && (
                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                      {agent.bio}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 border-l border-t border-slate-200">
                    <div className="border-b border-r border-slate-200 p-3">
                      <div className="font-semibold text-slate-950">
                        {Number(agent.approvedListingCount || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">Approved listings</div>
                    </div>
                    <div className="border-b border-r border-slate-200 p-3">
                      <div className="font-semibold text-slate-950">
                        {Math.round(Number(agent.user?.trustScore || 0))}/100
                      </div>
                      <div className="text-xs text-slate-500">Trust score</div>
                    </div>
                  </div>

                  {Array.isArray(agent.areasServed) && agent.areasServed.length > 0 && (
                    <p className="mt-4 text-xs text-slate-500">
                      Areas: {agent.areasServed.slice(0, 4).join(', ')}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">No agents match these filters</h2>
            <p className="mt-2 text-sm text-slate-500">Try another city, specialty or verification filter.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA]" />}>
      <AgentsContent />
    </Suspense>
  );
}
