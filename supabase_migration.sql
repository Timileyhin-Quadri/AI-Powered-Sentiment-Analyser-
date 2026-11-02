-- ==============================================================================
-- SentiTrack: Complete Supabase Database Migration
-- Project: keaqonqlvicdwlsdnqpe
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/keaqonqlvicdwlsdnqpe/sql/new
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. Profiles Table (User Profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read and write on profiles" 
ON public.profiles FOR ALL 
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 2. Search Results Table (User Saved Searches)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.search_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    keywords TEXT[] NOT NULL,
    platforms TEXT[] NOT NULL,
    max_posts INTEGER DEFAULT 30,
    summary JSONB,
    posts JSONB,
    volume_over_time JSONB,
    platform_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.search_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read and write on search_results" 
ON public.search_results FOR ALL 
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 3. Dashboard Metrics Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    total_posts INTEGER DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    sentiment_score NUMERIC(5, 2) DEFAULT 0.0,
    engagement_rate NUMERIC(5, 2) DEFAULT 0.0,
    last_search_id TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read and write on dashboard_metrics" 
ON public.dashboard_metrics FOR ALL 
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 4. Tracked Brands Table (Scraped Brands)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tracked_brands (
    brand TEXT PRIMARY KEY,
    category TEXT DEFAULT 'General',
    last_scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_posts INTEGER DEFAULT 0,
    sentiment_score NUMERIC(5, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tracked_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write on tracked_brands" 
ON public.tracked_brands FOR ALL 
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 5. Tracked Tweets Table (Scraped & Enriched Social Data)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tracked_tweets (
    tweet_id TEXT PRIMARY KEY,
    brand TEXT NOT NULL REFERENCES public.tracked_brands(brand) ON DELETE CASCADE,
    text TEXT NOT NULL,
    clean_text TEXT,
    sentiment TEXT NOT NULL, -- 'Positive', 'Negative', 'Neutral'
    confidence NUMERIC(4, 3) DEFAULT 0.85,
    category TEXT,          -- 11 Smart Categories
    emotion TEXT,           -- joy, anger, frustration, etc.
    summary TEXT,
    timestamp TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracked_tweets_brand ON public.tracked_tweets(brand);
CREATE INDEX IF NOT EXISTS idx_tracked_tweets_sentiment ON public.tracked_tweets(brand, sentiment);
CREATE INDEX IF NOT EXISTS idx_tracked_tweets_category ON public.tracked_tweets(brand, category);
CREATE INDEX IF NOT EXISTS idx_tracked_tweets_scraped ON public.tracked_tweets(scraped_at DESC);

ALTER TABLE public.tracked_tweets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write on tracked_tweets" 
ON public.tracked_tweets FOR ALL 
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 6. Seed Initial Monitored Nigerian Brands
-- ==============================================================================
INSERT INTO public.tracked_brands (brand, category)
VALUES 
    ('gtbank', 'Banking'),
    ('zenith bank', 'Banking'),
    ('access bank', 'Banking'),
    ('chowdeck', 'Food & Logistics'),
    ('mtn', 'Telecommunications'),
    ('airtel', 'Telecommunications'),
    ('flutterwave', 'Fintech'),
    ('paystack', 'Fintech'),
    ('opay', 'Fintech'),
    ('moniepoint', 'Fintech')
ON CONFLICT (brand) DO NOTHING;
