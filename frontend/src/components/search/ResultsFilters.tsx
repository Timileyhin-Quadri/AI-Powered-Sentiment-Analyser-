import { Twitter, Instagram, Facebook, Linkedin, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export type SentimentFilter = 'all' | 'positive' | 'negative' | 'neutral';
export type SortOption = 'recent' | 'engagement' | 'confidence';

interface ResultsFiltersProps {
  sentimentFilter: SentimentFilter;
  onSentimentFilter: (f: SentimentFilter) => void;
  platformFilters: Record<string, boolean>;
  onPlatformFilter: (platform: string, checked: boolean) => void;
  sortBy: SortOption;
  onSort: (s: SortOption) => void;
  availablePlatforms: string[];
}

const sentimentButtons: { value: SentimentFilter; label: string; className: string }[] = [
  { value: 'all', label: 'All', className: '' },
  { value: 'positive', label: 'Positive', className: 'data-[active=true]:bg-[hsl(var(--sentiment-positive))]/10 data-[active=true]:text-[hsl(var(--sentiment-positive))] data-[active=true]:border-[hsl(var(--sentiment-positive))]' },
  { value: 'negative', label: 'Negative', className: 'data-[active=true]:bg-[hsl(var(--sentiment-negative))]/10 data-[active=true]:text-[hsl(var(--sentiment-negative))] data-[active=true]:border-[hsl(var(--sentiment-negative))]' },
  { value: 'neutral', label: 'Neutral', className: 'data-[active=true]:bg-[hsl(var(--sentiment-neutral))]/10 data-[active=true]:text-[hsl(var(--sentiment-neutral))] data-[active=true]:border-[hsl(var(--sentiment-neutral))]' },
];

const platformIcons: Record<string, React.ElementType> = {
  twitter: Twitter, instagram: Instagram, facebook: Facebook, linkedin: Linkedin,
};

export function ResultsFilters({
  sentimentFilter, onSentimentFilter,
  platformFilters, onPlatformFilter,
  sortBy, onSort,
  availablePlatforms,
}: ResultsFiltersProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Sentiment filter */}
        <div className="flex items-center gap-1">
          {sentimentButtons.map((btn) => (
            <Button
              key={btn.value}
              variant="outline"
              size="sm"
              data-active={sentimentFilter === btn.value}
              className={cn(
                'text-xs h-8',
                sentimentFilter === btn.value && 'border-primary bg-primary/10 text-primary',
                btn.className
              )}
              onClick={() => onSentimentFilter(btn.value)}
            >
              {btn.label}
            </Button>
          ))}
        </div>

        {/* Platform checkboxes */}
        <div className="flex items-center gap-3 border-l border-border pl-4">
          {availablePlatforms.map((p) => {
            const Icon = platformIcons[p] || Twitter;
            return (
              <label key={p} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer capitalize">
                <Checkbox
                  checked={platformFilters[p] !== false}
                  onCheckedChange={(checked) => onPlatformFilter(p, !!checked)}
                />
                <Icon className="h-3.5 w-3.5" />
                {p}
              </label>
            );
          })}
        </div>

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => onSort(v as SortOption)}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="engagement">Highest Engagement</SelectItem>
              <SelectItem value="confidence">Confidence Score</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
