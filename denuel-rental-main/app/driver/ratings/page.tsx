"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import axios from 'axios';

interface Rating {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  tenant: {
    name: string;
    image?: string;
  };
  trip: {
    pickup: string;
    dropoff: string;
    date: string;
  };
}

export default function DriverRatingsPage() {
  const router = useRouter();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: [0, 0, 0, 0, 0] // 1-5 stars
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const { data } = await axios.get('/api/driver/ratings');
      setRatings(data.ratings || []);
      
      // Calculate stats
      if (data.ratings && data.ratings.length > 0) {
        const total = data.ratings.length;
        const sum = data.ratings.reduce((acc: number, r: Rating) => acc + r.rating, 0);
        const distribution = [0, 0, 0, 0, 0];
        data.ratings.forEach((r: Rating) => {
          distribution[r.rating - 1]++;
        });
        setStats({
          average: sum / total,
          total,
          distribution
        });
      }
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`${sizeClass} ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/driver')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8">⭐ Ratings & Reviews</h1>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <>
            {/* Rating Overview */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Average Rating */}
                <div className="text-center md:text-left">
                  <div className="text-6xl font-bold text-yellow-400">
                    {stats.average.toFixed(1)}
                  </div>
                  <div className="mt-2">{renderStars(Math.round(stats.average), 'lg')}</div>
                  <p className="text-gray-400 mt-2">{stats.total} ratings</p>
                </div>

                {/* Rating Distribution */}
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.distribution[star - 1];
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 w-4">{star}</span>
                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rating Tips */}
            {stats.average < 4.5 && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 mb-8">
                <h3 className="font-semibold text-blue-400 mb-2">💡 Tips to Improve Your Rating</h3>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• Keep your vehicle clean and well-maintained</li>
                  <li>• Be punctual and communicate with passengers</li>
                  <li>• Drive safely and follow traffic rules</li>
                  <li>• Be friendly and professional</li>
                </ul>
              </div>
            )}

            {/* Reviews List */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Customer Reviews</h2>
              </div>

              {ratings.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {ratings.map((review) => (
                    <div key={review.id} className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-lg font-bold text-gray-400 flex-shrink-0">
                          {review.tenant.name?.[0]?.toUpperCase() || '?'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{review.tenant.name}</h4>
                            <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                          </div>
                          
                          <div className="mt-1">{renderStars(review.rating)}</div>

                          {review.comment && (
                            <p className="mt-2 text-gray-300">{review.comment}</p>
                          )}

                          {/* Trip Info */}
                          <div className="mt-3 text-xs text-gray-500 bg-gray-900/50 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              <span className="truncate">{review.trip.pickup}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              <span className="truncate">{review.trip.dropoff}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p>No reviews yet</p>
                  <p className="text-sm mt-2">Complete trips to receive customer reviews</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
