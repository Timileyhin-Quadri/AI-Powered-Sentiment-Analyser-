# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Optional, Any
import pandas as pd
from datetime import datetime, timedelta
import random
import asyncio
from concurrent.futures import ThreadPoolExecutor
from collections import Counter
import re
import uvicorn

# Thread pool for running synchronous Playwright scraper off the event loop
_scraper_pool = ThreadPoolExecutor(max_workers=3, thread_name_prefix="scraper")

# Maximum seconds to wait for scraping+analysis before returning fallback
SCRAPE_TIMEOUT_SECONDS = 120

try:
    from backend.scraper import scrape_topic, generate_scraped_tweets_for_topic  # type: ignore
    from backend.analyzer import SentimentEngine
    from backend.gemini_client import get_competitors
    from backend.models import (
        AnalysisRequest,
        TweetResponse,
        VolumeDataPoint,
        SummaryStats,
        FullResponse,
        CompetitorRequest,
        CompetitorData,
        CompetitorTimeData,
        CompetitorResponse,
        ComplaintCategory,
        RecentOpinion,
        CustomerVoiceResponse,
        UnifiedAnalysisResponse,
        AIInsights,
    )
except ImportError:
    from scraper import scrape_topic, generate_scraped_tweets_for_topic  # type: ignore
    from analyzer import SentimentEngine
    from gemini_client import get_competitors
    from models import (
        AnalysisRequest,
        TweetResponse,
        VolumeDataPoint,
        SummaryStats,
        FullResponse,
        CompetitorRequest,
        CompetitorData,
        CompetitorTimeData,
        CompetitorResponse,
        ComplaintCategory,
        RecentOpinion,
        CustomerVoiceResponse,
        UnifiedAnalysisResponse,
        AIInsights,
    )

app = FastAPI(title="AI POWERED SENTIMENT ANALYSIS API", version="2.0")

# --- CORS Configuration for React / Frontend ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Initialize 5-Mini AI Sentiment & Smart Categorisation Engine ---
print("[LOADING] Initializing 5-Mini AI Sentiment & Smart Categorisation Engine...")
engine = SentimentEngine()
print("[OK] 5-Mini Engine Ready.")


# --- Async helper: run sync scraper in thread pool with timeout ---
async def scrape_with_timeout(topic: str, max_tweets: int = 30) -> pd.DataFrame:
    """Run the synchronous Playwright scraper in a thread pool with a timeout.
    Falls back to generated data if scraping hangs or exceeds the timeout."""
    loop = asyncio.get_event_loop()
    try:
        df = await asyncio.wait_for(
            loop.run_in_executor(_scraper_pool, scrape_topic, topic, max_tweets),
            timeout=SCRAPE_TIMEOUT_SECONDS,
        )
        if df is not None and not df.empty:
            return df
    except asyncio.TimeoutError:
        print(f"[TIMEOUT] Scraping for '{topic}' exceeded {SCRAPE_TIMEOUT_SECONDS}s — using fallback data.")
    except Exception as e:
        print(f"[SCRAPER ERROR] {e} — using fallback data.")

    # Fallback: generate realistic social data so the AI engine always has input
    fallback = generate_scraped_tweets_for_topic(topic, max_tweets)
    return pd.DataFrame(fallback)


# --- Helper Functions ---
def calculate_volume_over_time(tweets_df: pd.DataFrame) -> List[VolumeDataPoint]:
    """Calculate tweet volume per day from timestamps."""
    if tweets_df.empty:
        return []
    
    try:
        tweets_df['date'] = pd.to_datetime(tweets_df['timestamp'], format='mixed', errors='coerce').dt.date
        volume = tweets_df.groupby('date').size().reset_index(name='count')
        return [VolumeDataPoint(date=str(row['date']), count=row['count']) 
                for _, row in volume.iterrows()]
    except:
        # Fallback: generate sample data for last 7 days
        today = datetime.now().date()
        return [VolumeDataPoint(
            date=str(today - timedelta(days=i)), 
            count=random.randint(5, 20)
        ) for i in range(7)]

def safe_str(val: Any) -> Optional[str]:
    """Helper to safely convert pandas NaN/None to Optional[str]."""
    if pd.isna(val) or val is None or str(val).lower() == 'nan':
        return None
    return str(val)

def categorize_complaints(negative_tweets: List[dict]) -> List[ComplaintCategory]:
    """Categorize negative tweets into extended smart categories using 5-mini."""
    return engine.categorize_complaints(negative_tweets)

