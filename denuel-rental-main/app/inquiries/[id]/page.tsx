'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { csrfFetch } from '@/lib/csrf';

function formatDateTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('en-ZM', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function money(value: unknown) {
  return 'K' + Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const [thread, setThread] = useState<any>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/inquiries/' + params.id);

      if (response.status === 401) {
        window.location.href =
          '/auth/login?redirect=/inquiries/' + encodeURIComponent(params.id);
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.thread) {
        throw new Error(data.error || 'Unable to load this conversation.');
      }

      setThread(data.thread);
      setViewer(data.viewer || null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this conversation.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  useEffect(() => {
    if (thread?.messages?.length) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [thread?.messages?.length]);

  const property = thread?.property;
  const counterpart = thread?.counterpart;
  const counterpartLabel = useMemo(
    () =>
      counterpart?.companyName ||
      counterpart?.name ||
      'Property contact',
    [counterpart]
  );

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();

    const body = message.trim();
    if (!body || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await csrfFetch('/api/inquiries/' + params.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: body }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href =
          '/auth/login?redirect=/inquiries/' + encodeURIComponent(params.id);
        return;
      }

      if (!response.ok || !data.message) {
        throw new Error(data.error || 'Unable to send your message.');
      }

      setThread((current: any) => ({
        ...current,
        messages: [...(current?.messages || []), data.message],
      }));
      setMessage('');
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'Unable to send your message.'
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="h-[620px] animate-pulse border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  if (!thread || !property) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-800">
              Conversation unavailable
            </h1>
            <p className="mt-2 text-sm leading-6 text-red-700">
              {error || 'This conversation could not be found.'}
            </p>
            <Link
              href="/inquiries"
              className="mt-5 inline-flex bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Back to messages
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isRent = property.listingType === 'RENT';
  const propertyImage = property.images?.[0]?.url;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/inquiries"
            className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]"
          >
            ← Back to messages
          </Link>

          <Link
            href={'/property/' + property.id}
            className="text-sm font-semibold text-[#16A34A]"
          >
            View property
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex min-h-[620px] flex-col border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-slate-100">
                  {counterpart?.profileImage ? (
                    <img
                      src={counterpart.profileImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500">
                      {counterpartLabel.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate font-semibold text-slate-950">
                    {counterpartLabel}
                  </h1>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {property.title}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
              {thread.messages.length === 0 ? (
                <div className="border border-slate-200 bg-white p-6 text-sm text-slate-500">
                  No messages are recorded in this conversation.
                </div>
              ) : (
                thread.messages.map((item: any) => {
                  const mine = item.senderId === viewer?.id;

                  return (
                    <div
                      key={item.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[82%] px-4 py-3 ${
                          mine
                            ? 'bg-[#0F2B46] text-white'
                            : 'border border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        {!mine && (
                          <div className="mb-1 text-xs font-semibold text-[#16A34A]">
                            {item.sender?.companyName ||
                              item.sender?.name ||
                              counterpartLabel}
                          </div>
                        )}

                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {item.body}
                        </p>

                        <div
                          className={`mt-2 text-[11px] ${
                            mine ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          {formatDateTime(item.createdAt)}
                          {mine ? (item.isRead ? ' · Read' : ' · Sent') : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={endRef} />
            </div>

            <form
              onSubmit={sendReply}
              className="border-t border-slate-200 bg-white p-4 sm:p-5"
            >
              {error && (
                <div className="mb-3 border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                  {error}
                </div>
              )}

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                maxLength={1200}
                placeholder="Write a message about this property"
                className="w-full resize-none border border-slate-300 p-3 text-sm outline-none focus:border-[#16A34A]"
              />

              <div className="mt-2 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  {message.length}/1200
                </div>

                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="border border-slate-200 bg-white">
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                {propertyImage ? (
                  <img
                    src={propertyImage}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No property image
                  </div>
                )}
              </div>

              <div className="p-5">
                <h2 className="font-semibold text-slate-950">
                  {property.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {[property.area, property.city].filter(Boolean).join(', ')}
                </p>

                <div className="mt-3 text-xl font-bold text-[#0F2B46]">
                  {money(property.price)}
                  {isRent ? (
                    <span className="text-sm font-medium text-slate-500">
                      {' '}
                      / month
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="border border-slate-200 px-2.5 py-1 text-slate-600">
                    {property.listingType}
                  </span>
                  <span className="border border-slate-200 px-2.5 py-1 text-slate-600">
                    {property.status}
                  </span>
                </div>
              </div>
            </section>

            <section className="border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Conversation with
              </div>

              <div className="mt-3 font-semibold text-slate-950">
                {counterpartLabel}
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Messages are visible only to the people participating in this
                property conversation and authorized administrators.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
