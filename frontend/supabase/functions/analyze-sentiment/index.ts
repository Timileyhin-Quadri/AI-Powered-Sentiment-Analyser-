import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RawPost {
  id: string;
  text: string;
  timestamp: string;
  platform: string;
  author?: string;
  authorHandle?: string;
  engagement?: { likes: number; comments: number; shares: number };
}

interface TwitterFetchResult {
  posts: RawPost[];
  status: 'success' | 'no_token' | 'api_error' | 'exception';
  error?: string;
}

/** Fetch real tweets via Twitter API v2. */
async function fetchTwitterPosts(keyword: string, maxResults: number): Promise<TwitterFetchResult> {
  const bearerToken = Deno.env.get("TWITTER_BEARER_TOKEN");
  if (!bearerToken) {
    console.warn("TWITTER_BEARER_TOKEN not set");
    return { posts: [], status: 'no_token', error: 'TWITTER_BEARER_TOKEN is not configured' };
  }

  try {
    const clampedMax = Math.max(10, Math.min(100, maxResults));
    const params = new URLSearchParams({
      query: keyword,
      max_results: String(clampedMax),
      "tweet.fields": "created_at,public_metrics,author_id,lang",
      expansions: "author_id",
      "user.fields": "username,name",
    });

    const res = await fetch(`https://api.x.com/2/tweets/search/recent?${params}`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Twitter API error:", res.status, errText);
      return { posts: [], status: 'api_error', error: `Twitter API ${res.status}: ${errText.substring(0, 200)}` };
    }

    const data = await res.json();

    const authors: Record<string, { username: string; name: string }> = {};
    if (data.includes?.users) {
      for (const u of data.includes.users) {
        authors[u.id] = { username: u.username, name: u.name };
      }
    }

    const posts = (data.data || []).map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      timestamp: tweet.created_at,
      platform: "twitter",
      author: authors[tweet.author_id]?.name || "Unknown",
      authorHandle: authors[tweet.author_id]?.username || "",
      engagement: {
        likes: tweet.public_metrics?.like_count || 0,
        comments: tweet.public_metrics?.reply_count || 0,
        shares: tweet.public_metrics?.retweet_count || 0,
      },
    }));

    return { posts, status: 'success' };
  } catch (err) {
    console.error("fetchTwitterPosts error:", err);
    return { posts: [], status: 'exception', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

const COMPLAINT_CATEGORIES = ["Service Issues", "Product Quality", "Pricing Concerns", "Delivery Problems", "App/Technical Issues", "Other"];

function buildPrompt(keywordStr: string, platformList: string[], realPosts: RawPost[], perPlatform: number): string {
  const complaintsInstruction = `
  "complaints": {
    "total": <number of negative posts>,
    "categories": {
      "<category_name>": {
        "count": <number>,
        "percentage": <number>,
        "posts": [<indices of matching posts in the posts array>]
      }
    }
  },`;

  const emotionInstruction = `"emotion": "<one of: joy, anger, sadness, fear, surprise, disgust, trust, anticipation>",
      "complaint_category": "<one of: ${COMPLAINT_CATEGORIES.join(", ")}, or null if not a negative/complaint post>",`;

  if (realPosts.length > 0) {
    const postsJson = JSON.stringify(
      realPosts.map((p) => ({ text: p.text, platform: p.platform, timestamp: p.timestamp }))
    );

    return `You are a professional social media sentiment analysis AI. I have collected ${realPosts.length} real social media posts about "${keywordStr}".

Here are the actual posts (JSON array):
${postsJson}

Analyze each post's sentiment and return a JSON object with this EXACT structure:
{
  "summary": {
    "total_posts": ${realPosts.length},
    "positive": <count>,
    "negative": <count>,
    "neutral": <count>,
    "sentiment_score": <number between -100 and 100>,
    "engagement_rate": <number between 0 and 10>
  },
  "posts": [
    {
      "text": "<the original post text>",
      "timestamp": "<original timestamp>",
      "platform": "<original platform>",
      "sentiment": "<positive|negative|neutral>",
      "confidence": <number between 0.5 and 1.0>,
      ${emotionInstruction}
      "engagement": { "likes": <number>, "comments": <number>, "shares": <number> }
    }
  ],
  "volume_over_time": [{ "date": "<YYYY-MM-DD>", "count": <number> }],
  "platforms": {
    "<platform_name>": {
      "totalPosts": <number>, "sentimentScore": <number>,
      "positiveCount": <number>, "negativeCount": <number>, "neutralCount": <number>,
      "engagementRate": <number>
    }
  },${complaintsInstruction}
  "ai_insights": {
    "summary": "<2-3 sentence executive summary>",
    "key_themes": ["<theme1>", "<theme2>", "<theme3>"],
    "recommendation": "<actionable recommendation>"
  }
}

Rules:
- Analyze the ACTUAL text of each post to determine sentiment
- Keep the original text, timestamp, and platform from the input
- Add engagement numbers from the input data where available
- For each negative post, assign a complaint_category from: ${COMPLAINT_CATEGORIES.join(", ")}
- The complaints object should aggregate negative posts by category with their indices
- volume_over_time should group posts by date
- Return ONLY valid JSON, no markdown`;
  }

  const totalPosts = platformList.length * perPlatform;
  return `You are a professional social media sentiment analysis AI. Analyze the sentiment for the keyword(s): "${keywordStr}" across platforms: ${platformList.join(", ")}.

Generate realistic and detailed sentiment analysis results as if you had actually scraped ${totalPosts} total posts from social media.

Return a JSON object with this EXACT structure:
{
  "summary": {
    "total_posts": <number>,
    "positive": <number>,
    "negative": <number>,
    "neutral": <number>,
    "sentiment_score": <number between -100 and 100>,
    "engagement_rate": <number between 0 and 10>
  },
  "posts": [
    {
      "text": "<realistic social media post about the keyword>",
      "timestamp": "<ISO 8601 date within last 7 days>",
      "platform": "<one of: ${platformList.join(", ")}>",
      "sentiment": "<positive|negative|neutral>",
      "confidence": <number between 0.5 and 1.0>,
      ${emotionInstruction}
      "engagement": { "likes": <number>, "comments": <number>, "shares": <number> }
    }
  ],
  "volume_over_time": [{ "date": "<YYYY-MM-DD>", "count": <number> }],
  "platforms": {
    "<platform_name>": {
      "totalPosts": <number>, "sentimentScore": <number>,
      "positiveCount": <number>, "negativeCount": <number>, "neutralCount": <number>,
      "engagementRate": <number>
    }
  },${complaintsInstruction}
  "ai_insights": {
    "summary": "<2-3 sentence executive summary>",
    "key_themes": ["<theme1>", "<theme2>", "<theme3>"],
    "recommendation": "<actionable recommendation>"
  }
}

Rules:
- Generate exactly 8 sample posts spread across the platforms
- volume_over_time should have 7 entries (one per day for last 7 days)
- Include a platforms object entry for EACH platform
- Make the content realistic and relevant to "${keywordStr}"
- For each negative post, assign a complaint_category from: ${COMPLAINT_CATEGORIES.join(", ")}
- The complaints object should aggregate negative posts by category with their indices
- Return ONLY valid JSON, no markdown`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, platforms, maxPosts } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const keywordStr = Array.isArray(keywords) ? keywords.join(" OR ") : keywords;
    const platformList = Array.isArray(platforms) ? platforms : ["twitter"];
    const perPlatform = maxPosts || 30;

    // ---- Fetch real data from available platforms ----
    let realPosts: RawPost[] = [];
    let twitterStatus: { status: string; error?: string } = { status: 'not_selected' };

    if (platformList.includes("twitter")) {
      const twitterResult = await fetchTwitterPosts(keywordStr, perPlatform);
      realPosts = realPosts.concat(twitterResult.posts);
      twitterStatus = { status: twitterResult.status, error: twitterResult.error };
      console.log(`Twitter fetch: status=${twitterResult.status}, posts=${twitterResult.posts.length}${twitterResult.error ? ', error=' + twitterResult.error : ''}`);
    }

    const hasRealData = realPosts.length > 0;
    const prompt = buildPrompt(keywordStr, platformList, realPosts, perPlatform);

    // ---- Call AI for sentiment analysis ----
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a sentiment analysis AI. Always respond with valid JSON only, no markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    let analysisResult;
    try {
      const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (_parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("AI returned invalid JSON format");
    }

    // Merge real engagement data back into AI-analyzed posts
    if (hasRealData && analysisResult.posts) {
      analysisResult.posts = analysisResult.posts.map((p: any, i: number) => {
        const real = realPosts[i];
        if (real?.engagement) {
          return { ...p, engagement: real.engagement, author: real.author, authorHandle: real.authorHandle };
        }
        return p;
      });
    }

    // Tag whether data is real or simulated
    analysisResult.data_source = hasRealData ? "live" : "simulated";
    analysisResult.twitter_status = twitterStatus;

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-sentiment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
