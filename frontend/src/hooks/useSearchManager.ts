import { useState, useCallback, useRef } from 'react';
import { type SearchRequest, type SearchResults, analyzeAll } from '@/lib/api/sentimentApi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SearchStatus = 'idle' | 'validating' | 'scraping' | 'analyzing' | 'complete' | 'error';

export interface SearchProgress {
  currentPlatform?: string;
  platformsCompleted: number;
  totalPlatforms: number;
  postsCollected: number;
  estimatedTimeRemaining?: number;
  platformStatuses: Record<string, 'waiting' | 'scraping' | 'complete' | 'failed'>;
}

export interface SearchState {
  status: SearchStatus;
  progress: SearchProgress;
  results?: SearchResults;
  error?: string;
}

export interface SavedSearch {
  id: string;
  request: SearchRequest;
  timestamp: Date;
  resultsCount?: number;
  starred?: boolean;
}

const HISTORY_KEY = 'sentimentiq_search_history';
const SAVED_KEY = 'sentimentiq_saved_searches';
const LOCAL_METRICS_KEY = 'sentitrack_live_metrics';
const LAST_RESULTS_KEY = 'sentitrack_last_search_results';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function useSearchManager() {
  const { user } = useAuth();

  const [searchState, setSearchState] = useState<SearchState>({
    status: 'idle',
    progress: {
      platformsCompleted: 0,
      totalPlatforms: 0,
      postsCollected: 0,
      platformStatuses: {},
    },
  });

  const [searchHistory, setSearchHistory] = useState<SavedSearch[]>(() =>
    loadFromStorage(HISTORY_KEY, [])
  );

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() =>
    loadFromStorage(SAVED_KEY, [])
  );

  const abortRef = useRef<AbortController | null>(null);

  const persistResults = useCallback(async (
    request: SearchRequest,
    results: SearchResults,
    searchId: string
  ) => {
    // 1. Always persist to localStorage for instant UI responsiveness
    const localMetrics = {
      totalPosts: results.summary.total_posts,
      positiveCount: results.summary.positive,
      negativeCount: results.summary.negative,
      neutralCount: results.summary.neutral,
      sentimentScore: results.summary.sentiment_score,
      engagementRate: results.summary.engagement_rate,
      lastUpdated: new Date().toISOString(),
      isFromSearch: true,
      keyword: request.keywords.join(', '),
    };

    saveToStorage(LOCAL_METRICS_KEY, localMetrics);
    saveToStorage(LAST_RESULTS_KEY, results);

    // Notify other components (like Dashboard)
    window.dispatchEvent(new CustomEvent('sentitrack_metrics_updated', { detail: localMetrics }));

    // 2. Optionally sync to Supabase if logged in
    if (!user || user.id === 'guest-user-001') return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('search_results') as any).insert({
        user_id: user.id,
        keywords: request.keywords,
        platforms: request.platforms,
        max_posts: request.maxPosts,
        summary: results.summary as unknown,
        posts: results.posts as unknown,
        volume_over_time: results.volume_over_time as unknown,
        platform_metrics: results.platforms as unknown,
      });

      await supabase.from('dashboard_metrics').upsert(
        {
          user_id: user.id,
          total_posts: results.summary.total_posts,
          positive_count: results.summary.positive,
          negative_count: results.summary.negative,
          neutral_count: results.summary.neutral,
          sentiment_score: results.summary.sentiment_score,
          engagement_rate: results.summary.engagement_rate,
          last_search_id: searchId,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    } catch (err) {
      console.warn('Optional Supabase cloud persistence skipped:', err);
    }
  }, [user]);

  const executeSearch = useCallback(async (request: SearchRequest) => {
    const platforms = request.platforms;
    const platformStatuses: Record<string, 'waiting' | 'scraping' | 'complete' | 'failed'> = {};
    platforms.forEach((p) => (platformStatuses[p] = 'waiting'));

    // Validation
    setSearchState({
      status: 'validating',
      progress: { platformsCompleted: 0, totalPlatforms: platforms.length, postsCollected: 0, platformStatuses },
    });

    if (request.keywords.length === 0 || request.keywords.every((k) => k.trim() === '')) {
      setSearchState((s) => ({ ...s, status: 'error', error: 'Please enter at least one keyword.' }));
      return;
    }

    if (platforms.length === 0) {
      setSearchState((s) => ({ ...s, status: 'error', error: 'Please select at least one platform.' }));
      return;
    }

    abortRef.current = new AbortController();

    // Visual scraping animation
    const simulateScrapingProgress = async () => {
      for (let i = 0; i < platforms.length; i++) {
        if (abortRef.current?.signal.aborted) return;
        const currentPlatform = platforms[i];
        platformStatuses[currentPlatform] = 'scraping';
        setSearchState({
          status: 'scraping',
          progress: {
            currentPlatform,
            platformsCompleted: i,
            totalPlatforms: platforms.length,
            postsCollected: i * request.maxPosts,
            estimatedTimeRemaining: (platforms.length - i) * 2,
            platformStatuses: { ...platformStatuses },
          },
        });
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
        platformStatuses[currentPlatform] = 'complete';
      }
    };

    try {
      await simulateScrapingProgress();
      if (abortRef.current?.signal.aborted) return;

      // Analyzing phase — calling backend
      setSearchState((s) => ({
        ...s,
        status: 'analyzing',
        progress: {
          ...s.progress,
          platformsCompleted: platforms.length,
          postsCollected: platforms.length * request.maxPosts,
          platformStatuses: { ...platformStatuses },
        },
      }));

      // Call our FastAPI backend (with built-in simulated fallback)
      const results: SearchResults = await analyzeAll(request, abortRef.current?.signal);

      // Persist results & update dashboard
      const searchId = crypto.randomUUID();
      await persistResults(request, results, searchId);

      // Add to local history
      const historyEntry: SavedSearch = {
        id: searchId,
        request,
        timestamp: new Date(),
        resultsCount: results.summary.total_posts,
      };
      const newHistory = [historyEntry, ...searchHistory].slice(0, 50);
      setSearchHistory(newHistory);
      saveToStorage(HISTORY_KEY, newHistory);

      setSearchState({
        status: 'complete',
        progress: {
          platformsCompleted: platforms.length,
          totalPlatforms: platforms.length,
          postsCollected: results.summary.total_posts,
          platformStatuses: { ...platformStatuses },
        },
        results,
      });
    } catch (err) {
      setSearchState({
        status: 'error',
        progress: {
          platformsCompleted: 0,
          totalPlatforms: platforms.length,
          postsCollected: 0,
          platformStatuses,
        },
        error: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    }
  }, [searchHistory, persistResults]);

  const cancelSearch = useCallback(() => {
    abortRef.current?.abort();
    setSearchState((s) => ({ ...s, status: 'idle' }));
  }, []);

  const saveSearch = useCallback((request: SearchRequest) => {
    const entry: SavedSearch = {
      id: crypto.randomUUID(),
      request,
      timestamp: new Date(),
      starred: true,
    };
    const updated = [entry, ...savedSearches];
    setSavedSearches(updated);
    saveToStorage(SAVED_KEY, updated);
  }, [savedSearches]);

  const removeFromHistory = useCallback((id: string) => {
    const updated = searchHistory.filter((s) => s.id !== id);
    setSearchHistory(updated);
    saveToStorage(HISTORY_KEY, updated);
  }, [searchHistory]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    saveToStorage(HISTORY_KEY, []);
  }, []);

  const resetSearch = useCallback(() => {
    setSearchState({
      status: 'idle',
      progress: { platformsCompleted: 0, totalPlatforms: 0, postsCollected: 0, platformStatuses: {} },
    });
  }, []);

  return {
    searchState,
    searchHistory,
    savedSearches,
    executeSearch,
    cancelSearch,
    saveSearch,
    removeFromHistory,
    clearHistory,
    resetSearch,
  };
}
