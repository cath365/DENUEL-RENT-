'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Panorama360ViewerProps {
  imageUrl: string;
  thumbnailUrl?: string;
  title?: string;
  className?: string;
  onClose?: () => void;
  autoRotate?: boolean;
}

export default function Panorama360Viewer({
  imageUrl,
  thumbnailUrl,
  title = '360° View',
  className = '',
  onClose,
  autoRotate = true,
}: Panorama360ViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [autoRotating, setAutoRotating] = useState(autoRotate);
  const animationRef = useRef<number>();

  // Auto-rotate effect
  useEffect(() => {
    if (autoRotating && !isDragging) {
      const animate = () => {
        setRotation(prev => ({
          ...prev,
          y: prev.y + 0.1
        }));
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoRotating, isDragging]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setAutoRotating(false);
    setStartPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    setRotation(prev => ({
      x: Math.max(-85, Math.min(85, prev.x - deltaY * 0.3)),
      y: prev.y + deltaX * 0.3
    }));
    
    setStartPos({ x: e.clientX, y: e.clientY });
  }, [isDragging, startPos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setAutoRotating(false);
      setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    
    const deltaX = e.touches[0].clientX - startPos.x;
    const deltaY = e.touches[0].clientY - startPos.y;
    
    setRotation(prev => ({
      x: Math.max(-85, Math.min(85, prev.x - deltaY * 0.3)),
      y: prev.y + deltaX * 0.3
    }));
    
    setStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, [isDragging, startPos]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const resetView = () => {
    setRotation({ x: 0, y: 0 });
    setZoom(1);
    setAutoRotating(autoRotate);
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}
      style={{ aspectRatio: isFullscreen ? 'auto' : '16/9' }}
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white text-sm">Loading 360° View...</p>
          </div>
        </div>
      )}

      {/* 360 Panorama Container */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        style={{
          perspective: '1000px',
          perspectiveOrigin: 'center',
        }}
      >
        {/* Spherical Projection Container */}
        <div
          className="w-full h-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center',
          }}
        >
          {/* Inner sphere with panorama image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${400 * zoom}% auto`,
              backgroundPosition: `${50 + rotation.y * 0.3}% ${50 + rotation.x * 0.3}%`,
              backgroundRepeat: 'repeat-x',
              transition: isDragging ? 'none' : 'background-position 0.1s ease-out',
            }}
          >
            <img
              src={imageUrl}
              alt={title}
              className="hidden"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              360° View
            </span>
            {title && (
              <h3 className="text-white font-medium text-sm hidden sm:block">{title}</h3>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
                title="Close"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRotating(!autoRotating)}
              className={`p-2 rounded-full transition ${autoRotating ? 'bg-blue-600 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
              title={autoRotating ? 'Stop Auto-Rotate' : 'Start Auto-Rotate'}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={resetView}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition text-white"
              title="Reset View"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>

          {/* Center - Instructions */}
          <p className="text-white/70 text-xs hidden sm:block">
            Drag to look around • Scroll to zoom
          </p>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition text-white"
              title="Zoom In"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition text-white"
              title="Zoom Out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition text-white"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Zoom Indicator */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-white/60 text-xs">{Math.round(zoom * 100)}%</span>
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${((zoom - 0.5) / 2.5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Compass */}
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 hidden sm:block">
        <div
          className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center"
          style={{ transform: `rotate(${-rotation.y}deg)` }}
        >
          <div className="text-center">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-red-500" />
            <p className="text-white text-xs mt-1">N</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Gallery component for multiple 360 images
interface Panorama360GalleryProps {
  images: Array<{
    id: string;
    url: string;
    title?: string;
    thumbnailUrl?: string;
  }>;
  className?: string;
}

export function Panorama360Gallery({ images, className = '' }: Panorama360GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className={className}>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => {
              setSelectedIndex(index);
              setShowViewer(true);
            }}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition ${
              selectedIndex === index ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img
              src={image.thumbnailUrl || image.url}
              alt={image.title || `360° View ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-2">
                <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            {image.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                <p className="text-white text-xs truncate">{image.title}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Full Viewer Modal */}
      {showViewer && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <Panorama360Viewer
            imageUrl={selectedImage.url}
            thumbnailUrl={selectedImage.thumbnailUrl}
            title={selectedImage.title}
            onClose={() => setShowViewer(false)}
            className="w-full h-full"
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedIndex(prev => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedIndex(prev => (prev + 1) % images.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Thumbnail Strip */}
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-16 h-10 rounded overflow-hidden border-2 transition ${
                      idx === selectedIndex ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.thumbnailUrl || img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
