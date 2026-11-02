# backend/database.py - Database Layer for SentiTrack (Supabase PostgreSQL + Local SQLite Fallback)
import os
import json
import sqlite3
import datetime
from typing import List, Dict, Any, Optional
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "backend", "data")
os.makedirs(DATA_DIR, exist_ok=True)
SQLITE_DB_PATH = os.path.join(DATA_DIR, "sentitrack.db")

# Supabase Credentials (from environment or defaults)
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or "https://keaqonqlvicdwlsdnqpe.supabase.co"
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or
    os.environ.get("SUPABASE_KEY") or
    os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY") or
    "sb_publishable_59LYLM6sCtxQXJsxHi6M7Q_aNWxOu-4"
)

# ==============================================================================
#                      SQLITE LOCAL FALLBACK STORAGE
# ==============================================================================

def _get_sqlite_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with row factory configured."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_local_database():
    """Initializes local SQLite database tables if they do not exist."""
    with _get_sqlite_connection() as conn:
        cursor = conn.cursor()
        # Tweets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tracked_tweets (
                tweet_id TEXT PRIMARY KEY,
                brand TEXT NOT NULL,
                text TEXT NOT NULL,
                clean_text TEXT,
                sentiment TEXT NOT NULL,
                confidence REAL,
                category TEXT,
                emotion TEXT,
                summary TEXT,
                timestamp TEXT,
                scraped_at TEXT DEFAULT (datetime('now'))
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tweets_brand ON tracked_tweets(brand)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tweets_sentiment ON tracked_tweets(sentiment)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tweets_category ON tracked_tweets(category)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tweets_scraped_at ON tracked_tweets(scraped_at)")

        # Brand metadata table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tracked_brands (
                brand TEXT PRIMARY KEY,
                last_scraped_at TEXT DEFAULT (datetime('now')),
                total_posts INTEGER DEFAULT 0,
                sentiment_score REAL DEFAULT 0.0
            )
        """)
        conn.commit()


# Initialize SQLite tables on module import
try:
    init_local_database()
except Exception as e:
    print(f"[DB NOTICE] Local SQLite initialization: {e}")


# ==============================================================================
#                      SUPABASE POSTGREST CLIENT
# ==============================================================================

def _supabase_headers() -> Dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }


def _supabase_available() -> bool:
    """Checks if Supabase is reachable and table exists."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    try:
        url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/tracked_tweets?select=tweet_id&limit=1"
        res = requests.get(url, headers=_supabase_headers(), timeout=3.0)
        return res.status_code == 200
    except Exception:
        return False


# Cached check for Supabase availability
_USE_SUPABASE = None

def is_supabase_enabled() -> bool:
    global _USE_SUPABASE
    if _USE_SUPABASE is None:
        _USE_SUPABASE = _supabase_available()
        mode = "Supabase Cloud PostgreSQL" if _USE_SUPABASE else f"Local SQLite ({SQLITE_DB_PATH})"
        print(f"[DATABASE] Primary Storage Engine: {mode}")
    return _USE_SUPABASE


# ==============================================================================
#                      CRUD REPOSITORY FUNCTIONS
# ==============================================================================

