import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'neutral';
}

export function MetricCard({ 
  title, 
  value, 
  trend, 
  trendLabel,
  icon,
  variant = 'default' 
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp className="h-3 w-3" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (trend === undefined) return '';
    if (trend > 0) return 'text-sentiment-positive';
    if (trend < 0) return 'text-sentiment-negative';
    return 'text-muted-foreground';
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              "mt-2 text-3xl font-bold tracking-tight",
              variant === 'positive' && 'text-sentiment-positive',
              variant === 'negative' && 'text-sentiment-negative',
              variant === 'neutral' && 'text-sentiment-neutral',
              variant === 'default' && 'text-foreground'
            )}>
              {value}
            </p>
          </div>
          {icon && (
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              variant === 'positive' && 'bg-sentiment-positive/10 text-sentiment-positive',
              variant === 'negative' && 'bg-sentiment-negative/10 text-sentiment-negative',
              variant === 'neutral' && 'bg-muted text-muted-foreground',
              variant === 'default' && 'bg-primary/10 text-primary'
            )}>
              {icon}
            </div>
          )}
        </div>
        
        {trend !== undefined && (
          <div className={cn("mt-3 flex items-center gap-1 text-sm", getTrendColor())}>
            {getTrendIcon()}
            <span className="font-medium">{Math.abs(trend)}%</span>
            {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
