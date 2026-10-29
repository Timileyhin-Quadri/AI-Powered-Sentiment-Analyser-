import { Layout } from '@/components/layout/Layout';
import { Twitter, Instagram, Facebook, Linkedin, TrendingUp, TrendingDown, Minus, BarChart2, Activity } from 'lucide-react';
import { platformMetrics } from '@/data/mockData';
import { Platform } from '@/types';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from 'recharts';

const platformConfig: Record<Platform, { icon: React.ElementType; label: string; color: string; chartColor: string }> = {
  twitter: { icon: Twitter, label: 'Twitter/X', color: 'text-platform-twitter', chartColor: 'hsl(203, 89%, 53%)' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-platform-instagram', chartColor: 'hsl(340, 82%, 52%)' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'text-platform-facebook', chartColor: 'hsl(214, 89%, 52%)' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-platform-linkedin', chartColor: 'hsl(210, 96%, 40%)' },
};

// Cross-platform sentiment timeline mock
const timelineData = [
  { date: 'Mon', twitter: 72, instagram: 78, facebook: 60, linkedin: 85 },
  { date: 'Tue', twitter: 68, instagram: 80, facebook: 62, linkedin: 82 },
  { date: 'Wed', twitter: 65, instagram: 75, facebook: 58, linkedin: 80 },
  { date: 'Thu', twitter: 70, instagram: 82, facebook: 65, linkedin: 84 },
  { date: 'Fri', twitter: 74, instagram: 79, facebook: 63, linkedin: 86 },
  { date: 'Sat', twitter: 69, instagram: 76, facebook: 59, linkedin: 81 },
  { date: 'Sun', twitter: 66, instagram: 74, facebook: 57, linkedin: 83 },
];

const sentimentComparisonData = platformMetrics.map(m => ({
  name: platformConfig[m.platform].label,
  positive: m.positiveCount,
  negative: m.negativeCount,
  neutral: m.neutralCount,
  color: platformConfig[m.platform].chartColor,
}));

export default function Platforms() {
  const bestPlatform = [...platformMetrics].sort((a, b) => b.sentimentScore - a.sentimentScore)[0];

  return (
    <Layout title="Platform Analytics" subtitle="Cross-platform performance and insights">
      <div className="space-y-6 animate-fade-in">
        {/* Platform Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platformMetrics.map((metric) => {
            const config = platformConfig[metric.platform];
            const Icon = config.icon;
            return (
              <div key={metric.platform} className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${config.chartColor}15` }}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{config.label}</h4>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", metric.trending ? "bg-sentiment-positive" : "bg-muted-foreground/40")} />
                        <span className="text-xs text-muted-foreground">{metric.trending ? 'Trending' : 'Stable'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Mentions</p>
                    <p className="text-xl font-bold text-foreground">{metric.totalPosts.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sentiment</p>
                    <p className={cn(
                      "text-xl font-bold",
                      metric.sentimentScore >= 70 ? 'text-sentiment-positive' :
                      metric.sentimentScore >= 50 ? 'text-foreground' : 'text-sentiment-negative'
                    )}>
                      {metric.sentimentScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                    <p className="text-xl font-bold text-foreground">{metric.engagementRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Positive</p>
                    <p className="text-xl font-bold text-sentiment-positive">{((metric.positiveCount / metric.totalPosts) * 100).toFixed(0)}%</p>
                  </div>
                </div>

                {/* Health bar */}
                <div className="mt-4">
                  <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                    <div className="bg-sentiment-positive rounded-l-full" style={{ width: `${(metric.positiveCount / metric.totalPosts) * 100}%` }} />
                    <div className="bg-sentiment-neutral" style={{ width: `${(metric.neutralCount / metric.totalPosts) * 100}%` }} />
                    <div className="bg-sentiment-negative rounded-r-full" style={{ width: `${(metric.negativeCount / metric.totalPosts) * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cross-Platform Sentiment Timeline */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cross-Platform Sentiment Timeline</h3>
              <p className="text-sm text-muted-foreground">Sentiment score trends by platform</p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis domain={[40, 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="twitter" name="Twitter/X" stroke={platformConfig.twitter.chartColor} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="instagram" name="Instagram" stroke={platformConfig.instagram.chartColor} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="facebook" name="Facebook" stroke={platformConfig.facebook.chartColor} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="linkedin" name="LinkedIn" stroke={platformConfig.linkedin.chartColor} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution by Platform */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Sentiment Distribution by Platform</h3>
              <p className="text-sm text-muted-foreground">Positive, neutral, and negative breakdown</p>
            </div>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="positive" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} name="Positive" />
                <Bar dataKey="neutral" fill="hsl(215, 16%, 47%)" radius={[4, 4, 0, 0]} name="Neutral" />
                <Bar dataKey="negative" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Negative" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Insights */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Platform Insights</h3>
            <p className="text-sm text-muted-foreground">AI-powered recommendations</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-sentiment-positive" />
                <span className="text-sm font-medium text-foreground">Best Performing</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{platformConfig[bestPlatform.platform].label}</span> leads with a {bestPlatform.sentimentScore}% sentiment score and {bestPlatform.engagementRate}% engagement rate. Consider increasing activity here.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Cross-Platform Trend</span>
              </div>
              <p className="text-sm text-muted-foreground">
                LinkedIn shows the most consistent positive sentiment. Instagram has highest engagement rates. Consider tailoring content strategy per platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
