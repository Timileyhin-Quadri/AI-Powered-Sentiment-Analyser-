import { Twitter, Instagram, Facebook, Linkedin, X, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { SearchProgress, SearchStatus } from '@/hooks/useSearchManager';

interface SearchProgressModalProps {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  status: SearchStatus;
  progress: SearchProgress;
  keywords: string[];
}

const platformIcons: Record<string, React.ElementType> = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
};

const platformLabels: Record<string, string> = {
  twitter: 'Twitter/X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
};

const statusMessages: Record<string, string> = {
  waiting: 'Waiting...',
  scraping: 'Scraping posts...',
  complete: 'Complete',
  failed: 'Failed',
};

export function SearchProgressModal({ open, onClose, onCancel, status, progress, keywords }: SearchProgressModalProps) {
  const overallPercent = progress.totalPlatforms > 0
    ? Math.round((progress.platformsCompleted / progress.totalPlatforms) * 100)
    : 0;

  const isActive = status === 'scraping' || status === 'analyzing' || status === 'validating';
  const isDone = status === 'complete';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && (isDone ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => isActive && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isDone ? 'Analysis Complete' : `Analyzing "${keywords.join(', ')}"`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Ring */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-secondary" />
                <circle
                  cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                  className="stroke-primary transition-all duration-500"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - (isDone ? 1 : overallPercent / 100))}`}
                />
              </svg>
              <span className="absolute text-2xl font-bold text-foreground">
                {isDone ? '100%' : `${overallPercent}%`}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {status === 'validating' && 'Validating inputs...'}
              {status === 'scraping' && `Scraping ${progress.currentPlatform ? platformLabels[progress.currentPlatform] : ''}...`}
              {status === 'analyzing' && 'Running sentiment analysis...'}
              {status === 'complete' && 'All platforms analyzed successfully!'}
              {status === 'error' && 'An error occurred.'}
            </p>
          </div>

          {/* Platform Status List */}
          <div className="space-y-3">
            {Object.entries(progress.platformStatuses).map(([platform, pStatus]) => {
              const Icon = platformIcons[platform] || Clock;
              return (
                <div key={platform} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  <Icon className={cn('h-5 w-5', `text-platform-${platform}`)} />
                  <span className="flex-1 text-sm font-medium text-foreground">{platformLabels[platform] || platform}</span>
                  <div className="flex items-center gap-2">
                    {pStatus === 'waiting' && <Clock className="h-4 w-4 text-muted-foreground" />}
                    {pStatus === 'scraping' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {pStatus === 'complete' && <CheckCircle2 className="h-4 w-4 text-sentiment-positive" />}
                    {pStatus === 'failed' && <XCircle className="h-4 w-4 text-sentiment-negative" />}
                    <span className={cn('text-xs', {
                      'text-muted-foreground': pStatus === 'waiting',
                      'text-primary': pStatus === 'scraping',
                      'text-sentiment-positive': pStatus === 'complete',
                      'text-sentiment-negative': pStatus === 'failed',
                    })}>
                      {statusMessages[pStatus]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time & Posts */}
          {isActive && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.postsCollected} posts collected</span>
              {progress.estimatedTimeRemaining && (
                <span>~{progress.estimatedTimeRemaining}s remaining</span>
              )}
            </div>
          )}

          {/* Overall progress bar */}
          <Progress value={isDone ? 100 : overallPercent} className="h-2" />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isActive && (
              <Button variant="destructive" size="sm" onClick={onCancel}>
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
            )}
            {isDone && (
              <Button size="sm" onClick={onClose}>
                View Results
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
