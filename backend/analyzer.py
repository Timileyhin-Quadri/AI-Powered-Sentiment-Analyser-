# backend/analyzer.py - 5-Mini AI Sentiment & Smart Categorisation Engine
import os
import re
import json
from typing import List, Dict, Optional, Any
from collections import Counter
import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI, AzureOpenAI

try:
    from backend.models import ComplaintCategory
except ImportError:
    from models import ComplaintCategory

# ==============================================================================
#                 EXTENDED SMART CATEGORISATION TAXONOMY
# ==============================================================================

EXTENDED_COMPLAINT_CATEGORIES = [
    "Customer Support & Service",
    "App & Digital Platform",
    "Billing & Transaction Reversals",
    "Network & Server Downtime",
    "Delivery & Logistics",
    "Product Quality & Defects",
    "Account Security & Fraud",
    "Pricing & Unfair Fees",
    "Policy & Terms Transparency",
    "Staff Conduct & Professionalism",
    "Other Issues",
]

# Keyword dictionary for offline/fallback heuristic categorization
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Customer Support & Service": [
        "service", "support", "help", "wait", "response", "slow", "call", "agent",
        "representative", "ticket", "unanswered", "email", "helpline", "hold", "queue", "rude agent"
    ],
    "App & Digital Platform": [
        "app", "crash", "bug", "error", "login", "down", "update", "biometric",
        "otp", "screen", "glitch", "freeze", "blank", "ui", "interface", "install", "version"
    ],
    "Billing & Transaction Reversals": [
        "debit", "debit alert", "reversed", "reversal", "charge", "refund", "deduction",
        "overcharge", "unauthorized", "dispense error", "pending transfer", "money gone", "stole", "debited"
    ],
    "Network & Server Downtime": [
        "network", "server", "downtime", "offline", "timeout", "connection", "pos declined",
        "ussd", "transfer failed", "interbank", "switch", "gateway", "unreachable", "737"
    ],
    "Delivery & Logistics": [
        "delivery", "rider", "dispatch", "late", "shipping", "arrive", "delay", "lost",
        "package", "food cold", "wrong order", "tracking", "courier", "missing item"
    ],
    "Product Quality & Defects": [
        "quality", "broken", "defect", "poor", "bad", "worst", "terrible", "fake",
        "counterfeit", "damaged", "expired", "spoilt", "tear", "faulty"
    ],
    "Account Security & Fraud": [
        "scam", "fraud", "hacked", "phishing", "freeze", "frozen", "blocked",
        "kyc", "bvn", "security", "compromised", "identity", "suspicious", "lockout"
    ],
    "Pricing & Unfair Fees": [
        "price", "expensive", "cost", "fee", "rate", "overpriced", "tax",
        "tariff", "hidden charge", "exorbitant", "inflation", "value for money"
    ],
    "Policy & Terms Transparency": [
        "policy", "terms", "condition", "rules", "unfair", "misleading",
        "cancelled", "subscription", "fine print", "promise"
    ],
    "Staff Conduct & Professionalism": [
        "rude", "teller", "security", "manager", "branch", "attitude",
        "hostile", "disrespectful", "unprofessional", "shouted", "ignored"
    ],
}


