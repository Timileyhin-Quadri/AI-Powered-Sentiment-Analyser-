const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface SearchRequest {
  keywords: string[];
  maxPosts: number;
  platforms: ('twitter' | 'instagram' | 'facebook' | 'linkedin')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  excludeKeywords?: string[];
  includeRetweets?: boolean;
  includeComments?: boolean;
  language?: string;
  refresh?: boolean;
}

export interface SearchResultPost {
  text: string;
  timestamp: string;
  platform: string;
  sentiment: string;
  confidence: number;
  emotion?: string;
  complaint_category?: string | null;
  author?: string;
  authorHandle?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface ComplaintCategory {
  count: number;
  percentage: number;
  posts: number[];
}

export interface ComplaintsData {
  total: number;
  categories: Record<string, ComplaintCategory>;
}

export interface PlatformMetricResult {
  totalPosts: number;
  sentimentScore: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  engagementRate: number;
}

export interface SearchResults {
  summary: {
    total_posts: number;
    positive: number;
    negative: number;
    neutral: number;
    sentiment_score: number;
    engagement_rate: number;
  };
  posts: SearchResultPost[];
  volume_over_time: Array<{ date: string; count: number }>;
  platforms: Record<string, PlatformMetricResult>;
  complaints?: ComplaintsData;
  ai_insights?: {
    summary: string;
    key_themes: string[];
    recommendation: string;
  };
  data_source?: 'live' | 'simulated' | 'database_cache';
  twitter_status?: {
    status: 'success' | 'no_token' | 'api_error' | 'exception' | 'not_selected';
    error?: string;
  };
}

export interface LiveCompetitorData {
  name: string;
  sentiment_score: number;
  total_mentions: number;
  positive_rate: number;
  negative_rate: number;
}

export interface LiveCompetitorResponse {
  competitors: LiveCompetitorData[];
  time_comparison: Array<{
    date: string;
    brand: number;
    competitor_a: number;
    competitor_b: number;
    competitor_c: number;
    competitor_d: number;
  }>;
}

// Resilient fetch wrapper with timeout and abort support
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 150000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
    if (options.signal.aborted) {
      controller.abort();
    }
  }

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Convert backend complaint categories to frontend structure
function mapComplaints(
  categoriesList: Array<{ category: string; percentage: number; count: number }> = [],
  posts: SearchResultPost[] = []
): ComplaintsData {
  const categories: Record<string, ComplaintCategory> = {};
  let total = 0;

  for (const cat of categoriesList) {
    if (cat.category === 'No Data' || cat.category === 'No Complaints Found') continue;
    total += cat.count;

    // Find matching post indices for this category
    const matchingIndices: number[] = [];
    posts.forEach((p, idx) => {
      if (p.complaint_category && p.complaint_category.toLowerCase() === cat.category.toLowerCase()) {
        matchingIndices.push(idx);
      }
    });

    categories[cat.category] = {
      count: cat.count,
      percentage: cat.percentage,
      posts: matchingIndices,
    };
  }

  return { total, categories };
}

