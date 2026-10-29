import { TrendingUp, Hash } from 'lucide-react';
import { trendingTopics } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Sentiment } from '@/types';

export function TrendingTopics() {
  const getSentimentStyles = (sentiment: Sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-sentiment-positive/10 text-sentiment-positive';
      case 'negative':
        return 'bg-sentiment-negative/10 text-sentiment-negative';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Trending Topics</h3>
          <p className="text-sm text-muted-foreground">Most mentioned today</p>
        </div>
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>

      <div className="space-y-4">
        {trendingTopics.map((topic, index) => (
          <div
            key={topic.topic}
            className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <div className="flex items-center gap-1">
                {topic.topic.startsWith('#') ? (
                  <Hash className="h-4 w-4 text-primary" />
                ) : null}
                <span className="font-medium text-foreground">
                  {topic.topic.startsWith('#') ? topic.topic.slice(1) : topic.topic}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {topic.mentions.toLocaleString()} mentions
              </span>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                getSentimentStyles(topic.sentiment)
              )}>
                {topic.sentiment}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
