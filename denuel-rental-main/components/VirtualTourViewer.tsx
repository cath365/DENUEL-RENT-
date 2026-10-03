'use client';

import React, { useState, useEffect } from 'react';

interface VirtualTourData {
  id: string;
  propertyId: string;
  tourUrl: string;
  provider: string;
  thumbnailUrl?: string;
  floorPlans: Array<{
    id: string;
    name: string;
    imageUrl: string;
    floor?: number;
    sizeSqm?: number;
  }>;
}

interface VirtualTourViewerProps {
  propertyId: string;
  className?: string;
}

export default function VirtualTourViewer({
  propertyId,
  className = '',
}: VirtualTourViewerProps) {
  const [tour, setTour] = useState<VirtualTourData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'tour' | 'floorplan'>('tour');
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchTour();
  }, [propertyId]);

  const fetchTour = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/properties/${propertyId}/virtual-tour`);
      if (response.ok) {
        const data = await response.json();
        setTour(data);
        if (data.floorPlans?.length > 0) {
          setSelectedFloorPlan(data.floorPlans[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tour:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="aspect-video bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-500">No virtual tour available for this property</p>
        </div>
      </div>
    );
  }

  const currentFloorPlan = tour.floorPlans.find((fp) => fp.id === selectedFloorPlan);

  return (
    <>
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-gray-900">Virtual Tour</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('tour')}
                className={`px-3 py-1.5 text-sm rounded-md transition ${
                  activeView === 'tour'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                3D Tour
              </button>
              {tour.floorPlans.length > 0 && (
                <button
                  onClick={() => setActiveView('floorplan')}
                  className={`px-3 py-1.5 text-sm rounded-md transition ${
                    activeView === 'floorplan'
                      ? 'bg-white shadow text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Floor Plans
                </button>
              )}
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Fullscreen"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="relative">
          {activeView === 'tour' && (
            <div className="aspect-video bg-gray-900">
              <iframe
                src={tour.tourUrl}
                className="w-full h-full"
                allowFullScreen
                allow="xr-spatial-tracking"
                title="Virtual Tour"
              />
            </div>
          )}

          {activeView === 'floorplan' && currentFloorPlan && (
            <div>
              {/* Floor Plan Selector */}
              {tour.floorPlans.length > 1 && (
                <div className="p-4 border-b flex gap-2 overflow-x-auto">
                  {tour.floorPlans.map((fp) => (
                    <button
                      key={fp.id}
                      onClick={() => setSelectedFloorPlan(fp.id)}
                      className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                        selectedFloorPlan === fp.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {fp.name}
                      {fp.floor !== undefined && ` (Floor ${fp.floor})`}
                    </button>
                  ))}
                </div>
              )}

              {/* Floor Plan Image */}
              <div className="aspect-video bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentFloorPlan.imageUrl}
                  alt={currentFloorPlan.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Floor Plan Details */}
              <div className="p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{currentFloorPlan.name}</h4>
                    {currentFloorPlan.sizeSqm && (
                      <p className="text-sm text-gray-600">
                        {currentFloorPlan.sizeSqm} sqm
                      </p>
                    )}
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tour Provider Badge */}
        <div className="p-4 border-t text-center text-sm text-gray-500">
          Powered by {tour.provider}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black">
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          {activeView === 'tour' ? (
            <iframe
              src={tour.tourUrl}
              className="w-full h-full"
              allowFullScreen
              allow="xr-spatial-tracking"
              title="Virtual Tour"
            />
          ) : currentFloorPlan ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentFloorPlan.imageUrl}
                alt={currentFloorPlan.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
