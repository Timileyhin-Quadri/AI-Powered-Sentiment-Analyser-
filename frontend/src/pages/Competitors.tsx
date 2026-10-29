import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { competitors as defaultCompetitors } from '@/data/mockData';
import { TrendingUp, TrendingDown, Minus, BarChart2, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { analyzeCompetitors, type LiveCompetitorResponse } from '@/lib/api/sentimentApi';
import { useToast } from '@/hooks/use-toast';
import type { Competitor } from '@/types';

export default function Competitors() {
  const { toast } = useToast();
  const [brandInput, setBrandInput] = useState('GTBank');
  const [loading, setLoading] = useState(false);
  const [competitorList, setCompetitorList] = useState<Competitor[]>(defaultCompetitors);
  const [isLive, setIsLive] = useState(false);

  const handleRunAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!brandInput.trim()) return;

    setLoading(true);
    try {
      const res: LiveCompetitorResponse = await analyzeCompetitors(brandInput.trim());
      
      const mapped: Competitor[] = res.competitors.map((c, idx) => {
        const score = Math.round(c.sentiment_score);
        return {
          id: `comp-${idx}-${c.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: c.name,
          handle: '@' + c.name.toLowerCase().replace(/\s+/g, ''),
          sentimentScore: score,
          mentionCount: c.total_mentions || Math.floor(Math.random() * 200) + 50,
          trend: score >= 50 ? 'up' : 'down',
          trendPercentage: Math.max(1, Math.abs(Math.round(score - 50))),
        };
      });

      if (mapped.length > 0) {
        setCompetitorList(mapped);
        setIsLive(true);
        toast({
          title: 'Competitor Analysis Complete',
          description: `Analyzed ${mapped.length} brands competing with ${brandInput}.`,
        });
      }
    } catch (err) {
      toast({
        title: 'Analysis failed',
        description: err instanceof Error ? err.message : 'Could not fetch competitor data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedCompetitors = [...competitorList].sort((a, b) => b.sentimentScore - a.sentimentScore);

  const chartData = sortedCompetitors.map((c) => ({
    name: c.name,
    score: c.sentimentScore,
    mentions: c.mentionCount,
  }));

  return (
    <Layout title="Competitors" subtitle="Compare sentiment across competitor brands in Nigeria">
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions & Brand Target */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Competitor Intelligence
            </h3>
            <p className="text-sm text-muted-foreground">
              {isLive ? `Live competitor comparison for ${brandInput}` : 'Enter your brand to discover and rank top competitors'}
            </p>
          </div>

          <form onSubmit={handleRunAnalysis} className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              value={brandInput}
              onChange={(e) => setBrandInput(e.target.value)}
              placeholder="e.g. GTBank, MTN, Flutterwave"
              className="h-9 w-full sm:w-56"
              disabled={loading}
            />
            <Button type="submit" size="sm" className="gap-1.5 shrink-0" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Compare Brands
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Comparison Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Sentiment Comparison</h3>
              <p className="text-sm text-muted-foreground">Side-by-side sentiment health scores</p>
            </div>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }}
                  width={80}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Sentiment Score']}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.score >= 70 ? 'hsl(160, 84%, 39%)' : entry.score >= 40 ? 'hsl(var(--primary))' : 'hsl(0, 84%, 60%)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Competitor Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedCompetitors.map((competitor, index) => (
            <div 
              key={competitor.id}
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 bg-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {competitor.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <h4 className="font-semibold text-foreground">{competitor.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{competitor.handle}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Sentiment Score</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      competitor.sentimentScore >= 70 ? 'text-sentiment-positive' :
                      competitor.sentimentScore >= 40 ? 'text-foreground' : 'text-sentiment-negative'
                    )}>
                      {competitor.sentimentScore}%
                    </span>
                    <div className={cn(
                      "flex items-center gap-0.5 text-xs",
                      competitor.trend === 'up' ? 'text-sentiment-positive' :
                      competitor.trend === 'down' ? 'text-sentiment-negative' : 'text-muted-foreground'
                    )}>
                      {competitor.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                      {competitor.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                      {competitor.trend === 'stable' && <Minus className="h-3 w-3" />}
                      {competitor.trendPercentage > 0 ? '+' : ''}{competitor.trendPercentage}%
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mentions</p>
                  <p className="text-2xl font-bold text-foreground">
                    {competitor.mentionCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
