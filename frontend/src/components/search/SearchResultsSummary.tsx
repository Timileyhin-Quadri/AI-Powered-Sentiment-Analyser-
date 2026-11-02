import { useState, useMemo } from 'react';
import { Twitter, Instagram, Facebook, Linkedin, TrendingUp, TrendingDown, BarChart3, Sparkles, Lightbulb, Radio, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { SearchResults, SearchRequest } from '@/lib/api/sentimentApi';
import { PostCard } from './PostCard';
import { ComplaintPanel } from './ComplaintPanel';
import { ResultsFilters, type SentimentFilter, type SortOption } from './ResultsFilters';

interface SearchResultsSummaryProps {
  results: SearchResults;
  request: SearchRequest;
  onNewSearch: () => void;
}

const platformIcons: Record<string, React.ElementType> = {
  twitter: Twitter, instagram: Instagram, facebook: Facebook, linkedin: Linkedin,
};

export function SearchResultsSummary({ results, request, onNewSearch }: SearchResultsSummaryProps) {
  const { summary, platforms, posts, complaints, ai_insights, data_source, twitter_status } = results;
  const isPositive = summary.sentiment_score > 0;

  // Filters
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [platformFilters, setPlatformFilters] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const availablePlatforms = useMemo(() => {
    const set = new Set(posts.map((p) => p.platform));
    return Array.from(set);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    if (sentimentFilter !== 'all') {
      filtered = filtered.filter((p) => p.sentiment === sentimentFilter);
    }

    const activePlatforms = Object.entries(platformFilters);
    if (activePlatforms.some(([, v]) => !v)) {
      filtered = filtered.filter((p) => platformFilters[p.platform] !== false);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'engagement') {
        const engA = (a.engagement?.likes || 0) + (a.engagement?.comments || 0) + (a.engagement?.shares || 0);
        const engB = (b.engagement?.likes || 0) + (b.engagement?.comments || 0) + (b.engagement?.shares || 0);
        return engB - engA;
      }
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return filtered;
  }, [posts, sentimentFilter, platformFilters, sortBy]);

  const handlePlatformFilter = (platform: string, checked: boolean) => {
    setPlatformFilters((prev) => ({ ...prev, [platform]: checked }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Results Header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-foreground">Analysis Results</h2>
              {data_source && (
                <Badge variant="outline" className={cn(
                  'text-xs gap-1 font-medium',
                  data_source === 'live'
                    ? 'border-[hsl(var(--sentiment-positive))] text-[hsl(var(--sentiment-positive))]'
                    : data_source === 'database_cache'
                    ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                    : 'border-amber-500 text-amber-500'
                )}>
                  <Radio className="h-3 w-3" />
                  {data_source === 'live' ? 'Live Data' : data_source === 'database_cache' ? 'Database Cache (Instant)' : 'Simulated'}
                </Badge>
              )}
            </div>
            {data_source === 'simulated' && twitter_status && twitter_status.status !== 'success' && twitter_status.status !== 'not_selected' && (
              <div className="flex items-start gap-2 mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Twitter API unavailable — using AI-simulated data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {twitter_status.status === 'no_token' && 'Bearer token is not configured. Add your TWITTER_BEARER_TOKEN in Settings.'}
                    {twitter_status.status === 'api_error' && (twitter_status.error || 'Twitter API returned an error. Check your developer portal settings.')}
                    {twitter_status.status === 'exception' && (twitter_status.error || 'Network error connecting to Twitter API.')}
                  </p>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Keywords: <span className="font-medium text-foreground">{request.keywords.join(', ')}</span>
            </p>
          </div>
          <button onClick={onNewSearch} className="text-sm font-medium text-primary hover:underline">
            ← New Search
          </button>
        </div>

        {/* Big Sentiment Score */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className={cn(
            'text-5xl font-bold',
            isPositive ? 'text-[hsl(var(--sentiment-positive))]' : 'text-[hsl(var(--sentiment-negative))]'
          )}>
            {isPositive ? '+' : ''}{summary.sentiment_score}%
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {isPositive
              ? <TrendingUp className="h-4 w-4 text-[hsl(var(--sentiment-positive))]" />
              : <TrendingDown className="h-4 w-4 text-[hsl(var(--sentiment-negative))]" />}
            Overall Sentiment Score
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="rounded-lg border border-border bg-background p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{summary.total_posts}</p>
            <p className="text-xs text-muted-foreground">Total Posts</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--sentiment-positive))]">{summary.positive}</p>
            <p className="text-xs text-muted-foreground">Positive ({summary.total_posts > 0 ? Math.round(summary.positive / summary.total_posts * 100) : 0}%)</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--sentiment-negative))]">{summary.negative}</p>
            <p className="text-xs text-muted-foreground">Negative ({summary.total_posts > 0 ? Math.round(summary.negative / summary.total_posts * 100) : 0}%)</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--sentiment-neutral))]">{summary.neutral}</p>
            <p className="text-xs text-muted-foreground">Neutral ({summary.total_posts > 0 ? Math.round(summary.neutral / summary.total_posts * 100) : 0}%)</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{summary.engagement_rate}%</p>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      {Object.keys(platforms).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Platform Breakdown</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(platforms).map(([platform, metrics]) => {
              const Icon = platformIcons[platform] || BarChart3;
              const pIsPositive = metrics.sentimentScore > 0;
              return (
                <div key={platform} className="rounded-lg border border-border bg-background p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold text-foreground capitalize">{platform}</span>
                  </div>
                  <div className={cn('text-2xl font-bold', pIsPositive ? 'text-[hsl(var(--sentiment-positive))]' : 'text-[hsl(var(--sentiment-negative))]')}>
                    {pIsPositive ? '+' : ''}{metrics.sentimentScore}%
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center text-xs">
                    <div>
                      <p className="font-semibold text-[hsl(var(--sentiment-positive))]">{metrics.positiveCount}</p>
                      <p className="text-muted-foreground">Pos</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[hsl(var(--sentiment-neutral))]">{metrics.neutralCount}</p>
                      <p className="text-muted-foreground">Neu</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[hsl(var(--sentiment-negative))]">{metrics.negativeCount}</p>
                      <p className="text-muted-foreground">Neg</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{metrics.totalPosts} posts • {metrics.engagementRate}% engagement</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complaint Categorization */}
      {complaints && complaints.total > 0 && (
        <ComplaintPanel complaints={complaints} posts={posts} />
      )}

      {/* AI Insights */}
      {ai_insights && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-foreground">AI Insights</h3>
          </div>
          <p className="text-sm text-foreground mb-4 leading-relaxed">{ai_insights.summary}</p>
          
          {ai_insights.key_themes.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Themes</p>
              <div className="flex flex-wrap gap-2">
                {ai_insights.key_themes.map((theme) => (
                  <span key={theme} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ai_insights.recommendation && (
            <div className="flex items-start gap-2 rounded-lg border border-primary/10 bg-background p-3">
              <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-0.5">Recommendation</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{ai_insights.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters & Posts Feed */}
      {posts.length > 0 && (
        <div className="space-y-4">
          <ResultsFilters
            sentimentFilter={sentimentFilter}
            onSentimentFilter={setSentimentFilter}
            platformFilters={platformFilters}
            onPlatformFilter={handlePlatformFilter}
            sortBy={sortBy}
            onSort={setSortBy}
            availablePlatforms={availablePlatforms}
          />

          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Posts Feed</h3>
            <span className="text-xs text-muted-foreground">{filteredPosts.length} of {posts.length} posts</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-1">
            {filteredPosts.map((post, i) => (
              <PostCard key={i} post={post} />
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No posts match your current filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
