'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

interface Agent {
  id: string;
  userId: string;
  bio: string | null;
  specialties: string[];
  areasServed: string[];
  licenseNumber: string | null;
  yearsExperience: number | null;
  languages: string[];
  profilePhotoUrl: string | null;
  coverPhotoUrl: string | null;
  website: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  totalSales: number;
  totalRentals: number;
  totalVolume: number;
  ratingAvg: number;
  ratingCount: number;
  responseTimeHours: number | null;
  responseRate: number | null;
  isVerified: boolean;
  isFeatured: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  reviews: Review[];
  transactions: Transaction[];
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  review: string;
  wouldRecommend: boolean;
  helpfulness: number;
  isVerified: boolean;
  response: string | null;
  responseAt: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
  };
}

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  closedAt: string;
  clientType: string | null;
}

interface Property {
  id: string;
  title: string;
  price: number;
  propertyType: string;
  listingType: string;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  images: { url: string }[];
}

const SPECIALTIES: Record<string, string> = {
  RESIDENTIAL_SALES: 'Residential Sales',
  RESIDENTIAL_RENTALS: 'Residential Rentals',
  COMMERCIAL: 'Commercial',
  LUXURY: 'Luxury Homes',
  FIRST_TIME_BUYERS: 'First-Time Buyers',
  INVESTMENT: 'Investment Properties',
  RELOCATION: 'Relocation',
  NEW_CONSTRUCTION: 'New Construction',
};

