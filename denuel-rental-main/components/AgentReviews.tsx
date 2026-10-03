'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface AgentProfile {
  id: string;
  userId: string;
  licenseNumber?: string;
  specialties: string[];
  yearsExperience: number;
  bio?: string;
  languages: string[];
  serviceAreas: string[];
  verified: boolean;
  averageRating: number;
  totalReviews: number;
  totalTransactions: number;
  user: {
    name: string;
    email: string;
    image?: string;
    phone?: string;
  };
}

interface AgentReview {
  id: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
  wouldRecommend: boolean;
  reviewer: {
    name: string;
    image?: string;
  };
}

interface AgentReviewsProps {
  agentId?: string;
  showProfile?: boolean;
}

export default function AgentReviews({ agentId, showProfile = true }: AgentReviewsProps) {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: '',
    wouldRecommend: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (agentId) {
      fetchAgentProfile(agentId);
    } else {
      fetchAgents();
    }
  }, [agentId]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agents/profile');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentProfile = async (id: string) => {
    setLoading(true);
    try {
      const [profileRes, reviewsRes] = await Promise.all([
        fetch(`/api/agents/profile?agentId=${id}`),
        fetch(`/api/agents/reviews?agentId=${id}`),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setSelectedAgent(data);
      }

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!selectedAgent || !newReview.content) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/agents/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          ...newReview,
        }),
      });

      if (response.ok) {
        setShowReviewForm(false);
        setNewReview({ rating: 5, title: '', content: '', wouldRecommend: true });
        fetchAgentProfile(selectedAgent.id);
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition`}
          >
            <svg
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Agent list view
  if (!selectedAgent && !agentId) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Find an Agent</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => fetchAgentProfile(agent.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                  {agent.user.image ? (
                    <Image
                      src={agent.user.image}
                      alt={agent.user.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-400">
                      {agent.user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{agent.user.name}</h3>
                    {agent.verified && (
                      <span className="text-blue-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(agent.averageRating)}
                    <span className="text-sm text-gray-600">
                      ({agent.totalReviews} reviews)
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {agent.specialties.slice(0, 3).map((specialty, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {agent.yearsExperience} years experience • {agent.totalTransactions} transactions
              </p>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <p className="text-center text-gray-500 py-8">No agents found</p>
        )}
      </div>
    );
  }

  // Single agent profile view
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {selectedAgent && showProfile && (
        <>
          {/* Agent Profile Header */}
          <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                {selectedAgent.user.image ? (
                  <Image
                    src={selectedAgent.user.image}
                    alt={selectedAgent.user.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    {selectedAgent.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{selectedAgent.user.name}</h2>
                  {selectedAgent.verified && (
                    <span className="px-2 py-0.5 bg-white/20 rounded text-sm">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= selectedAgent.averageRating
                            ? 'text-yellow-400'
                            : 'text-white/30'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span>{selectedAgent.averageRating.toFixed(1)}</span>
                  <span className="opacity-75">
                    ({selectedAgent.totalReviews} reviews)
                  </span>
                </div>
                <p className="mt-3 opacity-90">{selectedAgent.bio}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x border-b">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {selectedAgent.yearsExperience}
              </p>
              <p className="text-sm text-gray-600">Years Experience</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {selectedAgent.totalTransactions}
              </p>
              <p className="text-sm text-gray-600">Transactions</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {selectedAgent.totalReviews}
              </p>
              <p className="text-sm text-gray-600">Reviews</p>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 grid md:grid-cols-2 gap-6 border-b">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.specialties.map((specialty, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Service Areas</h3>
              <div className="flex flex-wrap gap-2">
                {selectedAgent.serviceAreas.map((area, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
              <p className="text-gray-600">{selectedAgent.languages.join(', ')}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
              <p className="text-gray-600">{selectedAgent.user.email}</p>
              {selectedAgent.user.phone && (
                <p className="text-gray-600">{selectedAgent.user.phone}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reviews Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Write a Review
          </button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4">Write Your Review</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Rating</label>
                {renderStars(newReview.rating, true, (r) =>
                  setNewReview({ ...newReview, rating: r })
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) =>
                    setNewReview({ ...newReview, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Sum up your experience"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Your Review</label>
                <textarea
                  value={newReview.content}
                  onChange={(e) =>
                    setNewReview({ ...newReview, content: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Share your experience working with this agent"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newReview.wouldRecommend}
                    onChange={(e) =>
                      setNewReview({ ...newReview, wouldRecommend: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I would recommend this agent
                  </span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submitReview}
                  disabled={submitting || !newReview.content}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {review.reviewer.image ? (
                    <Image
                      src={review.reviewer.image}
                      alt={review.reviewer.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {review.reviewer.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{review.reviewer.name}</p>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        {review.wouldRecommend && (
                          <span className="text-xs text-green-600">
                            ✓ Recommends
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <p className="font-medium text-gray-900 mt-2">{review.title}</p>
                  )}
                  <p className="text-gray-600 mt-1">{review.content}</p>
                </div>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No reviews yet. Be the first to review!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
