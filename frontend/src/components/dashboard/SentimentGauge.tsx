import { cn } from '@/lib/utils';

interface SentimentGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

export function SentimentGauge({ score, size = 'lg' }: SentimentGaugeProps) {
  const getSentimentLabel = () => {
    if (score >= 70) return 'Positive';
    if (score >= 40) return 'Neutral';
    return 'Negative';
  };

  const getSentimentColor = () => {
    if (score >= 70) return 'text-sentiment-positive';
    if (score >= 40) return 'text-sentiment-neutral';
    return 'text-sentiment-negative';
  };

  const getGradient = () => {
    if (score >= 70) return 'from-sentiment-positive to-emerald-400';
    if (score >= 40) return 'from-sentiment-neutral to-slate-400';
    return 'from-sentiment-negative to-red-400';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const dimensions = {
    sm: { container: 'h-24 w-24', text: 'text-2xl', label: 'text-xs' },
    md: { container: 'h-32 w-32', text: 'text-3xl', label: 'text-sm' },
    lg: { container: 'h-44 w-44', text: 'text-4xl', label: 'text-sm' },
  };

  return (
    <div className={cn("relative", dimensions[size].container)}>
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke="url(#sentimentGradient)"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={cn("stop-color-current", getSentimentColor())} />
            <stop offset="100%" className={cn("stop-color-current", getSentimentColor())} style={{ opacity: 0.6 }} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", dimensions[size].text, getSentimentColor())}>
          {score}
        </span>
        <span className={cn("text-muted-foreground mt-1", dimensions[size].label)}>
          {getSentimentLabel()}
        </span>
      </div>
    </div>
  );
}