class SentimentEngine:
    """
    AI-powered sentiment analysis and smart complaint categorization engine.
    Uses gpt-5-mini as the primary analysis model with graceful offline fallback.
    """

    def __init__(self):
        # 1. Load environment configurations
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.abspath(os.path.join(current_dir, ".."))
        load_dotenv(os.path.join(root_dir, ".env"))
        load_dotenv(os.path.join(current_dir, ".env"))
        load_dotenv()

        self.api_key = os.environ.get("api_key") or os.environ.get("AZURE_OPENAI_API_KEY")
        self.raw_endpoint = os.environ.get("api_endpoint") or os.environ.get("AZURE_OPENAI_ENDPOINT") or ""
        self.model_name = os.environ.get("model") or os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME") or "gpt-5-mini"
        self.api_version = os.environ.get("model_version") or os.environ.get("AZURE_OPENAI_API_VERSION") or "2024-12-01-preview"

        # 2. Initialize AI client
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initializes the Azure / OpenAI client."""
        if not self.api_key or not self.raw_endpoint:
            print("[AI ANALYZER WARNING] Missing API credentials in .env. Will use rule-based fallback.")
            return

        try:
            if "services.ai.azure.com" in self.raw_endpoint or "/openai/v1" in self.raw_endpoint:
                base_endpoint = self.raw_endpoint.split("/openai")[0] if "/openai" in self.raw_endpoint else self.raw_endpoint
                v1_url = f"{base_endpoint}/openai/v1"
                self.client = OpenAI(base_url=v1_url, api_key=self.api_key, timeout=60.0)
                print(f"[AI ANALYZER] Initialized gpt-5-mini AI Engine via {base_endpoint}")
            else:
                self.client = AzureOpenAI(
                    api_version=self.api_version,
                    azure_endpoint=self.raw_endpoint,
                    api_key=self.api_key,
                    timeout=60.0
                )
                print(f"[AI ANALYZER] Initialized AzureOpenAI client with deployment '{self.model_name}'")
        except Exception as e:
            print(f"[AI ANALYZER WARNING] Failed to initialize AI client: {e}")
            self.client = None

    def clean_text(self, text: Any) -> str:
        """Sanitizes text by removing handle tags and raw URLs."""
        clean = re.sub(r"@\w+", "@user", str(text))
        clean = re.sub(r"https?://\S+|www\.\S+", "http", clean)
        clean = re.sub(r"\s+", " ", clean).strip()
        return clean

    def _fallback_categorize(self, text: str) -> str:
        """Heuristic rule-based categorization fallback."""
        text_lower = text.lower()
        for cat, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    return cat
        return "Other Issues"

    def _fallback_analyze_single(self, text: str) -> Dict[str, Any]:
        """Simple rule-based sentiment fallback when AI client is unreachable."""
        text_lower = text.lower()
        pos_words = ["good", "great", "excellent", "fast", "love", "reliable", "seamless", "happy", "thank", "best", "smooth", "resolved", "awesome"]
        neg_words = ["bad", "worst", "terrible", "slow", "crash", "error", "debit", "stole", "unacceptable", "scam", "fraud", "rude", "poor", "pain", "down", "issue"]

        pos_score = sum(1 for w in pos_words if w in text_lower)
        neg_score = sum(1 for w in neg_words if w in text_lower)

        if pos_score > neg_score:
            sentiment = "Positive"
            confidence = min(0.70 + (pos_score * 0.08), 0.96)
            category = None
            emotion = "joy"
        elif neg_score > pos_score:
            sentiment = "Negative"
            confidence = min(0.70 + (neg_score * 0.08), 0.98)
            category = self._fallback_categorize(text)
            emotion = "frustration"
        else:
            sentiment = "Neutral"
            confidence = 0.72
            category = None
            emotion = "neutral"

        return {
            "sentiment": sentiment,
            "confidence": round(confidence, 3),
            "category": category,
            "emotion": emotion,
            "summary": text[:60] + "..." if len(text) > 60 else text
        }

    def _analyze_batch_with_5_mini(self, tweets_batch: List[Dict[str, Any]], brand: str = "") -> List[Dict[str, Any]]:
        """Sends a batch of tweets to gpt-5-mini for deep sentiment & smart categorization."""
        if not self.client:
            return [self._fallback_analyze_single(t["text"]) for t in tweets_batch]

        brand_context = f" Target brand: {brand}." if brand else ""
        prompt = f"""You are an expert AI brand sentiment & customer voice analyst specializing in Nigerian social media data.{brand_context}
Analyze the following social posts.