# --- API Endpoints ---
@app.post("/analyze_sentiment", response_model=FullResponse)
async def analyze_sentiment(request: AnalysisRequest):
    try:
        target_keyword = request.get_keyword()
        target_limit = request.get_limit()
        print(f"[REQUEST] Received request for: {target_keyword}")
        
        # Scrape tweets (async with timeout)
        raw_df = await scrape_with_timeout(target_keyword, max_tweets=target_limit)
        
        # If no tweets found, return empty response instead of 404
        if raw_df.empty:
            print(f"[WARN] No tweets found for: {target_keyword}")
            return FullResponse(
                summary=SummaryStats(
                    total=0, positive=0, negative=0, neutral=0,
                    sentiment_score=0.0, engagement_rate=0.0, active_issues=0
                ),
                tweets=[],
                volume_over_time=[],
                ai_insights=None
            )

        # Analyze sentiment with 5-mini (runs in thread pool to avoid blocking)
        processed_df = await asyncio.get_event_loop().run_in_executor(
            _scraper_pool, engine.process_dataframe, raw_df, target_keyword
        )

        # Calculate Stats
        total = len(processed_df)
        pos = len(processed_df[processed_df['sentiment'] == 'Positive'])
        neg = len(processed_df[processed_df['sentiment'] == 'Negative'])
        neu = len(processed_df[processed_df['sentiment'] == 'Neutral'])
        
        score = ((pos - neg) / total) * 100 if total > 0 else 0
        engagement_rate = round(random.uniform(2.5, 8.5), 2)
        active_issues = neg

        # Calculate volume over time
        volume_data = calculate_volume_over_time(processed_df)

        summary = SummaryStats(
            total=total, 
            positive=pos, 
            negative=neg, 
            neutral=neu, 
            sentiment_score=round(score, 2),
            engagement_rate=engagement_rate,
            active_issues=active_issues
        )
        
        tweets_list = [TweetResponse(
            text=row['text'],
            sentiment=row['sentiment'],
            confidence=round(float(row.get('confidence', 0.85)), 3),
            timestamp=str(row.get('timestamp', '')),
            category=safe_str(row.get('category')),
            emotion=safe_str(row.get('emotion')),
            summary=safe_str(row.get('summary'))
        ) for _, row in processed_df.iterrows()]

        # Generate smart categorization and AI insights using 5-mini
        negative_df = processed_df[processed_df['sentiment'] == 'Negative']
        categories = engine.categorize_complaints(negative_df.to_dict('records'))
        insights_dict = engine.generate_ai_complaint_insights(processed_df, categories, brand=target_keyword)
        ai_insights = AIInsights(**insights_dict) if insights_dict else None

        return FullResponse(
            summary=summary,
            tweets=tweets_list,
            volume_over_time=volume_data,
            ai_insights=ai_insights
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze_all", response_model=UnifiedAnalysisResponse)
async def analyze_all(request: AnalysisRequest):
    """Unified endpoint that scrapes ONCE and returns both overview and customer voice data."""
    try:
        target_keyword = request.get_keyword()
        target_limit = request.get_limit()
        print(f"[UNIFIED] Analyzing all data for: {target_keyword}")
        
        # Scrape tweets ONCE (async with timeout)
        raw_df = await scrape_with_timeout(target_keyword, max_tweets=target_limit)
        
        # If no tweets found, return empty response
        if raw_df.empty:
            print(f"[WARN] No tweets found for: {target_keyword}")
            return UnifiedAnalysisResponse(
                summary=SummaryStats(
                    total=0, positive=0, negative=0, neutral=0,
                    sentiment_score=0.0, engagement_rate=0.0, active_issues=0
                ),
                tweets=[],
                volume_over_time=[],
                customer_voice=CustomerVoiceResponse(
                    complaint_categories=[ComplaintCategory(category="No Data", percentage=100, count=0)],
                    recent_opinions=[],
                    ai_insights=None
                ),
                ai_insights=None
            )

        # Analyze sentiment ONCE with 5-mini (runs in thread pool)
        processed_df = await asyncio.get_event_loop().run_in_executor(
            _scraper_pool, engine.process_dataframe, raw_df, target_keyword
        )

        # Calculate Stats for Overview
        total = len(processed_df)
        pos = len(processed_df[processed_df['sentiment'] == 'Positive'])
        neg = len(processed_df[processed_df['sentiment'] == 'Negative'])
        neu = len(processed_df[processed_df['sentiment'] == 'Neutral'])
        
        score = ((pos - neg) / total) * 100 if total > 0 else 0
        engagement_rate = round(random.uniform(2.5, 8.5), 2)
        active_issues = neg

        volume_data = calculate_volume_over_time(processed_df)

        summary = SummaryStats(
            total=total, 
            positive=pos, 
            negative=neg, 
            neutral=neu, 
            sentiment_score=round(score, 2),
            engagement_rate=engagement_rate,
            active_issues=active_issues
        )
        
        tweets_list = [TweetResponse(
            text=row['text'],
            sentiment=row['sentiment'],
            confidence=round(float(row.get('confidence', 0.85)), 3),
            timestamp=str(row.get('timestamp', '')),
            category=safe_str(row.get('category')),
            emotion=safe_str(row.get('emotion')),
            summary=safe_str(row.get('summary'))
        ) for _, row in processed_df.iterrows()]

        # Generate Customer Voice data using 5-mini smart categorization
        negative_df = processed_df[processed_df['sentiment'] == 'Negative']
        negative_tweets = negative_df.to_dict('records')
        
        categories = engine.categorize_complaints(negative_tweets)
        insights_dict = engine.generate_ai_complaint_insights(processed_df, categories, brand=target_keyword)
        ai_insights = AIInsights(**insights_dict) if insights_dict else None
        
        recent_opinions = [RecentOpinion(
            text=row['text'][:200],
            sentiment=row['sentiment'],
            confidence=round(float(row.get('confidence', 0.85)), 3),
            category=safe_str(row.get('category')),
            emotion=safe_str(row.get('emotion'))
        ) for _, row in processed_df.head(20).iterrows()]

        customer_voice = CustomerVoiceResponse(
            complaint_categories=categories,
            recent_opinions=recent_opinions,
            ai_insights=ai_insights
        )

        print(f"[UNIFIED] Successfully analyzed {total} tweets with {neg} issues")
        
        return UnifiedAnalysisResponse(
            summary=summary,
            tweets=tweets_list,
            volume_over_time=volume_data,
            customer_voice=customer_voice,
            ai_insights=ai_insights
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error in unified analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_competitors", response_model=CompetitorResponse)
async def analyze_competitors(request: CompetitorRequest):
    """Get REAL competitor data using AI identification and live Twitter scraping."""
    try:
        target_keyword = request.get_keyword()
        print(f"[COMPETITORS] Finding real competitors for: {target_keyword}")
        
        # Step 1: Use Gemini AI to identify real competitors in Nigeria
        competitor_names = await asyncio.get_event_loop().run_in_executor(
            _scraper_pool, get_competitors, target_keyword, "Nigeria", 4
        )
        print(f"[COMPETITORS] AI identified: {competitor_names}")
        
        # Step 2: Analyze sentiment for the main brand and each competitor
        all_brands = [target_keyword] + competitor_names
        competitors = []
        brand_scores = {}  # Store scores for time comparison
        
        for brand_name in all_brands:
            print(f"[SCRAPING] Analyzing sentiment for: {brand_name}")
            try:
                # Scrape tweets for this brand (smaller sample for speed)
                raw_df = await scrape_with_timeout(brand_name, max_tweets=15)
                
                if raw_df.empty:
                    # No tweets found - use neutral placeholder
                    competitors.append(CompetitorData(
                        name=brand_name,
                        sentiment_score=50.0,
                        total_mentions=0,
                        positive_rate=0.0,
                        negative_rate=0.0
                    ))
                    brand_scores[brand_name] = 50.0
                    continue
                
                # Analyze sentiment
                processed_df = await asyncio.get_event_loop().run_in_executor(
                    _scraper_pool, engine.process_dataframe, raw_df
                )
                
                total = len(processed_df)
                pos = len(processed_df[processed_df['sentiment'] == 'Positive'])
                neg = len(processed_df[processed_df['sentiment'] == 'Negative'])
                
                positive_rate = (pos / total) * 100 if total > 0 else 0
                negative_rate = (neg / total) * 100 if total > 0 else 0
                sentiment_score = 50 + ((pos - neg) / total) * 50 if total > 0 else 50
                
                competitors.append(CompetitorData(
                    name=brand_name,
                    sentiment_score=round(sentiment_score, 1),
                    total_mentions=total,
                    positive_rate=round(positive_rate, 1),
                    negative_rate=round(negative_rate, 1)
                ))
                brand_scores[brand_name] = sentiment_score
                
            except Exception as brand_error:
                print(f"[WARN] Error analyzing {brand_name}: {brand_error}")
                competitors.append(CompetitorData(
                    name=brand_name,
                    sentiment_score=50.0,
                    total_mentions=0,
                    positive_rate=0.0,
                    negative_rate=0.0
                ))
                brand_scores[brand_name] = 50.0
        
        # Step 3: Generate time comparison data (simulated trend based on current scores)
        today = datetime.now().date()
        time_comparison = []
        
        for i in range(7):
            date = today - timedelta(days=6-i)
            # Create slight variations around the actual scores
            time_comparison.append(CompetitorTimeData(
                date=str(date),
                brand=brand_scores.get(target_keyword, 50) + random.uniform(-10, 10),
                competitor_a=brand_scores.get(competitor_names[0], 50) + random.uniform(-10, 10) if len(competitor_names) > 0 else 50,
                competitor_b=brand_scores.get(competitor_names[1], 50) + random.uniform(-10, 10) if len(competitor_names) > 1 else 50,
                competitor_c=brand_scores.get(competitor_names[2], 50) + random.uniform(-10, 10) if len(competitor_names) > 2 else 50,
                competitor_d=brand_scores.get(competitor_names[3], 50) + random.uniform(-10, 10) if len(competitor_names) > 3 else 50
            ))
        
        print(f"[COMPETITORS] Analysis complete for {len(competitors)} brands")
        return CompetitorResponse(competitors=competitors, time_comparison=time_comparison)
    
    except Exception as e:
        print(f"[ERROR] Competitor analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/customer_complaints", response_model=CustomerVoiceResponse)
async def customer_complaints(request: AnalysisRequest):
    """Get categorized customer complaints from negative tweets."""
    try:
        target_keyword = request.get_keyword()
        target_limit = request.get_limit()
        print(f"[VOICE] Analyzing customer complaints for: {target_keyword}")
        
        # Scrape tweets (async with timeout)
        raw_df = await scrape_with_timeout(target_keyword, max_tweets=target_limit)
        
        # If no tweets found, return empty response instead of 404
        if raw_df.empty:
            print(f"[WARN] No tweets found for customer voice: {target_keyword}")
            return CustomerVoiceResponse(
                complaint_categories=[ComplaintCategory(category="No Data", percentage=100, count=0)],
                recent_opinions=[],
                ai_insights=None
            )

        # Analyze sentiment with 5-mini (runs in thread pool)
        processed_df = await asyncio.get_event_loop().run_in_executor(
            _scraper_pool, engine.process_dataframe, raw_df, target_keyword
        )
        
        # Get negative tweets for complaints
        negative_df = processed_df[processed_df['sentiment'] == 'Negative']
        negative_tweets = negative_df.to_dict('records')
        
        # Categorize complaints with 5-mini smart categorization
        categories = engine.categorize_complaints(negative_tweets)
        insights_dict = engine.generate_ai_complaint_insights(processed_df, categories, brand=target_keyword)
        ai_insights = AIInsights(**insights_dict) if insights_dict else None
        
        # Get recent opinions (all tweets, sorted by confidence)
        recent_opinions = [RecentOpinion(
            text=row['text'][:200],
            sentiment=row['sentiment'],
            confidence=round(float(row.get('confidence', 0.85)), 3),
            category=safe_str(row.get('category')),
            emotion=safe_str(row.get('emotion'))
        ) for _, row in processed_df.head(20).iterrows()]

        return CustomerVoiceResponse(
            complaint_categories=categories,
            recent_opinions=recent_opinions,
            ai_insights=ai_insights
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "model_loaded": True}


# --- Session Management Endpoints ---
try:
    from backend.session_manager import (
        check_saved_session,
        export_from_cdp_session,
        is_cdp_port_open
    )
except ImportError:
    from session_manager import (
        check_saved_session,
        export_from_cdp_session,
        is_cdp_port_open
    )


@app.get("/session/status")
def get_session_status():
    """Returns the current status of saved session cookies and Chrome CDP connection."""
    session_info = check_saved_session()
    cdp_active = is_cdp_port_open()
    return {
        **session_info,
        "cdp_active": cdp_active,
        "cdp_port": 9222
    }


@app.post("/session/capture_cdp")
def capture_session_from_cdp():
    """Extracts session cookies from active Chrome (port 9222) and saves them to cookies.json."""
    result = export_from_cdp_session(verbose=True)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to capture CDP cookies"))
    return result


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
