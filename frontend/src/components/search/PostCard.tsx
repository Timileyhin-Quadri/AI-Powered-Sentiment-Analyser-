import { Twitter, Instagram, Facebook, Linkedin, ThumbsUp, MessageCircle, Repeat2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { SearchResultPost } from '@/lib/api/sentimentApi';
import { formatDistanceToNow } from 'date-fns';

const platformConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  twitter: { icon: Twitter, label: 'Twitter', className: 'bg-[hsl(var(--platform-twitter))]/10 text-[hsl(var(--platform-twitter))]' },
  instagram: { icon: Instagram, label: 'Instagram', className: 'bg-[hsl(var(--platform-instagram))]/10 text-[hsl(var(--platform-instagram))]' },
  facebook: { icon: Facebook, label: 'Facebook', className: 'bg-[hsl(var(--platform-facebook))]/10 text-[hsl(var(--platform-facebook))]' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', className: 'bg-[hsl(var(--platform-linkedin))]/10 text-[hsl(var(--platform-linkedin))]' },
};

const sentimentConfig: Record<string, { label: string; className: string; emoji: string }> = {
  positive: { label: 'Positive', className: 'bg-[hsl(var(--sentiment-positive))]/10 text-[hsl(var(--sentiment-positive))]', emoji: '😊' },
  negative: { label: 'Negative', className: 'bg-[hsl(var(--sentiment-negative))]/10 text-[hsl(var(--sentiment-negative))]', emoji: '😠' },
  neutral: { label: 'Neutral', className: 'bg-[hsl(var(--sentiment-neutral))]/10 text-[hsl(var(--sentiment-neutral))]', emoji: '😐' },
};

const emotionEmojis: Record<string, string> = {
  joy: '😄', anger: '😡', sadness: '😢', fear: '😨', surprise: '😮', disgust: '🤢', trust: '🤝', anticipation: '🤔',
};

interface PostCardProps {
  post: SearchResultPost;
}

export function PostCard({ post }: PostCardProps) {
  const platform = platformConfig[post.platform] || platformConfig.twitter;
  const sentiment = sentimentConfig[post.sentiment] || sentimentConfig.neutral;
  const PlatformIcon = platform.icon;
  const confidencePct = Math.round(post.confidence * 100);

  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true });
  } catch {
    timeAgo = post.timestamp;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className={cn('gap-1.5 font-medium', platform.className)}>
          <PlatformIcon className="h-3.5 w-3.5" />
          {platform.label}
        </Badge>
        <div className="flex items-center gap-2">
          {post.emotion && (
            <span className="text-sm" title={post.emotion}>
              {emotionEmojis[post.emotion] || '💭'}
            </span>
          )}
          <Badge variant="outline" className={cn('gap-1', sentiment.className)}>
            {sentiment.emoji} {sentiment.label}
          </Badge>
        </div>
      </div>

      {/* Confidence */}
      <div className="mb-2">
        <span className="text-xs text-muted-foreground">Confidence: <span className="font-semibold text-foreground">{confidencePct}%</span></span>
      </div>

      {/* Post text */}
      <p className="text-sm text-foreground leading-relaxed mb-3">&ldquo;{post.text}&rdquo;</p>

      {/* Complaint category */}
      {post.complaint_category && (
        <Badge variant="outline" className="mb-3 bg-[hsl(var(--sentiment-negative))]/5 text-[hsl(var(--sentiment-negative))] text-xs">
          🛠️ {post.complaint_category}
        </Badge>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
        {post.engagement ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{post.engagement.likes}</span>
            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.engagement.comments}</span>
            <span className="flex items-center gap-1"><Repeat2 className="h-3 w-3" />{post.engagement.shares}</span>
          </div>
        ) : <div />}
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo}</span>
      </div>
    </div>
  );
}
