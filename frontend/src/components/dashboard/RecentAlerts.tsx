import { AlertTriangle, TrendingDown, Flame, Users } from 'lucide-react';
import { alerts } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Alert as AlertType } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export function RecentAlerts() {
  const getAlertIcon = (type: AlertType['type']) => {
    switch (type) {
      case 'sentiment_drop':
        return TrendingDown;
      case 'viral_post':
        return Flame;
      case 'high_volume':
        return AlertTriangle;
      case 'competitor_mention':
        return Users;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityStyles = (severity: AlertType['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-l-sentiment-negative bg-sentiment-negative/5';
      case 'medium':
        return 'border-l-amber-500 bg-amber-500/5';
      case 'low':
        return 'border-l-primary bg-primary/5';
      default:
        return 'border-l-muted bg-muted/5';
    }
  };

  const recentAlerts = alerts.slice(0, 4);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Alerts</h3>
          <p className="text-sm text-muted-foreground">Latest notifications</p>
        </div>
        <span className="flex h-6 items-center rounded-full bg-sentiment-negative/10 px-2 text-xs font-semibold text-sentiment-negative">
          {alerts.filter(a => !a.read).length} unread
        </span>
      </div>

      <div className="space-y-3">
        {recentAlerts.map((alert) => {
          const Icon = getAlertIcon(alert.type);
          return (
            <div
              key={alert.id}
              className={cn(
                "rounded-lg border-l-4 p-4 transition-all hover:shadow-sm",
                getSeverityStyles(alert.severity),
                !alert.read && "ring-1 ring-border"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  alert.severity === 'high' && 'bg-sentiment-negative/10 text-sentiment-negative',
                  alert.severity === 'medium' && 'bg-amber-500/10 text-amber-500',
                  alert.severity === 'low' && 'bg-primary/10 text-primary'
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
                    {!alert.read && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse-subtle" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {alert.message}
                  </p>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
