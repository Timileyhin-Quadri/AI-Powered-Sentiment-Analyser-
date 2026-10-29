import { Layout } from '@/components/layout/Layout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SentimentGauge } from '@/components/dashboard/SentimentGauge';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import { SentimentDistribution } from '@/components/dashboard/SentimentDistribution';
import { TrendingTopics } from '@/components/dashboard/TrendingTopics';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';
import { PlatformBreakdown } from '@/components/dashboard/PlatformBreakdown';
import { dashboardMetrics } from '@/data/mockData';
import { MessageSquare, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { metrics, loading } = useDashboardMetrics();
  const navigate = useNavigate();

  // Use real metrics if we have them, otherwise show CTA
  const hasRealData = metrics.isFromSearch && metrics.totalPosts > 0;

  const totalMentions = hasRealData ? metrics.totalPosts : dashboardMetrics.totalMentions;
  const positiveCount = hasRealData ? metrics.positiveCount : dashboardMetrics.positiveCount;
  const negativeCount = hasRealData ? metrics.negativeCount : dashboardMetrics.negativeCount;
  const neutralCount = hasRealData ? metrics.neutralCount : 0;

  const sentimentScore = hasRealData ? metrics.sentimentScore : dashboardMetrics.overallSentiment;

  const positivePercent = totalMentions > 0 ? Math.round((positiveCount / totalMentions) * 100) : 61;
  const negativePercent = totalMentions > 0 ? Math.round((negativeCount / totalMentions) * 100) : 17;
  const neutralPercent = totalMentions > 0 ? Math.round((neutralCount / totalMentions) * 100) : 22;

  return (
    <Layout title="Dashboard" subtitle="Monitor your brand sentiment in real-time">
      <div className="space-y-6 animate-fade-in">

        {/* Live data banner */}
        {hasRealData ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Live data active</span>{metrics.keyword ? ` for "${metrics.keyword}"` : ''} — dashboard is showing results from your latest AI analysis.{' '}
              {metrics.lastUpdated && (
                <span className="text-muted-foreground">
                  Last updated {new Date(metrics.lastUpdated).toLocaleTimeString()}.
                </span>
              )}
            </p>
            <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => navigate('/search')}>
              <RefreshCw className="h-3.5 w-3.5" />
              New Search
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">sample data</span>. Run a search to see real AI-powered sentiment analysis.
            </p>
            <Button size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => navigate('/search')}>
              Start Analysis
            </Button>
          </div>
        )}

        {/* Top Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Total Mentions"
            value={loading ? '...' : totalMentions.toLocaleString()}
            trend={dashboardMetrics.mentionsTrend}
            trendLabel="vs last search"
            icon={<MessageSquare className="h-5 w-5" />}
          />
          <MetricCard
            title="Positive Mentions"
            value={loading ? '...' : positiveCount.toLocaleString()}
            trend={8.2}
            trendLabel="vs last search"
            icon={<TrendingUp className="h-5 w-5" />}
            variant="positive"
          />
          <MetricCard
            title="Negative Mentions"
            value={loading ? '...' : negativeCount.toLocaleString()}
            trend={-3.4}
            trendLabel="vs last search"
            icon={<TrendingUp className="h-5 w-5" />}
            variant="negative"
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sentiment Score */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Overall Sentiment</h3>
              <p className="text-sm text-muted-foreground">Brand health score</p>
            </div>
            <div className="flex flex-col items-center">
              <SentimentGauge score={sentimentScore} />
              <div className="mt-6 grid w-full grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-sentiment-positive">{positivePercent}%</p>
                  <p className="text-xs text-muted-foreground">Positive</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-sentiment-neutral">{neutralPercent}%</p>
                  <p className="text-xs text-muted-foreground">Neutral</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-sentiment-negative">{negativePercent}%</p>
                  <p className="text-xs text-muted-foreground">Negative</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Trends Chart */}
          <div className="lg:col-span-2">
            <SentimentChart />
          </div>
        </div>

        {/* Secondary Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <SentimentDistribution />
          <TrendingTopics />
          <RecentAlerts />
        </div>

        {/* Platform Breakdown */}
        <PlatformBreakdown />
      </div>
    </Layout>
  );
}
