import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { categoryData as defaultCategoryData, sentimentPosts as defaultSentimentPosts } from '@/data/mockData';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Headphones,
  Smartphone,
  CreditCard,
  WifiOff,
  Truck,
  AlertCircle,
  ShieldAlert,
  DollarSign,
  FileText,
  Users,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MentionCard } from '@/components/mentions/MentionCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { ComplaintCategory, SentimentPost } from '@/types';
import type { SearchResults } from '@/lib/api/sentimentApi';

const categoryIcons: Record<string, React.ElementType> = {
  // Extended 11 categories
  'Customer Support & Service': Headphones,
  'App & Digital Platform': Smartphone,
  'Billing & Transaction Reversals': CreditCard,
  'Network & Server Downtime': WifiOff,
  'Delivery & Logistics': Truck,
  'Product Quality & Defects': AlertCircle,
  'Account Security & Fraud': ShieldAlert,
  'Pricing & Unfair Fees': DollarSign,
  'Policy & Terms Transparency': FileText,
  'Staff Conduct & Professionalism': Users,
  'Other Issues': HelpCircle,

  // Legacy mappings
  service_issues: Headphones,
  'Service Issues': Headphones,
  product_quality: AlertCircle,
  'Product Quality': AlertCircle,
  pricing_concerns: DollarSign,
  'Pricing Concerns': DollarSign,
  delivery_problems: Truck,
  'Delivery Problems': Truck,
  technical_issues: Smartphone,
  'App/Technical': Smartphone,
  'App/Technical Issues': Smartphone,
  'Other': HelpCircle,
};

const categoryColors: Record<string, string> = {
  'Customer Support & Service': 'hsl(215, 85%, 55%)',
  'App & Digital Platform': 'hsl(195, 90%, 45%)',
  'Billing & Transaction Reversals': 'hsl(0, 84%, 60%)',
  'Network & Server Downtime': 'hsl(280, 75%, 60%)',
  'Delivery & Logistics': 'hsl(25, 95%, 53%)',
  'Product Quality & Defects': 'hsl(38, 92%, 50%)',
  'Account Security & Fraud': 'hsl(345, 85%, 55%)',
  'Pricing & Unfair Fees': 'hsl(48, 96%, 48%)',
  'Policy & Terms Transparency': 'hsl(160, 70%, 45%)',
  'Staff Conduct & Professionalism': 'hsl(240, 70%, 65%)',
  'Other Issues': 'hsl(210, 20%, 60%)',

  // Legacy mappings
  service_issues: 'hsl(215, 85%, 55%)',
  'Service Issues': 'hsl(215, 85%, 55%)',
  product_quality: 'hsl(38, 92%, 50%)',
  'Product Quality': 'hsl(38, 92%, 50%)',
  pricing_concerns: 'hsl(48, 96%, 48%)',
  'Pricing Concerns': 'hsl(48, 96%, 48%)',
  delivery_problems: 'hsl(25, 95%, 53%)',
  'Delivery Problems': 'hsl(25, 95%, 53%)',
  technical_issues: 'hsl(195, 90%, 45%)',
  'App/Technical': 'hsl(195, 90%, 45%)',
  'App/Technical Issues': 'hsl(195, 90%, 45%)',
};