def save_tweets_to_db(brand: str, tweets: List[Dict[str, Any]]) -> int:
    """
    Saves a batch of analyzed tweets for a brand into the database with deduplication.
    Tries Supabase first; if unavailable or RLS restricted, saves to local SQLite.
    Returns count of newly inserted tweets.
    """
    if not tweets:
        return 0

    brand_clean = brand.strip().lower()
    inserted_count = 0

    # 1. Attempt Supabase Cloud Insert
    if is_supabase_enabled():
        try:
            records = []
            for i, t in enumerate(tweets):
                tid = t.get("tweet_id") or t.get("id") or f"{brand_clean}_{int(datetime.datetime.now().timestamp())}_{i}"
                records.append({
                    "tweet_id": str(tid),
                    "brand": brand_clean,
                    "text": t.get("text", ""),
                    "clean_text": t.get("clean_text") or t.get("text", ""),
                    "sentiment": t.get("sentiment", "Neutral"),
                    "confidence": float(t.get("confidence", 0.85)),
                    "category": t.get("category"),
                    "emotion": t.get("emotion"),
                    "summary": t.get("summary"),
                    "timestamp": str(t.get("timestamp") or datetime.datetime.now().isoformat())
                })

            url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/tracked_tweets"
            headers = _supabase_headers()
            headers["Prefer"] = "resolution=ignore-duplicates,return=representation"
            res = requests.post(url, headers=headers, json=records, timeout=10.0)

            if res.status_code in [200, 201]:
                inserted_count = len(res.json()) if res.text else len(records)
                print(f"[SUPABASE] Successfully stored {inserted_count} tweets for '{brand}'.")
                # Also mirror into local SQLite for fast local read
            else:
                print(f"[SUPABASE NOTICE] Cloud write status {res.status_code} ({res.text[:100]}). Falling back to SQLite.")
        except Exception as e:
            print(f"[SUPABASE ERROR] {e}. Falling back to SQLite.")

    # 2. Local SQLite Insert (Always keep SQLite updated as fast local cache)
    try:
        with _get_sqlite_connection() as conn:
            cursor = conn.cursor()
            sqlite_inserted = 0
            for i, t in enumerate(tweets):
                tid = str(t.get("tweet_id") or t.get("id") or f"{brand_clean}_{int(datetime.datetime.now().timestamp())}_{i}")
                cursor.execute("""
                    INSERT OR IGNORE INTO tracked_tweets
                    (tweet_id, brand, text, clean_text, sentiment, confidence, category, emotion, summary, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    tid,
                    brand_clean,
                    t.get("text", ""),
                    t.get("clean_text") or t.get("text", ""),
                    t.get("sentiment", "Neutral"),
                    float(t.get("confidence", 0.85)),
                    t.get("category"),
                    t.get("emotion"),
                    t.get("summary"),
                    str(t.get("timestamp") or datetime.datetime.now().isoformat())
                ))
                if cursor.rowcount > 0:
                    sqlite_inserted += 1

            # Update tracked_brands summary
            cursor.execute("""
                INSERT INTO tracked_brands (brand, last_scraped_at, total_posts)
                VALUES (?, datetime('now'), ?)
                ON CONFLICT(brand) DO UPDATE SET
                    last_scraped_at = datetime('now'),
                    total_posts = (SELECT COUNT(*) FROM tracked_tweets WHERE brand = ?)
            """, (brand_clean, sqlite_inserted, brand_clean))

            conn.commit()
            if inserted_count == 0:
                inserted_count = sqlite_inserted
            print(f"[SQLITE] Stored {sqlite_inserted} new tweets for '{brand}' (Total brand posts: {_get_brand_count(brand_clean, cursor)}).")
    except Exception as e:
        print(f"[SQLITE ERROR] Could not save to local database: {e}")

    return inserted_count


def _get_brand_count(brand_clean: str, cursor) -> int:
    try:
        cursor.execute("SELECT COUNT(*) FROM tracked_tweets WHERE brand = ?", (brand_clean,))
        row = cursor.fetchone()
        return row[0] if row else 0
    except Exception:
        return 0


def get_tweets_from_db(
    brand: str,
    limit: int = 50,
    max_age_hours: Optional[int] = 24
) -> List[Dict[str, Any]]:
    """
    Retrieves stored tweets for a brand from the database.
    Checks if data is fresh within `max_age_hours`.
    """
    brand_clean = brand.strip().lower()

    # 1. Try Supabase first if available
    if is_supabase_enabled():
        try:
            url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/tracked_tweets?brand=eq.{brand_clean}&order=scraped_at.desc&limit={limit}"
            res = requests.get(url, headers=_supabase_headers(), timeout=5.0)
            if res.status_code == 200:
                data = res.json()
                if data:
                    print(f"[SUPABASE] Retrieved {len(data)} cached tweets for '{brand}'.")
                    return data
        except Exception as e:
            print(f"[SUPABASE QUERY NOTICE] {e}. Trying SQLite.")

    # 2. Query Local SQLite
    try:
        with _get_sqlite_connection() as conn:
            cursor = conn.cursor()
            query = """
                SELECT tweet_id, brand, text, clean_text, sentiment, confidence,
                       category, emotion, summary, timestamp, scraped_at
                FROM tracked_tweets
                WHERE brand = ?
            """
            params: List[Any] = [brand_clean]

            if max_age_hours is not None:
                query += " AND scraped_at >= datetime('now', ?)"
                params.append(f"-{max_age_hours} hours")

            query += " ORDER BY scraped_at DESC LIMIT ?"
            params.append(limit)

            cursor.execute(query, params)
            rows = cursor.fetchall()
            results = [dict(row) for row in rows]
            if results:
                print(f"[SQLITE] Retrieved {len(results)} cached tweets for '{brand}'.")
            return results
    except Exception as e:
        print(f"[SQLITE QUERY ERROR] {e}")
        return []


def get_tracked_brands() -> List[Dict[str, Any]]:
    """Returns list of all brands currently stored in the database with their metrics."""
    try:
        with _get_sqlite_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT b.brand, b.last_scraped_at, COUNT(t.tweet_id) as total_posts,
                       ROUND(AVG(CASE WHEN t.sentiment = 'Positive' THEN 100.0 WHEN t.sentiment = 'Negative' THEN 0.0 ELSE 50.0 END), 1) as sentiment_score
                FROM tracked_brands b
                LEFT JOIN tracked_tweets t ON b.brand = t.brand
                GROUP BY b.brand
                ORDER BY b.last_scraped_at DESC
            """)
            return [dict(row) for row in cursor.fetchall()]
    except Exception as e:
        print(f"[DB ERROR] Could not get tracked brands: {e}")
        return []


def get_brand_summary(brand: str) -> Optional[Dict[str, Any]]:
    """Calculates summary statistics directly from stored database tweets."""
    tweets = get_tweets_from_db(brand, limit=200, max_age_hours=None)
    if not tweets:
        return None

    total = len(tweets)
    pos = sum(1 for t in tweets if t.get("sentiment") == "Positive")
    neg = sum(1 for t in tweets if t.get("sentiment") == "Negative")
    neu = sum(1 for t in tweets if t.get("sentiment") == "Neutral")
    score = round(((pos - neg) / total) * 100, 2) if total > 0 else 0.0

    return {
        "brand": brand,
        "total": total,
        "positive": pos,
        "negative": neg,
        "neutral": neu,
        "sentiment_score": score,
        "active_issues": neg
    }

