import { Search, Filter, Twitter, Instagram, Facebook, Linkedin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Platform, Sentiment } from '@/types';

interface MentionFiltersProps {
  selectedSentiment: Sentiment | 'all';
  onSentimentChange: (sentiment: Sentiment | 'all') => void;
  selectedPlatform: Platform | 'all';
  onPlatformChange: (platform: Platform | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const sentiments: { value: Sentiment | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

const platforms: { value: Platform | 'all'; label: string; icon?: React.ElementType }[] = [
  { value: 'all', label: 'All Platforms' },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
];

export function MentionFilters({
  selectedSentiment,
  onSentimentChange,
  selectedPlatform,
  onPlatformChange,
  searchQuery,
  onSearchChange,
}: MentionFiltersProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search mentions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Sentiment Filter */}
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {sentiments.map((sentiment) => (
              <button
                key={sentiment.value}
                onClick={() => onSentimentChange(sentiment.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  selectedSentiment === sentiment.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {sentiment.label}
              </button>
            ))}
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-1">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <Button
                  key={platform.value}
                  variant={selectedPlatform === platform.value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onPlatformChange(platform.value)}
                  className="gap-1.5"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{platform.label}</span>
                </Button>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