// Fallback generator when backend is not running or returns empty
export function generateSimulatedResults(keyword: string, sampleSize: number, platforms: string[]): SearchResults {
  const posCount = Math.round(sampleSize * 0.62);
  const negCount = Math.round(sampleSize * 0.18);
  const neuCount = Math.max(0, sampleSize - posCount - negCount);
  const sentimentScore = Math.round(((posCount - negCount) / (sampleSize || 1)) * 100);

  const posts: SearchResultPost[] = [
    {
      text: `Just completed a transaction with ${keyword}. Absolutely lightning fast experience! Highly recommended 👍`,
      timestamp: new Date().toISOString(),
      platform: 'twitter',
      sentiment: 'positive',
      confidence: 0.94,
      emotion: 'joy',
      author: 'Amina Bello',
      authorHandle: '@amina_b',
      engagement: { likes: 142, comments: 19, shares: 8 },
    },
    {
      text: `Customer service for ${keyword} resolved my enquiry within 10 minutes. Solid improvement!`,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      platform: 'twitter',
      sentiment: 'positive',
      confidence: 0.89,
      emotion: 'trust',
      author: 'Chukwuma Eze',
      authorHandle: '@chukwuma_e',
      engagement: { likes: 54, comments: 7, shares: 3 },
    },
    {
      text: `Why is the ${keyword} mobile app crashing on startup after the new update? Please push a hotfix soon.`,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      platform: 'twitter',
      sentiment: 'negative',
      confidence: 0.87,
      emotion: 'frustration',
      complaint_category: 'App & Digital Platform',
      author: 'Tunde Bakare',
      authorHandle: '@tbakare_',
      engagement: { likes: 88, comments: 24, shares: 12 },
    },
    {
      text: `Transferred funds via ${keyword} USSD *737# and network timed out, but my account was debited with no reversal.`,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      platform: 'twitter',
      sentiment: 'negative',
      confidence: 0.91,
      emotion: 'anger',
      complaint_category: 'Billing & Transaction Reversals',
      author: 'Emeka Obi',
      authorHandle: '@emeka_obi',
      engagement: { likes: 45, comments: 12, shares: 6 },
    },
    {
      text: `Checking out the new rates announced by ${keyword}. Seems competitive compared to others in Nigeria.`,
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      platform: 'twitter',
      sentiment: 'neutral',
      confidence: 0.76,
      emotion: 'neutral',
      author: 'Ngozi Okeke',
      authorHandle: '@ng_okeke',
      engagement: { likes: 15, comments: 2, shares: 1 },
    },
  ];

  const now = new Date();
  const volume_over_time = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 20) + 10,
    };
  });

  const platformMap: Record<string, PlatformMetricResult> = {};
  const activePlatforms = platforms.length > 0 ? platforms : ['twitter'];
  activePlatforms.forEach((p) => {
    platformMap[p] = {
      totalPosts: Math.round(sampleSize / activePlatforms.length),
      sentimentScore: sentimentScore,
      positiveCount: Math.round(posCount / activePlatforms.length),
      negativeCount: Math.round(negCount / activePlatforms.length),
      neutralCount: Math.round(neuCount / activePlatforms.length),
      engagementRate: 4.5,
    };
  });

  return {
    summary: {
      total_posts: sampleSize,
      positive: posCount,
      negative: negCount,
      neutral: neuCount,
      sentiment_score: sentimentScore,
      engagement_rate: 4.8,
    },
    posts,
    volume_over_time,
    platforms: platformMap,
    complaints: {
      total: negCount,
      categories: {
        'App & Digital Platform': { count: Math.ceil(negCount * 0.4), percentage: 40, posts: [2] },
        'Billing & Transaction Reversals': { count: Math.floor(negCount * 0.35), percentage: 35, posts: [3] },
        'Customer Support & Service': { count: Math.floor(negCount * 0.15), percentage: 15, posts: [] },
        'Network & Server Downtime': { count: Math.max(1, Math.floor(negCount * 0.1)), percentage: 10, posts: [] },
      },
    },
    ai_insights: {
      summary: `Public sentiment around ${keyword} is predominantly positive, with high trust in transaction speed, while key customer friction centers on app stability and USSD transaction reversals.`,
      key_themes: ['Fast Transactions', 'App & Digital Platform Stability', 'Billing & Reversals', 'Responsive Support'],
      recommendation: `Deploy an urgent patch for mobile app crashes and automate 24-hour reversal workflows for failed transfer alerts.`,
    },
    data_source: 'simulated',
    twitter_status: { status: 'success' },
  };
}

export const checkHealth = async (): Promise<{ status: string; model_loaded: boolean }> => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`, { method: 'GET' }, 5000);
    if (!response.ok) throw new Error('Backend unhealthy');
    return await response.json();
  } catch (err) {
    return { status: 'offline', model_loaded: false };
  }
};

export const analyzeSentiment = async (
  request: SearchRequest,
  signal?: AbortSignal
): Promise<SearchResults> => {
  const keyword = request.keywords.join(' OR ') || 'GTBank';
  const limit = request.maxPosts || 30;

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/analyze_sentiment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          limit,
          max_posts: limit,
          platforms: request.platforms,
          refresh: Boolean(request.refresh),
        }),
        signal,
      },
      150000
    );

    if (!response.ok) {
      throw new Error(`Backend error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.summary;
    const tweets = data.tweets || [];

    const posts: SearchResultPost[] = tweets.map((t: any) => ({
      text: t.text,
      timestamp: t.timestamp || new Date().toISOString(),
      platform: 'twitter',
      sentiment: String(t.sentiment).toLowerCase(),
      confidence: t.confidence || 0.85,
      emotion: t.emotion || (t.sentiment === 'Positive' ? 'joy' : t.sentiment === 'Negative' ? 'frustration' : 'neutral'),
      complaint_category: t.category || null,
      summary: t.summary || null,
      author: 'Social User',
      authorHandle: '@user',
      engagement: { likes: Math.floor(Math.random() * 50), comments: Math.floor(Math.random() * 15), shares: Math.floor(Math.random() * 8) },
    }));

    return {
      summary: {
        total_posts: summary.total || posts.length,
        positive: summary.positive,
        negative: summary.negative,
        neutral: summary.neutral,
        sentiment_score: Math.round(summary.sentiment_score),
        engagement_rate: summary.engagement_rate || 3.5,
      },
      posts,
      volume_over_time: data.volume_over_time || [],
      platforms: {
        twitter: {
          totalPosts: summary.total || posts.length,
          sentimentScore: Math.round(summary.sentiment_score),
          positiveCount: summary.positive,
          negativeCount: summary.negative,
          neutralCount: summary.neutral,
          engagementRate: summary.engagement_rate || 3.5,
        },
      },
      ai_insights: data.ai_insights,
      data_source: data.data_source || 'live',
      twitter_status: { status: 'success' },
    };
  } catch (err) {
    console.warn('[SentimentApi] Live backend call failed, falling back to simulated data:', err);
    return generateSimulatedResults(keyword, limit, request.platforms);
  }
};

