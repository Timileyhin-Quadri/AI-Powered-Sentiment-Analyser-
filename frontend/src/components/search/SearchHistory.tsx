import { Clock, RotateCcw, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SavedSearch } from '@/hooks/useSearchManager';
import type { SearchRequest } from '@/lib/api/sentimentApi';
import { formatDistanceToNow } from 'date-fns';

interface SearchHistoryProps {
  history: SavedSearch[];
  onRerun: (request: SearchRequest) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const templates: { label: string; description: string; request: SearchRequest }[] = [
  {
    label: 'Brand Monitoring',
    description: 'All platforms, 50 posts',
    request: { keywords: [], maxPosts: 50, platforms: ['twitter', 'instagram', 'facebook', 'linkedin'] },
  },
  {
    label: 'Competitor Check',
    description: 'Twitter + LinkedIn, 30 posts',
    request: { keywords: [], maxPosts: 30, platforms: ['twitter', 'linkedin'] },
  },
  {
    label: 'Crisis Detection',
    description: 'All platforms, 100 posts',
    request: { keywords: [], maxPosts: 100, platforms: ['twitter', 'instagram', 'facebook', 'linkedin'] },
  },
  {
    label: 'Campaign Analysis',
    description: 'Instagram + Facebook, 50 posts',
    request: { keywords: [], maxPosts: 50, platforms: ['instagram', 'facebook'] },
  },
];

export function SearchHistory({ history, onRerun, onRemove, onClear }: SearchHistoryProps) {
  return (
    <div className="space-y-6">
      {/* Templates */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Templates</h3>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t.label}
              onClick={() => onRerun(t.request)}
              className="flex flex-col items-start rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent/30"
            >
              <span className="text-sm font-medium text-foreground">{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Searches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Searches</h3>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} className="text-xs h-7 text-muted-foreground">
              Clear All
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8">
            <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No recent searches</p>
            <p className="text-xs text-muted-foreground/60">Your search history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 group"
              >
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {entry.request.keywords.join(', ') || 'Unnamed search'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                    </span>
                    {entry.resultsCount !== undefined && (
                      <Badge variant="secondary" className="text-xs h-5">{entry.resultsCount} posts</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRerun(entry.request)}>
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => onRemove(entry.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
