export type Platform = 'twitter' | 'instagram' | 'facebook' | 'linkedin';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type AlertType = 'sentiment_drop' | 'high_volume' | 'viral_post' | 'competitor_mention';
export type Severity = 'low' | 'medium' | 'high';
export type ComplaintCategory = 
  | 'Customer Support & Service'
  | 'App & Digital Platform'
  | 'Billing & Transaction Reversals'
  | 'Network & Server Downtime'
  | 'Delivery & Logistics'
  | 'Product Quality & Defects'
  | 'Account Security & Fraud'
  | 'Pricing & Unfair Fees'
  | 'Policy & Terms Transparency'
  | 'Staff Conduct & Professionalism'
  | 'Other Issues'
  | 'service_issues' 
  | 'product_quality' 
  | 'pricing_concerns' 
  | 'delivery_problems' 
  | 'technical_issues'
  | string;

export interface Engagement {
  likes: number;
  comments: number;
  shares: number;
}

export interface SentimentPost {
  id: string;
  content: string;
  author: string;
  authorHandle: string;
  authorAvatar?: string;
  platform: Platform;
  timestamp: Date;
  sentiment: Sentiment;
  confidence: number;
  engagement: Engagement;
  emotions?: string[];
  category?: ComplaintCategory;
  isInfluencer?: boolean;
  language?: string;
}

export interface Competitor {
  id: string;
  name: string;
  handle: string;
  logo?: string;
  sentimentScore: number;
  mentionCount: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  postId?: string;
}

export interface SentimentTrend {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

export interface EmotionData {
  emotion: string;
  count: number;
  percentage: number;
}

export interface CategoryData {
  category: ComplaintCategory;
  label: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DashboardMetrics {
  overallSentiment: number;
  totalMentions: number;
  mentionsTrend: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  engagementRate: number;
  responseTime: number;
}

export interface PlatformMetrics {
  platform: Platform;
  totalPosts: number;
  sentimentScore: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  engagementRate: number;
  trending: boolean;
}

export interface AnalysisRequest {
  keyword: string;
  maxPosts?: number;
  platforms?: Platform[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