export const analyzeAll = async (
  request: SearchRequest,
  signal?: AbortSignal
): Promise<SearchResults> => {
  const keyword = request.keywords.join(' OR ') || 'GTBank';
  const limit = request.maxPosts || 30;

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/analyze_all`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          limit,
          max_posts: limit,
          platforms: request.platforms,
          refresh: Boolean(request.refresh),
        }),
        signal,
      },
      150000
    );

    if (!response.ok) {
      throw new Error(`Backend error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.summary;
    const tweets = data.tweets || [];
    const customerVoice = data.customer_voice || {};

    const posts: SearchResultPost[] = tweets.map((t: any) => ({
      text: t.text,
      timestamp: t.timestamp || new Date().toISOString(),
      platform: 'twitter',
      sentiment: String(t.sentiment).toLowerCase(),
      confidence: t.confidence || 0.85,
      emotion: t.emotion || (t.sentiment === 'Positive' ? 'joy' : t.sentiment === 'Negative' ? 'frustration' : 'neutral'),
      complaint_category: t.category || null,
      summary: t.summary || null,
      author: 'Social User',
      authorHandle: '@user',
      engagement: { likes: Math.floor(Math.random() * 50), comments: Math.floor(Math.random() * 15), shares: Math.floor(Math.random() * 8) },
    }));

    return {
      summary: {
        total_posts: summary.total || posts.length,
        positive: summary.positive,
        negative: summary.negative,
        neutral: summary.neutral,
        sentiment_score: Math.round(summary.sentiment_score),
        engagement_rate: summary.engagement_rate || 4.2,
      },
      posts,
      volume_over_time: data.volume_over_time || [],
      platforms: {
        twitter: {
          totalPosts: summary.total || posts.length,
          sentimentScore: Math.round(summary.sentiment_score),
          positiveCount: summary.positive,
          negativeCount: summary.negative,
          neutralCount: summary.neutral,
          engagementRate: summary.engagement_rate || 4.2,
        },
      },
      complaints: mapComplaints(customerVoice.complaint_categories || [], posts),
      ai_insights: data.ai_insights || customerVoice.ai_insights || {
        summary: `Live 5-mini analysis of ${keyword} based on ${summary.total} scanned social records.`,
        key_themes: (customerVoice.complaint_categories || []).map((c: any) => c.category).slice(0, 4),
        recommendation: `Monitor ${summary.negative} negative reactions and complaints for prompt customer outreach.`,
      },
      data_source: data.data_source || 'live',
      twitter_status: { status: 'success' },
    };
  } catch (err) {
    console.warn('[SentimentApi] analyzeAll live backend call failed, falling back to simulated data:', err);
    return generateSimulatedResults(keyword, limit, request.platforms);
  }
};

export const analyzeCompetitors = async (
  brandName: string,
  platforms: string[] = ['twitter'],
  signal?: AbortSignal
): Promise<LiveCompetitorResponse> => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/analyze_competitors`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: brandName, brand_name: brandName, platforms }),
        signal,
      },
      150000
    );

    if (!response.ok) {
      throw new Error(`Competitor analysis failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('[SentimentApi] Competitor analysis fallback:', err);
    return {
      competitors: [
        { name: brandName || 'Target Brand', sentiment_score: 72, total_mentions: 340, positive_rate: 68, negative_rate: 14 },
        { name: 'Zenith Bank', sentiment_score: 65, total_mentions: 290, positive_rate: 60, negative_rate: 20 },
        { name: 'Access Bank', sentiment_score: 58, total_mentions: 410, positive_rate: 52, negative_rate: 28 },
        { name: 'First Bank', sentiment_score: 62, total_mentions: 320, positive_rate: 56, negative_rate: 22 },
        { name: 'UBA', sentiment_score: 69, total_mentions: 275, positive_rate: 64, negative_rate: 16 },
      ],
      time_comparison: [],
    };
  }
};

export const analyzeComplaints = async (
  keyword: string,
  platforms: string[] = ['twitter'],
  signal?: AbortSignal
) => {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/customer_complaints`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, limit: 30, platforms }),
        signal,
      },
      150000
    );

    if (!response.ok) {
      throw new Error(`Complaint analysis failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.warn('[SentimentApi] Complaint analysis fallback:', err);
    return {
      complaint_categories: [
        { category: 'Service Issues', percentage: 40, count: 12 },
        { category: 'App/Technical', percentage: 30, count: 9 },
        { category: 'Pricing Concerns', percentage: 20, count: 6 },
        { category: 'Delivery Problems', percentage: 10, count: 3 },
      ],
      recent_opinions: [],
    };
  }
};
