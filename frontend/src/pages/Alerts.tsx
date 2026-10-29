import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { alerts } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AlertTriangle, TrendingDown, Flame, Users, Check, Bell, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Alert as AlertType } from '@/types';

export default function Alerts() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(a => !a.read) 
    : alerts;

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
        return {
          border: 'border-l-sentiment-negative',
          bg: 'bg-sentiment-negative/5',
          icon: 'bg-sentiment-negative/10 text-sentiment-negative',
          badge: 'bg-sentiment-negative/10 text-sentiment-negative',
        };
      case 'medium':
        return {
          border: 'border-l-amber-500',
          bg: 'bg-amber-500/5',
          icon: 'bg-amber-500/10 text-amber-500',
          badge: 'bg-amber-500/10 text-amber-500',
        };
      case 'low':
        return {
          border: 'border-l-primary',
          bg: 'bg-primary/5',
          icon: 'bg-primary/10 text-primary',
          badge: 'bg-primary/10 text-primary',
        };
      default:
        return {
          border: 'border-l-muted',
          bg: 'bg-muted/5',
          icon: 'bg-muted/10 text-muted-foreground',
          badge: 'bg-muted text-muted-foreground',
        };
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <Layout title="Alerts" subtitle="Stay on top of important brand events">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === 'all'
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Alerts
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === 'unread'
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sentiment-negative text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Check className="h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const styles = getSeverityStyles(alert.severity);
            
            return (
              <div
                key={alert.id}
                className={cn(
                  "rounded-xl border border-border border-l-4 p-5 transition-all hover:shadow-sm",
                  styles.border,
                  styles.bg,
                  !alert.read && "ring-1 ring-border"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", styles.icon)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{alert.title}</h4>
                          {!alert.read && (
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-subtle" />
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", styles.badge)}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View Details
                      </Button>
                      {!alert.read && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-16">
            <Bell className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-foreground">No alerts</p>
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
