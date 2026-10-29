import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplaintsData, SearchResultPost } from '@/lib/api/sentimentApi';
import { PostCard } from './PostCard';

const categoryIcons: Record<string, { icon: React.ElementType; emoji: string }> = {
  // Extended 11 Smart Categories
  'Customer Support & Service': { icon: Headphones, emoji: '🎧' },
  'App & Digital Platform': { icon: Smartphone, emoji: '📱' },
  'Billing & Transaction Reversals': { icon: CreditCard, emoji: '💳' },
  'Network & Server Downtime': { icon: WifiOff, emoji: '📡' },
  'Delivery & Logistics': { icon: Truck, emoji: '🚚' },
  'Product Quality & Defects': { icon: AlertCircle, emoji: '🔍' },
  'Account Security & Fraud': { icon: ShieldAlert, emoji: '🔒' },
  'Pricing & Unfair Fees': { icon: DollarSign, emoji: '💰' },
  'Policy & Terms Transparency': { icon: FileText, emoji: '📜' },
  'Staff Conduct & Professionalism': { icon: Users, emoji: '👥' },
  'Other Issues': { icon: HelpCircle, emoji: '⚠️' },

  // Compatibility / Legacy mappings
  'Service Issues': { icon: Headphones, emoji: '🎧' },
  'Product Quality': { icon: AlertCircle, emoji: '📦' },
  'Pricing Concerns': { icon: DollarSign, emoji: '💰' },
  'Delivery Problems': { icon: Truck, emoji: '🚚' },
  'App/Technical Issues': { icon: Smartphone, emoji: '📱' },
  'Other': { icon: HelpCircle, emoji: '⚠️' },
};

interface ComplaintPanelProps {
  complaints: ComplaintsData;
  posts: SearchResultPost[];
}

export function ComplaintPanel({ complaints, posts }: ComplaintPanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (complaints.total === 0) return null;

  const sortedCategories = Object.entries(complaints.categories).sort(([, a], [, b]) => b.count - a.count);
  const maxCount = sortedCategories.length > 0 ? sortedCategories[0][1].count : 1;

  return (
    <div className="rounded-xl border border-[hsl(var(--sentiment-negative))]/20 bg-card p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-[hsl(var(--sentiment-negative))]" />
        <h3 className="text-base font-semibold text-foreground">
          Customer Complaints ({complaints.total} total)
        </h3>
      </div>

      <div className="space-y-3">
        {sortedCategories.map(([category, data]) => {
          const config = categoryIcons[category] || categoryIcons['Other'];
          const isExpanded = expandedCategory === category;
          const barWidth = (data.count / maxCount) * 100;
          const categoryPosts = (data.posts || [])
            .map((idx) => posts[idx])
            .filter(Boolean);

          return (
            <div key={category}>
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2 mb-1">
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm">{config.emoji}</span>
                  <span className="text-sm font-medium text-foreground flex-1">{category}</span>
                  <span className="text-sm font-semibold text-foreground">{data.percentage.toFixed(0)}%</span>
                  <span className="text-xs text-muted-foreground">({data.count} posts)</span>
                </div>
                {/* Bar */}
                <div className="ml-8 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[hsl(var(--sentiment-negative))] transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </button>

              {isExpanded && categoryPosts.length > 0 && (
                <div className="ml-8 mt-3 space-y-2">
                  {categoryPosts.map((post, i) => (
                    <PostCard key={i} post={post} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
