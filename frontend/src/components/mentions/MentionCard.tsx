import { Twitter, Instagram, Facebook, Linkedin, Heart, MessageCircle, Share2, Star, ExternalLink } from 'lucide-react';
import { SentimentPost, Platform, Sentiment } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MentionCardProps {
  post: SentimentPost;
}

const platformIcons: Record<Platform, React.ElementType> = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
};

const platformColors: Record<Platform, string> = {
  twitter: 'text-platform-twitter',
  instagram: 'text-platform-instagram',
  facebook: 'text-platform-facebook',
  linkedin: 'text-platform-linkedin',
};

export function MentionCard({ post }: MentionCardProps) {
  const PlatformIcon = platformIcons[post.platform];

  const getSentimentBadge = (sentiment: Sentiment) => {
    const styles = {
      positive: 'bg-sentiment-positive/10 text-sentiment-positive border-sentiment-positive/20',
      negative: 'bg-sentiment-negative/10 text-sentiment-negative border-sentiment-negative/20',
      neutral: 'bg-muted text-muted-foreground border-muted',
    };
    return styles[sentiment];
  };

  const totalEngagement = post.engagement.likes + post.engagement.comments + post.engagement.shares;

  return (
    <div className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-background">
            <AvatarImage src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.authorHandle}`} />
            <AvatarFallback>{post.author.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{post.author}</span>
              {post.isInfluencer && (
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{post.authorHandle}</span>
              <span>•</span>
              <PlatformIcon className={cn("h-4 w-4", platformColors[post.platform])} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs font-medium", getSentimentBadge(post.sentiment))}>
            {post.sentiment}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {(post.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Content */}
      <p className="mt-4 text-sm text-foreground leading-relaxed">{post.content}</p>

      {/* Emotions */}
      {post.emotions && post.emotions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.emotions.map((emotion) => (
            <span
              key={emotion}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {emotion}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4" />
            <span className="text-sm">{post.engagement.likes.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{post.engagement.comments.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Share2 className="h-4 w-4" />
            <span className="text-sm">{post.engagement.shares.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(post.timestamp, { addSuffix: true })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