For each post, output:
- id: original post id
- sentiment: exactly one of ['Positive', 'Negative', 'Neutral']
- confidence: float between 0.0 and 1.0 (confidence in this classification)
- category: if Negative, choose the single most fitting category from: {EXTENDED_COMPLAINT_CATEGORIES}. If Positive or Neutral, return null.
- emotion: dominant emotional tone (e.g. joy, anger, frustration, trust, disgust, fear, neutral, disappointment)
- summary: brief summary under 10 words

Input Tweets:
{json.dumps([{'id': t['id'], 'text': t['text']} for t in tweets_batch])}

Return ONLY a valid JSON array of objects with the fields above."""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_completion_tokens=2500
            )

            raw_text = response.choices[0].message.content or ""
            # Strip markdown formatting
            if "```" in raw_text:
                raw_text = re.sub(r"```(?:json)?", "", raw_text).strip()

            match = re.search(r"\[.*?\]", raw_text, re.DOTALL)
            if match:
                items = json.loads(match.group())
                lookup = {item["id"]: item for item in items if isinstance(item, dict) and "id" in item}

                results = []
                for t in tweets_batch:
                    tid = t["id"]
                    if tid in lookup:
                        info = lookup[tid]
                        # Validate category
                        cat = info.get("category")
                        if cat not in EXTENDED_COMPLAINT_CATEGORIES:
                            cat = self._fallback_categorize(t["text"]) if info.get("sentiment") == "Negative" else None

                        results.append({
                            "sentiment": info.get("sentiment", "Neutral"),
                            "confidence": float(info.get("confidence", 0.85)),
                            "category": cat,
                            "emotion": info.get("emotion", "neutral"),
                            "summary": info.get("summary", t["text"][:50]),
                        })
                    else:
                        results.append(self._fallback_analyze_single(t["text"]))
                return results

        except Exception as e:
            print(f"[AI ANALYZER] 5-mini batch call failed ({e}). Falling back to rule-based engine.")

        # Fallback for this batch
        return [self._fallback_analyze_single(t["text"]) for t in tweets_batch]

    def process_dataframe(self, df: pd.DataFrame, brand: str = "") -> pd.DataFrame:
        """
        Reworked analysis workflow:
        Processes scraped dataframe using gpt-5-mini with smart categorisation.
        """
        if df.empty:
            return df

        # Clean text
        df = df.copy()
        df["clean_text"] = df["text"].apply(self.clean_text)

        # Prepare records with IDs
        records = [{"id": i, "text": row["clean_text"]} for i, row in df.iterrows()]

        batch_size = 12
        all_results: List[Dict[str, Any]] = []

        print(f"[5-MINI WORKFLOW] Analyzing {len(records)} scraped posts with {self.model_name}...")

        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            batch_results = self._analyze_batch_with_5_mini(batch, brand=brand)
            all_results.extend(batch_results)

        # Attach enriched columns
        df["sentiment"] = [r["sentiment"] for r in all_results]
        df["confidence"] = [r["confidence"] for r in all_results]
        df["category"] = [r["category"] for r in all_results]
        df["emotion"] = [r["emotion"] for r in all_results]
        df["summary"] = [r["summary"] for r in all_results]

        print(f"[5-MINI WORKFLOW] Analysis complete: "
              f"Pos: {len(df[df['sentiment'] == 'Positive'])}, "
              f"Neg: {len(df[df['sentiment'] == 'Negative'])}, "
              f"Neu: {len(df[df['sentiment'] == 'Neutral'])}")

        return df

    def categorize_complaints(self, negative_tweets: List[Dict[str, Any]]) -> List[ComplaintCategory]:
        """
        Calculates complaint category percentages and counts across the extended taxonomy.
        """
        if not negative_tweets:
            return [ComplaintCategory(category="No Complaints Found", percentage=100.0, count=0)]

        category_counts = Counter()

        for tweet in negative_tweets:
            cat = tweet.get("category")
            # If category wasn't set or is None, infer using extended keywords
            if not cat or cat not in EXTENDED_COMPLAINT_CATEGORIES:
                cat = self._fallback_categorize(tweet.get("text", ""))
            category_counts[cat] += 1

        total = sum(category_counts.values()) or 1
        sorted_categories = [
            ComplaintCategory(
                category=cat,
                percentage=round((count / total) * 100, 1),
                count=count
            )
            for cat, count in category_counts.most_common()
            if count > 0
        ]

        return sorted_categories or [ComplaintCategory(category="No Complaints Found", percentage=100.0, count=0)]

    def generate_ai_complaint_insights(
        self,
        df: pd.DataFrame,
        categories: List[ComplaintCategory],
        brand: str = ""
    ) -> Dict[str, Any]:
        """
        Uses 5-mini to generate an Executive Diagnosis of customer complaints,
        highlighting key themes and actionable operational recommendations.
        """
        brand_label = brand or "Target Brand"
        total = len(df)
        pos = len(df[df['sentiment'] == 'Positive']) if total > 0 else 0
        neg = len(df[df['sentiment'] == 'Negative']) if total > 0 else 0
        neu = len(df[df['sentiment'] == 'Neutral']) if total > 0 else 0

        # Sample negative complaints
        neg_posts = df[df['sentiment'] == 'Negative']['clean_text'].tolist() if 'clean_text' in df.columns else []
        top_cats = [f"{c.category}: {c.percentage}% ({c.count} posts)" for c in categories if c.category != "No Complaints Found"][:4]

        if not self.client or neg == 0:
            # Fallback heuristic insights
            if neg == 0:
                return {
                    "summary": f"Public perception for {brand_label} is overwhelmingly positive or neutral across scanned posts, with zero severe complaints identified.",
                    "key_themes": ["High Customer Satisfaction", "Positive Brand Perception", "Stable Service Delivery"],
                    "recommendation": f"Continue proactive customer communication to maintain strong market sentiment."
                }
            top_cat_names = [c.category for c in categories[:3]]
            return {
                "summary": f"Scanned customer sentiment for {brand_label} indicates key operational bottlenecks primarily centered on {', '.join(top_cat_names)}.",
                "key_themes": [f"{cat} friction" for cat in top_cat_names],
                "recommendation": f"Prioritize fast resolution workflows for {top_cat_names[0] if top_cat_names else 'support issues'} to stem negative brand churn."
            }

        prompt = f"""You are a senior brand intelligence & customer experience strategist for Nigerian businesses.
