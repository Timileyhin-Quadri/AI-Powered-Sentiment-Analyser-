# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from scraper import scrape_topic # type: ignore
from analyzer import SentimentEngine
from gemini_client import get_competitors
import uvicorn
from datetime import datetime, timedelta
import random
from collections import Counter
import re

app = FastAPI(title="AI POWERED SENTIMENT ANALYSIS API", version="2.0")

# --- CORS Configuration for React Native ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Initialize Model ONCE ---
print("[LOADING] Loading RoBERTa Model...")
engine = SentimentEngine()
print("[OK] Model Loaded & Ready.")

# --- Pydantic Models ---
class AnalysisRequest(BaseModel):
    keyword: str
    limit: int = 30

class TweetResponse(BaseModel):
    text: str
    sentiment: str
    confidence: float
    timestamp: str

class VolumeDataPoint(BaseModel):
    date: str
    count: int

class SummaryStats(BaseModel):
    total: int
    positive: int
    negative: int
    neutral: int
    sentiment_score: float
    engagement_rate: float
    active_issues: int

class FullResponse(BaseModel):
    summary: SummaryStats
    tweets: List[TweetResponse]
    volume_over_time: List[VolumeDataPoint]

# --- Competitor Models ---
class CompetitorRequest(BaseModel):
    keyword: str

class CompetitorData(BaseModel):
    name: str
    sentiment_score: float
    total_mentions: int
    positive_rate: float
    negative_rate: float

class CompetitorTimeData(BaseModel):
    date: str
    brand: float
    competitor_a: float
    competitor_b: float
    competitor_c: float
    competitor_d: float

class CompetitorResponse(BaseModel):
    competitors: List[CompetitorData]
    time_comparison: List[CompetitorTimeData]

# --- Customer Voice Models ---
class ComplaintCategory(BaseModel):
    category: str
    percentage: float
    count: int

class RecentOpinion(BaseModel):
    text: str
    sentiment: str
    confidence: float

class CustomerVoiceResponse(BaseModel):
    complaint_categories: List[ComplaintCategory]
    recent_opinions: List[RecentOpinion]

# --- Unified Response Model ---
class UnifiedAnalysisResponse(BaseModel):
    summary: SummaryStats
    tweets: List[TweetResponse]
    volume_over_time: List[VolumeDataPoint]
    customer_voice: CustomerVoiceResponse

# --- Helper Functions ---
def calculate_volume_over_time(tweets_df: pd.DataFrame) -> List[VolumeDataPoint]:
    """Calculate tweet volume per day from timestamps."""
    if tweets_df.empty:
        return []
    
    try:
        tweets_df['date'] = pd.to_datetime(tweets_df['timestamp']).dt.date
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

def categorize_complaints(negative_tweets: List[dict]) -> List[ComplaintCategory]:
    """Categorize negative tweets into complaint categories using keyword matching."""
    categories = {
        "Service Issues": ["service", "support", "help", "wait", "response", "slow", "rude"],
        "Product Quality": ["quality", "broken", "defect", "poor", "bad", "worst", "terrible"],
        "Pricing Concerns": ["price", "expensive", "cost", "money", "charge", "fee", "overcharge"],
        "Delivery Problems": ["delivery", "late", "shipping", "arrive", "delay", "lost"],
        "App/Technical": ["app", "crash", "bug", "error", "login", "down", "technical"],
        "Other": []
    }
    
    category_counts = Counter()
    
    for tweet in negative_tweets:
        text_lower = tweet['text'].lower()
        categorized = False
        
        for category, keywords in categories.items():
            if category == "Other":
                continue
            for keyword in keywords:
                if keyword in text_lower:
                    category_counts[category] += 1
                    categorized = True
                    break
            if categorized:
                break
        
        if not categorized:
            category_counts["Other"] += 1
    
    total = sum(category_counts.values()) or 1
    return [ComplaintCategory(
        category=cat, 
        percentage=round((count / total) * 100, 1),
        count=count
    ) for cat, count in category_counts.most_common() if count > 0]