export default function Complaints() {
  const navigate = useNavigate();
  const [isFromLiveSearch, setIsFromLiveSearch] = useState(false);
  const [categories, setCategories] = useState(defaultCategoryData);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<{ summary: string; key_themes: string[]; recommendation: string } | null>(null);
  const [complaintPosts, setComplaintPosts] = useState<SentimentPost[]>(
    defaultSentimentPosts.filter((p) => p.sentiment === 'negative')
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem('sentitrack_last_search_results');
      if (raw) {
        const results: SearchResults = JSON.parse(raw);
        if (results.complaints && Object.keys(results.complaints.categories).length > 0) {
          setIsFromLiveSearch(true);

          if (results.ai_insights) {
            setAiInsights(results.ai_insights);
          }

          // Map live complaint categories across the extended taxonomy
          const mappedCats = Object.entries(results.complaints.categories).map(([name, cat]) => ({
            category: name as ComplaintCategory,
            label: name,
            count: cat.count,
            percentage: cat.percentage,
            trend: (cat.count > 2 ? 'up' : 'down') as 'up' | 'down' | 'stable',
          }));
          setCategories(mappedCats);

          // Map live negative posts with their extended category
          const liveNegative = results.posts
            .filter((p) => p.sentiment.toLowerCase() === 'negative')
            .map((p, idx) => ({
              id: `live-neg-${idx}`,
              content: p.text,
              author: p.author || 'Customer Voice',
              authorHandle: p.authorHandle || '@user',
              platform: (p.platform as any) || 'twitter',
              timestamp: new Date(p.timestamp || Date.now()),
              sentiment: 'negative' as const,
              confidence: p.confidence || 0.88,
              engagement: p.engagement || { likes: 12, comments: 4, shares: 1 },
              emotions: p.emotion ? [p.emotion] : ['frustration'],
              category: (p.complaint_category as any) || 'Other Issues',
              language: 'en',
            }));

          if (liveNegative.length > 0) {
            setComplaintPosts(liveNegative);
          }
        }
      }
    } catch (e) {
      console.warn('Error reading live complaints:', e);
    }
  }, []);

  const totalComplaints = categories.reduce((sum, c) => sum + c.count, 0);

  const filteredPosts = selectedCategory
    ? complaintPosts.filter((p) => p.category === selectedCategory || (p as any).complaint_category === selectedCategory)
    : complaintPosts;

  const pieData = categories.map((c) => ({
    name: c.label,
    value: c.count,
    color: categoryColors[c.label] || categoryColors[c.category] || 'hsl(var(--primary))',
  }));

  return (
    <Layout title="Complaints" subtitle="Analyze and categorize customer complaints & pain points">
      <div className="space-y-6 animate-fade-in">
        {/* Banner */}
        {isFromLiveSearch ? (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Live complaints active</span> — showing negative feedback analyzed from your latest brand scan.
            </p>
            <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => navigate('/search')}>
              <RefreshCw className="h-3.5 w-3.5" />
              Scan Another Brand
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">sample Nigerian brand complaints</span>. Run a live search to categorize real issues.
            </p>
            <Button size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => navigate('/search')}>
              Start Live Scan
            </Button>
          </div>
        )}

        {/* AI Executive Diagnosis (5-mini) */}
        {aiInsights && (
          <div className="rounded-xl border border-primary/30 bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Executive Complaint Diagnosis
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Synthesized by gpt-5-mini from scanned customer grievances
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                5-mini Intelligence
              </span>
            </div>

            <p className="text-sm leading-relaxed text-foreground/90">
              {aiInsights.summary}
            </p>

            {aiInsights.key_themes && aiInsights.key_themes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Key Recurring Grievances
                </span>
                <div className="flex flex-wrap gap-2">
                  {aiInsights.key_themes.map((theme, i) => (
                    <span
                      key={i}
                      className="rounded-lg border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      ⚠️ {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {aiInsights.recommendation && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold text-foreground">Recommended Remediation: </span>
                  <span className="text-muted-foreground">{aiInsights.recommendation}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats / Category Tiles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Smart Categories (Click to filter)
            </span>
            {selectedCategory && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedCategory(null)}
              >
                Clear Filter ({selectedCategory})
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = categoryIcons[category.label] || categoryIcons[category.category] || AlertTriangle;
              const color = categoryColors[category.label] || categoryColors[category.category] || 'hsl(var(--primary))';
              const isSelected = selectedCategory === category.label;
              return (
                <button
                  key={category.label}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : category.label)}
                  className={cn(
                    "text-left rounded-xl border bg-card p-4 shadow-card transition-all hover:border-primary/50",
                    isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground truncate">{category.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-foreground">{category.count}</span>
                        <div className={cn(
                          "flex items-center gap-0.5 text-xs",
                          category.trend === 'up' ? 'text-sentiment-negative' :
                          category.trend === 'down' ? 'text-sentiment-positive' : 'text-muted-foreground'
                        )}>
                          {category.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                          {category.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                          {category.trend === 'stable' && <Minus className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Distribution Chart */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Category Distribution</h3>
              <p className="text-sm text-muted-foreground">{totalComplaints} total complaints</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-sentiment-negative" />
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {categories.map((category) => (
                <div
                  key={category.label}
                  onClick={() => setSelectedCategory(selectedCategory === category.label ? null : category.label)}
                  className={cn(
                    "flex items-center justify-between text-sm p-1 rounded cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedCategory === category.label ? "bg-muted font-semibold" : ""
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: categoryColors[category.label] || categoryColors[category.category] || 'hsl(var(--primary))' }}
                    />
                    <span className="text-muted-foreground">{category.label}</span>
                  </div>
                  <span className="font-medium text-foreground">{category.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Recent Complaints & Issues</h3>
                {selectedCategory && (
                  <p className="text-xs text-primary font-medium">
                    Filtered by: {selectedCategory}
                  </p>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{filteredPosts.length} complaints</span>
            </div>
            <div className="space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <MentionCard key={post.id} post={post} />
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
                  No complaints found for category "{selectedCategory}".
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
