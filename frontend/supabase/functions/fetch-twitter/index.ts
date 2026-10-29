import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, maxResults = 10 } = await req.json();

    const bearerToken = Deno.env.get("TWITTER_BEARER_TOKEN");
    if (!bearerToken) {
      throw new Error("TWITTER_BEARER_TOKEN is not configured");
    }

    if (!keyword || typeof keyword !== "string" || keyword.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "keyword is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clamp maxResults to Twitter's limits (10-100)
    const clampedMax = Math.max(10, Math.min(100, maxResults));

    const params = new URLSearchParams({
      query: keyword,
      max_results: String(clampedMax),
      "tweet.fields": "created_at,public_metrics,author_id,lang",
      expansions: "author_id",
      "user.fields": "username,name",
    });

    const url = `https://api.x.com/2/tweets/search/recent?${params}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Twitter API error:", response.status, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Twitter rate limit reached. Try again in ~15 minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Twitter API ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Build author lookup
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
      language: tweet.lang,
      engagement: {
        likes: tweet.public_metrics?.like_count || 0,
        comments: tweet.public_metrics?.reply_count || 0,
        shares: tweet.public_metrics?.retweet_count || 0,
      },
    }));

    return new Response(
      JSON.stringify({ success: true, posts, meta: data.meta }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-twitter error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
