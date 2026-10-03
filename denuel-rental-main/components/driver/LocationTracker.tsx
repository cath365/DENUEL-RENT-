"use client";
import { useState, useEffect, useRef, useCallback } from 'react';

/* eslint-disable no-undef */

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

interface Props {
  enabled: boolean;
  onLocationUpdate: (location: LocationState) => void;
  updateInterval?: number; // How often to send updates to server (ms)
}

// Real-time location tracking component for drivers
export default function LocationTracker({ enabled, onLocationUpdate, updateInterval = 5000 }: Props) {
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const locationData: LocationState = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: position.timestamp,
    };

    setCurrentLocation(locationData);
    setError(null);

    // Throttle updates to server
    const now = Date.now();
    if (now - lastUpdateRef.current >= updateInterval) {
      lastUpdateRef.current = now;
      onLocationUpdate(locationData);
    }
  }, [onLocationUpdate, updateInterval]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setError('Location permission denied. Please enable location access in your browser settings.');
        break;
      case error.POSITION_UNAVAILABLE:
        setError('Location information is unavailable. Please check your GPS settings.');
        break;
      case error.TIMEOUT:
        setError('Location request timed out. Retrying...');
        break;
      default:
        setError('An unknown error occurred while getting location.');
    }
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    if (enabled) {
      setIsTracking(true);
      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      };

      // Get initial position
      navigator.geolocation.getCurrentPosition(handlePosition, handleError, options);

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition,
        handleError,
        options
      );
    } else {
      setIsTracking(false);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled, handlePosition, handleError]);

  // Calculate speed in km/h from m/s
  const speedKmh = currentLocation?.speed 
    ? (currentLocation.speed * 3.6).toFixed(1) 
    : null;

  // Get direction from heading
  const getDirection = (heading: number | null): string => {
    if (heading === null) return 'N/A';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  if (!enabled) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${isTracking && currentLocation ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
        <span className="font-medium text-white">
          {isTracking && currentLocation ? 'Location Active' : 'Acquiring GPS...'}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-400 p-2 rounded mb-3 text-xs">
          {error}
        </div>
      )}

      {currentLocation && (
        <div className="grid grid-cols-2 gap-2 text-gray-400">
          <div>
            <span className="text-gray-500 text-xs">Latitude</span>
            <p className="font-mono text-white">{currentLocation.latitude.toFixed(6)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Longitude</span>
            <p className="font-mono text-white">{currentLocation.longitude.toFixed(6)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Speed</span>
            <p className="text-white">{speedKmh ? `${speedKmh} km/h` : 'Stationary'}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Direction</span>
            <p className="text-white">{getDirection(currentLocation.heading)}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 text-xs">Accuracy</span>
            <p className="text-white">{currentLocation.accuracy.toFixed(0)}m</p>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          📡 Updates sent every {updateInterval / 1000}s
        </p>
      </div>
    </div>
  );
}
