"use client";
import { useEffect, useRef } from 'react';

interface Props {
  enabled?: boolean;
  onNewRequest?: () => void;
}

// Driver notification system with sound and browser notifications
export default function DriverNotifications({ enabled = true, onNewRequest }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPermission = useRef(false);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        hasPermission.current = permission === 'granted';
      });
    } else {
      hasPermission.current = Notification.permission === 'granted';
    }

    // Create audio element for notification sound
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Function to play notification
  const playNotification = (title: string, body: string) => {
    if (!enabled) return;

    // Play sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay might be blocked, that's ok
      });
    }

    // Show browser notification
    if (hasPermission.current && 'Notification' in window) {
      const notificationOptions: globalThis.NotificationOptions & { vibrate?: number[] } = {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'driver-request',
        requireInteraction: true,
      };
      
      // Vibrate is supported in some browsers
      if ('vibrate' in navigator) {
        (notificationOptions as any).vibrate = [200, 100, 200];
      }
      
      const notification = new Notification(title, notificationOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
        onNewRequest?.();
      };

      // Auto close after 30 seconds
      setTimeout(() => notification.close(), 30000);
    }
  };

  // Expose method globally for components to use
  useEffect(() => {
    (window as any).__playDriverNotification = playNotification;
    return () => {
      delete (window as any).__playDriverNotification;
    };
  }, [enabled, onNewRequest]);

  return null; // This is a utility component, no UI
}

// Helper function to trigger driver notification from anywhere
export function triggerDriverNotification(title: string, body: string) {
  if (typeof window !== 'undefined' && (window as any).__playDriverNotification) {
    (window as any).__playDriverNotification(title, body);
  }
}
