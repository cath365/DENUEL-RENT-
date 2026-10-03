'use client';

import React, { useState } from 'react';
import Panorama360Viewer from './Panorama360Viewer';

interface Image360 {
  id: string;
  url: string;
  roomName?: string;
  is360: boolean;
}

interface Panorama360SectionProps {
  images: Image360[];
  className?: string;
}

export default function Panorama360Section({ images, className = '' }: Panorama360SectionProps) {
  const [selectedImage, setSelectedImage] = useState<Image360 | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">360° Virtual Views</h3>
              <p className="text-white/80 text-sm">{images.length} panoramic {images.length === 1 ? 'view' : 'views'} available</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[600px]' : 'max-h-48'} overflow-hidden`}>
        {/* Preview Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage(image)}
                className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all"
              >
                <img
                  src={image.url}
                  alt={image.roomName || '360° View'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-white text-xs font-medium">View 360°</span>
                  </div>
                </div>
                {/* Room Name Badge */}
                {image.roomName && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 rounded px-2 py-1">
                    <p className="text-white text-xs truncate">{image.roomName}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Start Button (when collapsed) */}
        {!isExpanded && images.length > 0 && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setSelectedImage(images[0])}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start 360° Tour
            </button>
          </div>
        )}
      </div>

      {/* 360 Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black">
          <Panorama360Viewer
            imageUrl={selectedImage.url}
            title={selectedImage.roomName || '360° View'}
            onClose={() => setSelectedImage(null)}
            className="w-full h-full"
          />

          {/* Room Navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex items-center gap-2 p-2 bg-black/60 rounded-lg backdrop-blur-sm">
              {images.map((img, idx) => {
                const isActive = img.id === selectedImage.id;
                return (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`relative group ${isActive ? 'ring-2 ring-blue-500' : ''} rounded-lg overflow-hidden transition`}
                  >
                    <img
                      src={img.url}
                      alt={img.roomName || `View ${idx + 1}`}
                      className={`w-16 h-10 object-cover ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} transition`}
                    />
                    {img.roomName && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                        <span className="text-white text-[10px] text-center px-1">{img.roomName}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