Target Brand: {brand_label}
Volume Analyzed: {total} total social posts (Positive: {pos}, Negative: {neg}, Neutral: {neu})
Top Complaint Categories:
{chr(10).join(f"- {c}" for c in top_cats)}

Sample Customer Complaints:
{chr(10).join(f'"{p[:160]}"' for p in neg_posts[:5])}

Generate an executive diagnosis in JSON with:
- "summary": 2 concise sentences summarizing current customer sentiment and root grievances.
- "key_themes": array of 3 to 4 specific pain point themes detected.
- "recommendation": 1 clear, actionable recommendation for executive management and support teams.

Return ONLY a valid JSON object matching this schema."""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_completion_tokens=2000
            )
            raw = response.choices[0].message.content or ""
            if "```" in raw:
                raw = re.sub(r"```(?:json)?", "", raw).strip()
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return {
                    "summary": data.get("summary", f"Analysis completed for {brand_label}."),
                    "key_themes": data.get("key_themes", ["Service Delivery", "App Stability", "Billing"]),
                    "recommendation": data.get("recommendation", f"Streamline support response times for {brand_label}.")
                }
        except Exception as e:
            print(f"[AI ANALYZER] 5-mini complaint insights call failed: {e}")

        top_cat_names = [c.category for c in categories[:3]]
        return {
            "summary": f"Scanned customer sentiment for {brand_label} highlights friction primarily in {', '.join(top_cat_names)}.",
            "key_themes": [f"{cat} friction" for cat in top_cat_names],
            "recommendation": f"Accelerate remediation workflows for {top_cat_names[0] if top_cat_names else 'support issues'} to preserve customer loyalty."
        }