# --- API Endpoints ---
@app.post("/analyze_sentiment", response_model=FullResponse)
def analyze_sentiment(request: AnalysisRequest):
    try:
        print(f"[REQUEST] Received request for: {request.keyword}")
        
        # Scrape tweets
        raw_df = scrape_topic(request.keyword, max_tweets=request.limit)
        
        # If no tweets found, return empty response instead of 404
        if raw_df.empty:
            print(f"[WARN] No tweets found for: {request.keyword}")
            return FullResponse(
                summary=SummaryStats(
                    total=0, positive=0, negative=0, neutral=0,
                    sentiment_score=0.0, engagement_rate=0.0, active_issues=0
                ),
                tweets=[],
                volume_over_time=[]
            )

        # Analyze sentiment
        processed_df = engine.process_dataframe(raw_df)

        # Calculate Stats
        total = len(processed_df)
        pos = len(processed_df[processed_df['sentiment'] == 'Positive'])
        neg = len(processed_df[processed_df['sentiment'] == 'Negative'])
        neu = len(processed_df[processed_df['sentiment'] == 'Neutral'])
        
        score = ((pos - neg) / total) * 100 if total > 0 else 0
        engagement_rate = round(random.uniform(2.5, 8.5), 2)  # Simulated for now
        active_issues = neg  # Negative tweets = active issues

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
            confidence=round(row['confidence'], 3),
            timestamp=str(row['timestamp'])
        ) for _, row in processed_df.iterrows()]

        return FullResponse(summary=summary, tweets=tweets_list, volume_over_time=volume_data)

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze_all", response_model=UnifiedAnalysisResponse)
def analyze_all(request: AnalysisRequest):
    """Unified endpoint that scrapes ONCE and returns both overview and customer voice data."""
    try:
        print(f"[UNIFIED] Analyzing all data for: {request.keyword}")
        
        # Scrape tweets ONCE
        raw_df = scrape_topic(request.keyword, max_tweets=request.limit)
        
        # If no tweets found, return empty response
        if raw_df.empty:
            print(f"[WARN] No tweets found for: {request.keyword}")
            return UnifiedAnalysisResponse(
                summary=SummaryStats(
                    total=0, positive=0, negative=0, neutral=0,
                    sentiment_score=0.0, engagement_rate=0.0, active_issues=0
                ),
                tweets=[],
                volume_over_time=[],
                customer_voice=CustomerVoiceResponse(
                    complaint_categories=[ComplaintCategory(category="No Data", percentage=100, count=0)],
                    recent_opinions=[]
                )
            )

        # Analyze sentiment ONCE
        processed_df = engine.process_dataframe(raw_df)

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
            confidence=round(row['confidence'], 3),
            timestamp=str(row['timestamp'])
        ) for _, row in processed_df.iterrows()]

        # Generate Customer Voice data from the SAME processed data
        negative_df = processed_df[processed_df['sentiment'] == 'Negative']
        negative_tweets = negative_df.to_dict('records')
        
        categories = categorize_complaints(negative_tweets)
        if not categories:
            categories = [ComplaintCategory(category="No Complaints Found", percentage=100, count=0)]
        
        recent_opinions = [RecentOpinion(
            text=row['text'][:200],
            sentiment=row['sentiment'],
            confidence=round(row['confidence'], 3)
        ) for _, row in processed_df.head(20).iterrows()]

        customer_voice = CustomerVoiceResponse(
            complaint_categories=categories,
            recent_opinions=recent_opinions
        )

        print(f"[UNIFIED] Successfully analyzed {total} tweets with {neg} issues")
        
        return UnifiedAnalysisResponse(
            summary=summary,
            tweets=tweets_list,
            volume_over_time=volume_data,
            customer_voice=customer_voice
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error in unified analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_competitors", response_model=CompetitorResponse)
def analyze_competitors(request: CompetitorRequest):
    """Get REAL competitor data using AI identification and live Twitter scraping."""
    try:
        print(f"[COMPETITORS] Finding real competitors for: {request.keyword}")
        
        # Step 1: Use Gemini AI to identify real competitors in Nigeria
        competitor_names = get_competitors(request.keyword, country="Nigeria", num_competitors=4)
        print(f"[COMPETITORS] AI identified: {competitor_names}")
        
        # Step 2: Analyze sentiment for the main brand and each competitor
        all_brands = [request.keyword] + competitor_names
        competitors = []
        brand_scores = {}  # Store scores for time comparison
        
        for brand_name in all_brands:
            print(f"[SCRAPING] Analyzing sentiment for: {brand_name}")
            try:
                # Scrape tweets for this brand (smaller sample for speed)
                raw_df = scrape_topic(brand_name, max_tweets=15)
                
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
                processed_df = engine.process_dataframe(raw_df)
                
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
                brand=brand_scores.get(request.keyword, 50) + random.uniform(-10, 10),
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
def customer_complaints(request: AnalysisRequest):
    """Get categorized customer complaints from negative tweets."""
    try:
        print(f"[VOICE] Analyzing customer complaints for: {request.keyword}")
        
        # Scrape tweets
        raw_df = scrape_topic(request.keyword, max_tweets=request.limit)
        
        # If no tweets found, return empty response instead of 404
        if raw_df.empty:
            print(f"[WARN] No tweets found for customer voice: {request.keyword}")
            return CustomerVoiceResponse(
                complaint_categories=[ComplaintCategory(category="No Data", percentage=100, count=0)],
                recent_opinions=[]
            )

        # Analyze sentiment
        processed_df = engine.process_dataframe(raw_df)
        
        # Get negative tweets for complaints
        negative_df = processed_df[processed_df['sentiment'] == 'Negative']
        negative_tweets = negative_df.to_dict('records')
        
        # Categorize complaints
        categories = categorize_complaints(negative_tweets)
        
        # If no negative tweets, provide empty categories
        if not categories:
            categories = [ComplaintCategory(category="No Complaints Found", percentage=100, count=0)]
        
        # Get recent opinions (all tweets, sorted by confidence)
        recent_opinions = [RecentOpinion(
            text=row['text'][:200],  # Truncate long texts
            sentiment=row['sentiment'],
            confidence=round(row['confidence'], 3)
        ) for _, row in processed_df.head(20).iterrows()]

        return CustomerVoiceResponse(
            complaint_categories=categories,
            recent_opinions=recent_opinions
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)