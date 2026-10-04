'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import ListingCard from '@/components/ListingCard';
import { csrfFetch } from '@/lib/csrf';

const SPECIALTY_LABELS: Record<string, string> = {
  RESIDENTIAL_SALES: 'Residential sales',
  RESIDENTIAL_RENTALS: 'Residential rentals',
  COMMERCIAL: 'Commercial',
  LUXURY: 'Luxury homes',
  FIRST_TIME_BUYERS: 'First-time buyers',
  INVESTMENT: 'Investment property',
  RELOCATION: 'Relocation',
  NEW_CONSTRUCTION: 'New construction',
};

function whatsappLink(phone: string, name: string) {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    `Hello ${name}, I found your agent profile on Ng'anda and would like to discuss property services.`
  )}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-ZM', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AgentProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [agent, setAgent] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    review: '',
    wouldRecommend: true,
    propertyId: '',
  });

  async function load() {
    setLoading(true);
    setError('');

    try {
      const profileResponse = await fetch(
        '/api/agents/profile?agentId=' + encodeURIComponent(params.id)
      );
      const profileData = await profileResponse.json().catch(() => ({}));

      if (!profileResponse.ok || !profileData.agent) {
        throw new Error(profileData.error || 'Agent profile not found.');
      }

      const currentAgent = profileData.agent;
      setAgent(currentAgent);

      const [propertyResponse, reviewResponse] = await Promise.all([
        fetch(
          '/api/properties?ownerId=' +
            encodeURIComponent(currentAgent.userId) +
            '&pageSize=12'
        ),
        fetch(
          '/api/agents/reviews?agentId=' +
            encodeURIComponent(currentAgent.id) +
            '&limit=20'
        ),
      ]);

      const propertyData = await propertyResponse.json().catch(() => ({}));
      if (propertyResponse.ok) {
        setProperties(
          Array.isArray(propertyData.items)
            ? propertyData.items
            : []
        );
      }

      const reviewData = await reviewResponse.json().catch(() => ({}));
      if (reviewResponse.ok) {
        setReviews(
          Array.isArray(reviewData.reviews)
            ? reviewData.reviews
            : []
        );
        setReviewStats(reviewData.stats || null);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load this agent profile.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();
    if (!agent || !reviewForm.review.trim()) return;

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    try {
      const response = await csrfFetch('/api/agents/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          propertyId: reviewForm.propertyId || null,
          rating: Number(reviewForm.rating),
          title: reviewForm.title.trim() || null,
          review: reviewForm.review.trim(),
          wouldRecommend: reviewForm.wouldRecommend,
        }),
      });

      if (response.status === 401) {
        window.location.href =
          '/auth/login?redirect=/agents/' +
          encodeURIComponent(agent.id);
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit your review.');
      }

      setReviewForm({
        rating: 5,
        title: '',
        review: '',
        wouldRecommend: true,
        propertyId: '',
      });
      setReviewSuccess(
        data.isVerified
          ? 'Review submitted and marked as a verified interaction.'
          : 'Review submitted.'
      );
      await load();
    } catch (submitError) {
      setReviewError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to submit your review.'
      );
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="h-[620px] animate-pulse border border-slate-200 bg-white" />
        </main>
      </div>
    );
  }

  if (!agent || error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-semibold text-red-800">Agent profile unavailable</h1>
            <p className="mt-2 text-sm text-red-700">{error || 'Agent profile not found.'}</p>
            <Link href="/agents" className="mt-5 inline-flex bg-[#0F2B46] px-4 py-2.5 text-sm font-semibold text-white">
              Back to agents
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayName =
    agent.user?.companyName ||
    agent.user?.name ||
    'Agent';
  const accountVerified =
    Boolean(agent.user?.isIdVerified) ||
    Boolean(agent.user?.isBusinessVerified);
  const whatsapp =
    agent.user?.phone
      ? whatsappLink(agent.user.phone, displayName)
      : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link href="/agents" className="text-sm font-semibold text-slate-500 hover:text-[#0F2B46]">
          ← All agents
        </Link>

        <section className="mt-5 overflow-hidden border border-slate-200 bg-white">
          <div className="relative h-44 bg-slate-100 sm:h-56">
            {agent.coverPhotoUrl && (
              <img
                src={agent.coverPhotoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="-mt-16 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100">
                {agent.profilePhotoUrl ? (
                  <img
                    src={agent.profilePhotoUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-500">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950">
                    {displayName}
                  </h1>
                  {accountVerified && (
                    <span className="bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Verified account
                    </span>
                  )}
                </div>

                {agent.user?.companyName && agent.user?.name && (
                  <p className="mt-1 text-sm text-slate-500">
                    Contact: {agent.user.name}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                  {agent.user?.isIdVerified && (
                    <span className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                      Identity verified
                    </span>
                  )}
                  {agent.user?.isBusinessVerified && (
                    <span className="border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                      Business verified
                    </span>
                  )}
                  {agent.user?.isPhoneVerified && (
                    <span className="border border-slate-200 px-2.5 py-1">Phone verified</span>
                  )}
                </div>
              </div>

              <div className="grid min-w-[210px] gap-2">
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#128C7E] px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    WhatsApp
                  </a>
                )}
                {agent.user?.phone && (
                  <a
                    href={'tel:' + agent.user.phone}
                    className="border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
                  >
                    Call
                  </a>
                )}
                {agent.user?.email && (
                  <a
                    href={'mailto:' + agent.user.email}
                    className="border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
                  >
                    Email
                  </a>
                )}
              </div>
            </div>

            <div className="mt-7 grid border-l border-t border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-b border-r border-slate-200 p-4">
                <div className="text-xs text-slate-500">Approved listings</div>
                <div className="mt-1 text-xl font-bold text-slate-950">{agent.approvedListingCount || 0}</div>
              </div>
              <div className="border-b border-r border-slate-200 p-4">
                <div className="text-xs text-slate-500">Rating</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {agent.ratingCount ? Number(agent.ratingAvg || 0).toFixed(1) + '/5' : 'No reviews'}
                </div>
              </div>
              <div className="border-b border-r border-slate-200 p-4">
                <div className="text-xs text-slate-500">Experience</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {agent.yearsExperience == null ? 'Not supplied' : agent.yearsExperience + ' years'}
                </div>
              </div>
              <div className="border-b border-r border-slate-200 p-4">
                <div className="text-xs text-slate-500">Trust score</div>
                <div className="mt-1 text-xl font-bold text-slate-950">
                  {Math.round(Number(agent.user?.trustScore || 0))}/100
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-xl font-bold text-slate-950">About</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
                {agent.bio || 'This agent has not added a public bio yet.'}
              </p>

              {Array.isArray(agent.specialties) && agent.specialties.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-semibold text-slate-900">Specialties</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {agent.specialties.map((item: string) => (
                      <span key={item} className="border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                        {SPECIALTY_LABELS[item] || item.replaceAll('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(agent.areasServed) && agent.areasServed.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-semibold text-slate-900">Areas served</div>
                  <p className="mt-2 text-sm text-slate-600">{agent.areasServed.join(', ')}</p>
                </div>
              )}

              {Array.isArray(agent.languages) && agent.languages.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-semibold text-slate-900">Languages</div>
                  <p className="mt-2 text-sm text-slate-600">{agent.languages.join(', ')}</p>
                </div>
              )}

              {agent.licenseNumber && (
                <div className="mt-6 border-t border-slate-100 pt-5">
                  <div className="text-sm font-semibold text-slate-900">Professional / license number</div>
                  <p className="mt-2 text-sm text-slate-600">{agent.licenseNumber}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Provided by the agent. Displaying this number does not by itself mean Ng&apos;anda has verified the professional licence.
                  </p>
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Approved listings</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Open a property to start a property-specific enquiry with this agent.
                  </p>
                </div>
              </div>

              {properties.length === 0 ? (
                <div className="mt-5 border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  This agent has no approved public listings at the moment.
                </div>
              ) : (
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {properties.map((property) => (
                    <ListingCard
                      key={property.id}
                      property={property}
                      listingType={property.listingType === 'SALE' ? 'SALE' : 'RENT'}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Reviews</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {reviewStats?.totalReviews || 0} real review(s)
                    {reviewStats?.totalReviews
                      ? ' · ' + Number(reviewStats.averageRating || 0).toFixed(1) + '/5 average'
                      : ''}
                  </p>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="mt-5 border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  No reviews yet.
                </div>
              ) : (
                <div className="mt-5 divide-y divide-slate-100">
                  {reviews.map((review) => (
                    <article key={review.id} className="py-5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold text-slate-950">
                            {review.reviewer?.name || 'Reviewer'}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {formatDate(review.createdAt)}
                            {review.isVerified ? ' · Verified interaction' : ''}
                          </div>
                        </div>
                        <div className="font-semibold text-slate-700">{review.rating}/5</div>
                      </div>
                      {review.title && <div className="mt-3 text-sm font-semibold text-slate-900">{review.title}</div>}
                      <p className="mt-2 text-sm leading-6 text-slate-600">{review.review}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-xl font-bold text-slate-950">Leave a review</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Ng&apos;anda marks a review “Verified interaction” only when the account has a completed viewing or recorded lease relationship with a property managed by this agent.
              </p>

              {reviewError && <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{reviewError}</div>}
              {reviewSuccess && <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{reviewSuccess}</div>}

              <form onSubmit={submitReview} className="mt-5 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <select
                    value={reviewForm.rating}
                    onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })}
                    className="h-11 border border-slate-300 bg-white px-3 text-sm"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating}/5</option>
                    ))}
                  </select>

                  <select
                    value={reviewForm.propertyId}
                    onChange={(event) => setReviewForm({ ...reviewForm, propertyId: event.target.value })}
                    className="h-11 border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="">No specific property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>{property.title}</option>
                    ))}
                  </select>
                </div>

                <input
                  value={reviewForm.title}
                  onChange={(event) => setReviewForm({ ...reviewForm, title: event.target.value })}
                  maxLength={120}
                  placeholder="Review title (optional)"
                  className="h-11 border border-slate-300 px-3 text-sm"
                />

                <textarea
                  required
                  minLength={5}
                  maxLength={2500}
                  rows={4}
                  value={reviewForm.review}
                  onChange={(event) => setReviewForm({ ...reviewForm, review: event.target.value })}
                  placeholder="Describe your real experience with this agent"
                  className="border border-slate-300 p-3 text-sm"
                />

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={reviewForm.wouldRecommend}
                    onChange={(event) => setReviewForm({ ...reviewForm, wouldRecommend: event.target.checked })}
                  />
                  I would recommend this agent
                </label>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-fit bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-950">Contact details</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {agent.user?.phone && <div>{agent.user.phone}</div>}
                {agent.user?.email && <div className="break-all">{agent.user.email}</div>}
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                For a listing-specific conversation, open the property and use its enquiry form. That keeps the discussion tied to the correct property and client.
              </p>
            </section>

            {(agent.website || agent.linkedinUrl || agent.facebookUrl || agent.instagramUrl) && (
              <section className="border border-slate-200 bg-white p-5">
                <h2 className="font-bold text-slate-950">Professional links</h2>
                <div className="mt-4 grid gap-2">
                  {[
                    ['Website', agent.website],
                    ['LinkedIn', agent.linkedinUrl],
                    ['Facebook', agent.facebookUrl],
                    ['Instagram', agent.instagramUrl],
                  ].filter(([, href]) => Boolean(href)).map(([label, href]) => (
                    <a
                      key={label}
                      href={String(href)}
                      target="_blank"
                      rel="noreferrer"
                      className="border-b border-slate-100 pb-2 text-sm font-semibold text-[#16A34A]"
                    >
                      {label} ↗
                    </a>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
