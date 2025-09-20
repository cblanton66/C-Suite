interface PageView {
  userCode: string;
  page: string;
  timestamp: string;
  sessionId: string;
  timeSpent?: number;
}

interface AnalyticsData {
  pageViews: PageView[];
}

const ANALYTICS_KEY = "peaksuiteai_analytics";
const SESSION_ID_KEY = "peaksuiteai_session_id";

// Generate a unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get or create session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Get user code from session storage
function getUserCode(): string {
  if (typeof window === 'undefined') return 'unknown';
  return sessionStorage.getItem('peaksuiteai_user_code') || 'unknown';
}

// Load analytics data from localStorage
function loadAnalyticsData(): AnalyticsData {
  if (typeof window === 'undefined') return { pageViews: [] };
  
  const stored = localStorage.getItem(ANALYTICS_KEY);
  if (!stored) return { pageViews: [] };
  
  try {
    return JSON.parse(stored);
  } catch {
    return { pageViews: [] };
  }
}

// Save analytics data to localStorage
function saveAnalyticsData(data: AnalyticsData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
}

// Track page view
export function trackPageView(page: string): void {
  const userCode = getUserCode();
  const sessionId = getSessionId();
  
  if (userCode === 'unknown') return; // Don't track if no user code
  
  const data = loadAnalyticsData();
  data.pageViews.push({
    userCode,
    page,
    timestamp: new Date().toISOString(),
    sessionId
  });
  
  saveAnalyticsData(data);
  
  // Also track with Vercel Analytics for enhanced analytics
  if (typeof window !== 'undefined') {
    try {
      const { VercelAnalytics } = require('@/lib/vercel-analytics')
      VercelAnalytics.trackPageView(page)
    } catch (error) {
      // Vercel analytics not available, continue with localStorage only
    }
  }
}

// Track time spent on page (call this when leaving a page)
export function trackTimeSpent(page: string, timeSpent: number): void {
  const userCode = getUserCode();
  const sessionId = getSessionId();
  
  if (userCode === 'unknown') return;
  
  const data = loadAnalyticsData();
  
  // Find the most recent page view for this user/session/page
  const pageViewIndex = data.pageViews
    .map((pv, index) => ({ ...pv, index }))
    .reverse()
    .find(pv => 
      pv.userCode === userCode && 
      pv.page === page && 
      pv.sessionId === sessionId &&
      !pv.timeSpent
    )?.index;
  
  if (pageViewIndex !== undefined) {
    data.pageViews[pageViewIndex].timeSpent = Math.round(timeSpent / 1000); // Convert to seconds
    saveAnalyticsData(data);
  }
}

// Get analytics data (for admin view)
export function getAnalyticsData(): AnalyticsData {
  return loadAnalyticsData();
}

// Clear analytics data
export function clearAnalyticsData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ANALYTICS_KEY);
}