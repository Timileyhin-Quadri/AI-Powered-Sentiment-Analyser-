import { Layout } from '@/components/layout/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { sentimentTrends, emotionData } from '@/data/mockData';

export default function Analytics() {
  return (
    <Layout title="Analytics" subtitle="Deep dive into sentiment data and trends">
      <div className="space-y-6 animate-fade-in">
        {/* Volume Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Mention Volume</h3>
            <p className="text-sm text-muted-foreground">Daily mention count by sentiment</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  }}
                />
                <Bar dataKey="positive" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} name="Positive" />
                <Bar dataKey="neutral" fill="hsl(215, 16%, 47%)" radius={[4, 4, 0, 0]} name="Neutral" />
                <Bar dataKey="negative" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Negative" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Emotion Analysis */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Emotion Analysis</h3>
              <p className="text-sm text-muted-foreground">Detected emotions in mentions</p>
            </div>
            <div className="space-y-4">
              {emotionData.map((item) => (
                <div key={item.emotion} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.emotion}</span>
                    <span className="text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Rate */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Engagement Rate</h3>
              <p className="text-sm text-muted-foreground">Average engagement over time</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    name="Total Engagement"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
