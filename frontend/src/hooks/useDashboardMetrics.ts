import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardMetricsData {
  totalPosts: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  sentimentScore: number;
  engagementRate: number;
  lastUpdated: string | null;
  isFromSearch: boolean;
  keyword?: string;
}

const LOCAL_METRICS_KEY = 'sentitrack_live_metrics';

const DEFAULT_METRICS: DashboardMetricsData = {
  totalPosts: 0,
  positiveCount: 0,
  negativeCount: 0,
  neutralCount: 0,
  sentimentScore: 0,
  engagementRate: 0,
  lastUpdated: null,
  isFromSearch: false,
};

export function useDashboardMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetricsData>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_METRICS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return DEFAULT_METRICS;
  });
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    // 1. Check local storage first
    try {
      const stored = localStorage.getItem(LOCAL_METRICS_KEY);
      if (stored) {
        setMetrics(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading local metrics:', e);
    }

    // 2. If user is logged into Supabase, attempt sync
    if (!user || user.id === 'guest-user-001') {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        const synced: DashboardMetricsData = {
          totalPosts: data.total_posts ?? 0,
          positiveCount: data.positive_count ?? 0,
          negativeCount: data.negative_count ?? 0,
          neutralCount: data.neutral_count ?? 0,
          sentimentScore: Number(data.sentiment_score) ?? 0,
          engagementRate: Number(data.engagement_rate) ?? 0,
          lastUpdated: data.last_updated,
          isFromSearch: true,
        };
        setMetrics(synced);
        localStorage.setItem(LOCAL_METRICS_KEY, JSON.stringify(synced));
      }
    } catch (err) {
      console.warn('Supabase dashboard metrics sync skipped:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Listen to local update events
    const handleLocalUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<DashboardMetricsData>;
      if (customEvent.detail) {
        setMetrics(customEvent.detail);
      } else {
        try {
          const stored = localStorage.getItem(LOCAL_METRICS_KEY);
          if (stored) setMetrics(JSON.parse(stored));
        } catch {}
      }
    };

    window.addEventListener('sentitrack_metrics_updated', handleLocalUpdate);

    return () => {
      window.removeEventListener('sentitrack_metrics_updated', handleLocalUpdate);
    };
  }, [user]);

  return { metrics, loading, refresh: fetchMetrics };
}
