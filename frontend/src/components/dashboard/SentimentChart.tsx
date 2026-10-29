import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { sentimentTrends } from '@/data/mockData';

export function SentimentChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Sentiment Trends</h3>
        <p className="text-sm text-muted-foreground">Weekly sentiment distribution</p>
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sentimentTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(215, 16%, 47%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(215, 16%, 47%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="positive"
              stackId="1"
              stroke="hsl(160, 84%, 39%)"
              strokeWidth={2}
              fill="url(#positiveGradient)"
              name="Positive"
            />
            <Area
              type="monotone"
              dataKey="neutral"
              stackId="1"
              stroke="hsl(215, 16%, 47%)"
              strokeWidth={2}
              fill="url(#neutralGradient)"
              name="Neutral"
            />
            <Area
              type="monotone"
              dataKey="negative"
              stackId="1"
              stroke="hsl(0, 84%, 60%)"
              strokeWidth={2}
              fill="url(#negativeGradient)"
              name="Negative"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-sentiment-positive" />
          <span className="text-sm text-muted-foreground">Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-sentiment-neutral" />
          <span className="text-sm text-muted-foreground">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-sentiment-negative" />
          <span className="text-sm text-muted-foreground">Negative</span>
        </div>
      </div>
    </div>
  );
}
