"use client"
import { useEffect, useRef } from 'react';
import { trackPageView, trackTimeSpent } from '@/lib/analytics';

export function usePageAnalytics(pageName: string) {
  const startTime = useRef<number>(Date.now());
  const hasTrackedView = useRef<boolean>(false);

  useEffect(() => {
    // Track page view once when component mounts
    if (!hasTrackedView.current) {
      trackPageView(pageName);
      hasTrackedView.current = true;
      startTime.current = Date.now();
    }

    // Track time spent when component unmounts or page changes
    return () => {
      if (hasTrackedView.current) {
        const timeSpent = Date.now() - startTime.current;
        trackTimeSpent(pageName, timeSpent);
      }
    };
  }, [pageName]);

  // Also track time spent when the page becomes hidden (user switches tabs, closes browser, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasTrackedView.current) {
        const timeSpent = Date.now() - startTime.current;
        trackTimeSpent(pageName, timeSpent);
        // Reset start time for when they come back
        startTime.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      if (hasTrackedView.current) {
        const timeSpent = Date.now() - startTime.current;
        trackTimeSpent(pageName, timeSpent);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pageName]);
}