export default function AgentProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');

  // Contact form
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    propertyInterest: '',
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  // Review form
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    review: '',
    wouldRecommend: true,
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Review filters
  const [reviewSort, setReviewSort] = useState('recent');
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [reviewStats, setReviewStats] = useState<any>(null);

  useEffect(() => {
    fetchAgent();
    fetchReviews();
    fetchAgentProperties();
  }, [id]);

  const fetchAgent = async () => {
    try {
      const res = await fetch(`/api/agents/profile?agentId=${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.agents && data.agents.length > 0) {
          setAgent(data.agents[0]);
        } else if (data.agent) {
          setAgent(data.agent);
        }
      }
    } catch (error) {
      console.error('Error fetching agent:', error);
    }
    setLoading(false);
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(
        `/api/agents/reviews?agentId=${id}&sortBy=${reviewSort}&page=${reviewPage}`
      );
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setTotalReviews(data.pagination.total);
        setReviewStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchAgentProperties = async () => {
    try {
      const res = await fetch(`/api/properties?agentId=${id}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const sendContactMessage = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setSendingMessage(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: agent?.userId,
          subject: `Inquiry from ${contactForm.name}`,
          message: contactForm.message,
          senderName: contactForm.name,
          senderEmail: contactForm.email,
          senderPhone: contactForm.phone,
        }),
      });

      if (res.ok) {
        setMessageSent(true);
        setTimeout(() => {
          setShowContactModal(false);
          setMessageSent(false);
          setContactForm({ name: '', email: '', phone: '', message: '', propertyInterest: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setSendingMessage(false);
  };

  const submitReview = async () => {
    if (!reviewForm.review) return;
    setSubmittingReview(true);

    try {
      const res = await fetch('/api/agents/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: id,
          ...reviewForm,
        }),
      });

      if (res.ok) {
        setShowReviewModal(false);
        setReviewForm({ rating: 5, title: '', review: '', wouldRecommend: true });
        fetchReviews();
        fetchAgent();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
    setSubmittingReview(false);
  };

  const formatCurrency = (amount: number) => {
    return `K${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onSelect && onSelect(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition' : 'cursor-default'}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Not Found</h2>
          <p className="text-gray-600 mb-6">The agent you're looking for doesn't exist.</p>
          <Link href="/agents" className="text-blue-600 hover:underline">
            ← Back to All Agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Cover Photo */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 to-blue-800 relative">
        {agent.coverPhotoUrl && (
          <img src={agent.coverPhotoUrl} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg -mt-20 relative z-10 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <div className="relative -mt-20 md:-mt-24">
                {agent.profilePhotoUrl ? (
                  <img
                    src={agent.profilePhotoUrl}
                    alt={agent.user.name}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center text-4xl text-blue-600">
                    {agent.user.name.charAt(0)}
                  </div>
                )}
                {agent.isVerified && (
                  <div className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {agent.user.name}
                    </h1>
                    {agent.isFeatured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  {agent.licenseNumber && (
                    <p className="text-gray-500 text-sm">License #{agent.licenseNumber}</p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    {renderStars(Math.round(agent.ratingAvg))}
                    <span className="font-semibold text-gray-900">
                      {agent.ratingAvg.toFixed(1)}
                    </span>
                    <span className="text-gray-500">({agent.ratingCount} reviews)</span>
                  </div>

                  {/* Areas */}
                  {agent.areasServed && agent.areasServed.length > 0 && (
                    <p className="text-gray-600 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Serves: {agent.areasServed.join(', ')}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Contact Agent
                  </button>
                  {agent.user.phone && (
                    <a
                      href={`tel:${agent.user.phone}`}
                      className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition text-center"
                    >
                      📞 {agent.user.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{agent.totalSales}</div>
                  <div className="text-sm text-gray-500">Sales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{agent.totalRentals}</div>
                  <div className="text-sm text-gray-500">Rentals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {agent.yearsExperience || 0}
                  </div>
                  <div className="text-sm text-gray-500">Years Exp.</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {agent.responseRate ? `${agent.responseRate}%` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Response Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {agent.responseTimeHours
                      ? agent.responseTimeHours < 24
                        ? `${Math.round(agent.responseTimeHours)}h`
                        : `${Math.round(agent.responseTimeHours / 24)}d`
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Response Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex overflow-x-auto border-b">
            {[
              { id: 'about', label: 'About' },
              { id: 'reviews', label: `Reviews (${agent.ratingCount})` },
              { id: 'listings', label: `Listings (${properties.length})` },
              { id: 'transactions', label: 'Past Sales' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Tab */}
            {activeTab === 'about' && (
              <>
                {agent.bio && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">About {agent.user.name}</h2>
                    <p className="text-gray-600 whitespace-pre-line">{agent.bio}</p>
                  </div>
                )}

                {agent.specialties && agent.specialties.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Specialties</h2>
                    <div className="flex flex-wrap gap-2">
                      {agent.specialties.map((spec: string) => (
                        <span
                          key={spec}
                          className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg"
                        >
                          {SPECIALTIES[spec] || spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {agent.languages && agent.languages.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Languages</h2>
                    <div className="flex flex-wrap gap-2">
                      {agent.languages.map((lang: string) => (
                        <span key={lang} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Write a Review
                  </button>
                </div>

                {/* Rating Distribution */}
                {reviewStats && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">
                          {agent.ratingAvg.toFixed(1)}
                        </div>
                        {renderStars(Math.round(agent.ratingAvg))}
                        <p className="text-sm text-gray-500 mt-1">{totalReviews} reviews</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 w-2">{rating}</span>
                            <svg
                              className="w-4 h-4 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{
                                  width: `${
                                    totalReviews > 0
                                      ? ((reviewStats.distribution?.[rating] || 0) / totalReviews) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500 w-8">
                              {reviewStats.distribution?.[rating] || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sort */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select
                    value={reviewSort}
                    onChange={(e) => {
                      setReviewSort(e.target.value);
                      setReviewPage(1);
                    }}
                    className="border rounded-lg px-3 py-1 text-sm"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                    <option value="helpful">Most Helpful</option>
                  </select>
                </div>

                {/* Review List */}
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-6 last:border-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{review.reviewer.name}</span>
                            {review.isVerified && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {review.title && (
                        <h4 className="font-semibold text-gray-900 mt-3">{review.title}</h4>
                      )}
                      <p className="text-gray-600 mt-2">{review.review}</p>

                      {review.wouldRecommend && (
                        <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Would recommend this agent
                        </p>
                      )}

                      {/* Agent Response */}
                      {review.response && (
                        <div className="bg-gray-50 rounded-lg p-4 mt-4 ml-6">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Response from {agent.user.name}:
                          </p>
                          <p className="text-sm text-gray-600">{review.response}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {reviews.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-4xl mb-4">⭐</p>
                      <p>No reviews yet. Be the first to review!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-6">
                {properties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.map((property) => (
                      <Link
                        key={property.id}
                        href={`/property/${property.id}`}
                        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group"
                      >
                        <div className="h-48 bg-gray-200 relative">
                          {property.images?.[0]?.url ? (
                            <img
                              src={property.images[0].url}
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            {property.listingType === 'SALE' ? 'For Sale' : 'For Rent'}
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-bold text-lg text-blue-600">
                            {formatCurrency(property.price)}
                            {property.listingType === 'RENT' && (
                              <span className="text-sm font-normal">/month</span>
                            )}
                          </p>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                            {property.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {property.bedrooms} bed • {property.bathrooms} bath
                          </p>
                          <p className="text-sm text-gray-500">{property.address}, {property.city}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
                    <p className="text-4xl mb-4">🏠</p>
                    <p>No active listings</p>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Past Transactions</h2>
                {agent.transactions && agent.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {agent.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              tx.transactionType === 'SALE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {tx.transactionType}
                          </span>
                          <p className="font-semibold mt-1">{formatCurrency(tx.amount)}</p>
                          <p className="text-sm text-gray-500">
                            Closed {formatDate(tx.closedAt)}
                            {tx.clientType && ` • ${tx.clientType}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-4xl mb-4">📊</p>
                    <p>No past transactions recorded</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Contact {agent.user.name}</h3>
              <div className="space-y-3">
                {agent.user.phone && (
                  <a
                    href={`tel:${agent.user.phone}`}
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
                  >
                    <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      📞
                    </span>
                    <span>{agent.user.phone}</span>
                  </a>
                )}
                <a
                  href={`mailto:${agent.user.email}`}
                  className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
                >
                  <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    ✉️
                  </span>
                  <span className="truncate">{agent.user.email}</span>
                </a>
                {agent.website && (
                  <a
                    href={agent.website}
                    target="_blank"
                    className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
                  >
                    <span className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      🌐
                    </span>
                    <span>Website</span>
                  </a>
                )}
              </div>

              {/* Social Links */}
              {(agent.facebookUrl || agent.linkedinUrl || agent.instagramUrl) && (
                <div className="flex gap-3 mt-4 pt-4 border-t">
                  {agent.facebookUrl && (
                    <a
                      href={agent.facebookUrl}
                      target="_blank"
                      className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
                    >
                      f
                    </a>
                  )}
                  {agent.linkedinUrl && (
                    <a
                      href={agent.linkedinUrl}
                      target="_blank"
                      className="w-10 h-10 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800"
                    >
                      in
                    </a>
                  )}
                  {agent.instagramUrl && (
                    <a
                      href={agent.instagramUrl}
                      target="_blank"
                      className="w-10 h-10 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700"
                    >
                      📷
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowContactModal(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mt-4"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            {messageSent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-900">Message Sent!</h3>
                <p className="text-gray-600 mt-2">
                  {agent.user.name} will get back to you soon.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Contact {agent.user.name}
                  </h3>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Name *</label>
                    <input
                      type="text"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Email *</label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, email: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, phone: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Message *</label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, message: e.target.value })
                      }
                      rows={4}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder={`Hi ${agent.user.name}, I'm interested in...`}
                    />
                  </div>

                  <button
                    onClick={sendContactMessage}
                    disabled={
                      sendingMessage ||
                      !contactForm.name ||
                      !contactForm.email ||
                      !contactForm.message
                    }
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Review {agent.user.name}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Rating *</label>
                <div className="flex items-center gap-2">
                  {renderStars(reviewForm.rating, true, (r) =>
                    setReviewForm({ ...reviewForm, rating: r })
                  )}
                  <span className="text-gray-600">{reviewForm.rating} stars</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Title</label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, title: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Summarize your experience"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Review *</label>
                <textarea
                  value={reviewForm.review}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, review: e.target.value })
                  }
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Share your experience working with this agent..."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewForm.wouldRecommend}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, wouldRecommend: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-gray-700">I would recommend this agent</span>
              </label>

              <button
                onClick={submitReview}
                disabled={submittingReview || !reviewForm.review}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
