'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

function money(value: unknown) {
  return 'K' + Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

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

function counterpartName(item: any) {
  return (
    item?.counterpart?.companyName ||
    item?.counterpart?.name ||
    'Property contact'
  );
}

export default function InquiriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [viewer, setViewer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/inquiries');

      if (response.status === 401) {
        window.location.href = '/auth/login?redirect=/inquiries';
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to load your property conversations.'
        );
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      setViewer(data.viewer || null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load your property conversations.'
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((item) => {
      const property = item.property || {};
      const counterpart = counterpartName(item);

      return [
        property.title,
        property.city,
        property.area,
        counterpart,
        item.lastMessage?.body,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [items, query]);

  const unreadTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0),
    [items]
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
          <div>
            <div className="text-sm font-semibold text-[#16A34A]">
              Property conversations
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950">
              Messages
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Real conversations connected to properties you enquired about or manage.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/renter-hub"
              className="border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
            >
              Renter Hub
            </Link>
            <Link
              href="/rent"
              className="bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Browse properties
            </Link>
          </div>
        </div>

        <section className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-3">
          {[
            ['Conversations', items.length],
            ['Unread messages', unreadTotal],
            ['Account role', viewer?.role || '—'],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="border-b border-r border-slate-200 bg-white p-5"
            >
              <div className="text-sm text-slate-500">{label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
            </div>
          ))}
        </section>

        <div className="mt-6">
          <label className="sr-only" htmlFor="conversation-search">
            Search conversations
          </label>
          <input
            id="conversation-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search property, area, person or message"
            className="h-12 w-full border border-slate-300 bg-white px-4 text-sm outline-none focus:border-[#16A34A]"
          />
        </div>

        {error && (
          <div className="mt-6 border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-800">
              Messages are temporarily unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-red-700">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-4 bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="mt-6 h-72 animate-pulse border border-slate-200 bg-white" />
        ) : items.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-10">
            <h2 className="text-xl font-semibold text-slate-950">
              No property conversations yet
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Your inbox starts empty. A conversation appears only after you send
              or receive a real property enquiry.
            </p>
            <Link
              href="/rent"
              className="mt-5 inline-flex bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Find a property
            </Link>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 border border-slate-200 bg-white p-8 text-sm text-slate-500">
            No conversation matches your search.
          </section>
        ) : (
          <section className="mt-6 divide-y divide-slate-100 border border-slate-200 bg-white">
            {filtered.map((item) => {
              const property = item.property || {};
              const image = property.images?.[0]?.url;
              const isRent = property.listingType === 'RENT';
              const unread = Number(item.unreadCount || 0);

              return (
                <Link
                  key={item.id}
                  href={'/inquiries/' + item.id}
                  className="grid gap-4 p-4 transition hover:bg-slate-50 sm:grid-cols-[110px_minmax(0,1fr)_190px] sm:items-center sm:p-5"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={property.title || ''}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-slate-950">
                        {property.title || 'Property conversation'}
                      </h2>

                      {unread > 0 && (
                        <span className="bg-[#16A34A] px-2 py-0.5 text-xs font-semibold text-white">
                          {unread} unread
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {counterpartName(item)}
                      {property.city ? ' · ' + [property.area, property.city].filter(Boolean).join(', ') : ''}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span>
                        {money(property.price)}
                        {isRent ? ' / month' : ''}
                      </span>
                      <span>{item.messageCount} messages</span>
                    </div>

                    {item.lastMessage?.body && (
                      <p
                        className={`mt-3 line-clamp-2 text-sm ${
                          unread > 0 ? 'font-medium text-slate-800' : 'text-slate-500'
                        }`}
                      >
                        {item.lastMessage.body}
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <div className="text-xs text-slate-400">
                      {formatDateTime(item.lastMessageAt)}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-[#16A34A]">
                      Open conversation →
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
