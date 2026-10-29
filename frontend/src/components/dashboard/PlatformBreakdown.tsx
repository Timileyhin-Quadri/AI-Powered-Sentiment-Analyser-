import { Twitter, Instagram, Facebook, Linkedin, TrendingUp, TrendingDown } from 'lucide-react';
import { platformMetrics } from '@/data/mockData';
import { Platform } from '@/types';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const platformConfig: Record<Platform, { icon: React.ElementType; label: string; color: string; chartColor: string }> = {
  twitter: { icon: Twitter, label: 'Twitter/X', color: 'text-platform-twitter', chartColor: 'hsl(203, 89%, 53%)' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-platform-instagram', chartColor: 'hsl(340, 82%, 52%)' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'text-platform-facebook', chartColor: 'hsl(214, 89%, 52%)' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-platform-linkedin', chartColor: 'hsl(210, 96%, 40%)' },
};

const chartData = platformMetrics.map(m => ({
  name: platformConfig[m.platform].label,
  value: m.totalPosts,
  color: platformConfig[m.platform].chartColor,
}));

const totalPosts = platformMetrics.reduce((sum, m) => sum + m.totalPosts, 0);

export function PlatformBreakdown() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Platform Breakdown</h3>
        <p className="text-sm text-muted-foreground">Mentions across platforms</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <div className="flex items-center justify-center">
          <div className="relative h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} posts`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{(totalPosts / 1000).toFixed(1)}k</span>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="space-y-3">
          {platformMetrics.map((metric) => {
            const config = platformConfig[metric.platform];
            const Icon = config.icon;
            const percentage = ((metric.totalPosts / totalPosts) * 100).toFixed(1);
            return (
              <div key={metric.platform} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${config.chartColor}15` }}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{config.label}</span>
                    <span className="text-sm font-semibold text-foreground">{metric.totalPosts.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-muted-foreground">{percentage}% of total</span>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-xs font-medium",
                        metric.sentimentScore >= 70 ? 'text-sentiment-positive' : 
                        metric.sentimentScore >= 50 ? 'text-foreground' : 'text-sentiment-negative'
                      )}>
                        {metric.sentimentScore}%
                      </span>
                      {metric.trending ? (
                        <TrendingUp className="h-3 w-3 text-sentiment-positive" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-sentiment-negative" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
