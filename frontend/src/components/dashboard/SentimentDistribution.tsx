import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { dashboardMetrics } from '@/data/mockData';

const COLORS = {
  positive: 'hsl(160, 84%, 39%)',
  negative: 'hsl(0, 84%, 60%)',
  neutral: 'hsl(215, 16%, 47%)',
};

export function SentimentDistribution() {
  const data = [
    { name: 'Positive', value: dashboardMetrics.positiveCount, color: COLORS.positive },
    { name: 'Negative', value: dashboardMetrics.negativeCount, color: COLORS.negative },
    { name: 'Neutral', value: dashboardMetrics.neutralCount, color: COLORS.neutral },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Sentiment Distribution</h3>
        <p className="text-sm text-muted-foreground">Overall breakdown</p>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [
                  `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{total.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="h-3 w-3 rounded-full" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                {item.value.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
