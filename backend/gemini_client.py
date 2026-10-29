# gemini_client.py - AI-powered competitor identification using Azure / OpenAI API
import json
import re
from typing import List, Optional
import os
from dotenv import load_dotenv
from openai import OpenAI, AzureOpenAI

# 1. Load environment variables from .env file (checking root directory and module directory)
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))

load_dotenv(os.path.join(root_dir, ".env"))
load_dotenv(os.path.join(current_dir, ".env"))
load_dotenv()  # Fallback to current working directory

# 2. Extract configuration from environment (supports both standard and custom .env keys)
API_KEY = os.environ.get("api_key") or os.environ.get("AZURE_OPENAI_API_KEY")
RAW_ENDPOINT = os.environ.get("api_endpoint") or os.environ.get("AZURE_OPENAI_ENDPOINT") or ""
MODEL_NAME = os.environ.get("model") or os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME") or "gpt-5-mini"
API_VERSION = os.environ.get("model_version") or os.environ.get("AZURE_OPENAI_API_VERSION") or "2024-12-01-preview"

# 3. Initialize appropriate client
client = None

if API_KEY and RAW_ENDPOINT:
    try:
        # Check if endpoint is Azure AI Services / AI Foundry OpenAI-compatible endpoint
        if "services.ai.azure.com" in RAW_ENDPOINT or "/openai/v1" in RAW_ENDPOINT:
            base_endpoint = RAW_ENDPOINT.split("/openai")[0] if "/openai" in RAW_ENDPOINT else RAW_ENDPOINT
            v1_url = f"{base_endpoint}/openai/v1"
            client = OpenAI(base_url=v1_url, api_key=API_KEY, timeout=60.0)
            print(f"[AI CLIENT] Initialized OpenAI-compatible client for {base_endpoint} with model '{MODEL_NAME}'")
        else:
            # Standard Azure OpenAI deployment
            client = AzureOpenAI(
                api_version=API_VERSION,
                azure_endpoint=RAW_ENDPOINT,
                api_key=API_KEY,
                timeout=60.0,
            )
            print(f"[AI CLIENT] Initialized AzureOpenAI client for {RAW_ENDPOINT} with deployment '{MODEL_NAME}'")
    except Exception as e:
        print(f"[AI CLIENT WARNING] Failed to initialize client: {e}")
        client = None
else:
    print("[AI CLIENT WARNING] Missing API credentials in .env (api_key or api_endpoint)")


def _call_ai_completion(prompt: str, max_tokens: int = 2000) -> Optional[str]:
    """Helper to send a prompt to the configured AI model with parameter compatibility."""
    if not client:
        return None

    messages = [{"role": "user", "content": prompt}]

    # Attempt 1: For newer reasoning models (e.g. gpt-5-mini, o1, o3) which require max_completion_tokens
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            max_completion_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except Exception as e:
        err_msg = str(e)
        # Attempt 2: If model expects classic max_tokens and supports temperature
        if "max_completion_tokens" in err_msg or "unsupported_parameter" in err_msg:
            try:
                response = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=messages,
                    max_tokens=min(max_tokens, 800),
                    temperature=0.7,
                )
                return response.choices[0].message.content
            except Exception as e2:
                print(f"[AI CLIENT ERROR] Fallback call failed: {e2}")
                return None
        print(f"[AI CLIENT ERROR] Chat completion failed: {e}")
        return None


def get_competitors(brand: str, country: str = "Nigeria", num_competitors: int = 4) -> List[str]:
    """
    Use Azure/OpenAI to identify real competitors of a brand in a specific market.
    
    Args:
        brand: The brand/company name to find competitors for
        country: The target market (default: Nigeria)
        num_competitors: Number of competitors to return
    
    Returns:
        List of competitor brand names
    """
    prompt = f"""You are a market research expert specializing in {country}.

Given the brand/company "{brand}", identify exactly {num_competitors} direct competitors that operate in {country}.

Rules:
1. Only include brands that are ACTUALLY operating in {country}
2. Focus on the SAME industry/category as the input brand
3. Prefer local/regional competitors over international ones if possible
4. If the brand is not recognized, identify competitors in the most likely industry based on the name

Return ONLY a JSON array of competitor names, nothing else.
Example format: ["Competitor1", "Competitor2", "Competitor3", "Competitor4"]

Competitors of "{brand}" in {country}:"""

    try:
        content = _call_ai_completion(prompt, max_tokens=2500)
        
        if content:
            response_text = content.strip()
            # Clean markdown code blocks if present
            if "```" in response_text:
                response_text = re.sub(r'```(?:json)?', '', response_text).strip()
            
            # Try to extract JSON array from response
            json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
            if json_match:
                competitors = json.loads(json_match.group())
                competitors = [str(c).strip() for c in competitors if c]
                print(f"[AI CLIENT] Found competitors for '{brand}': {competitors}")
                return competitors[:num_competitors]
            
            # Fallback parse
            competitors = json.loads(response_text)
            if isinstance(competitors, list):
                return [str(c).strip() for c in competitors][:num_competitors]

    except Exception as e:
        print(f"[AI CLIENT] Error extracting competitors: {e}")

    # Fallback if API unavailable or parsing fails
    print(f"[AI CLIENT] Using generic fallback for '{brand}'")
    return [
        f"{brand} Competitor A",
        f"{brand} Competitor B",
        f"{brand} Competitor C",
        f"{brand} Competitor D"
    ][:num_competitors]


def get_industry_context(brand: str, country: str = "Nigeria") -> str:
    """
    Get a brief description of the brand's industry for context.
    """
    prompt = f"""What industry/sector does "{brand}" operate in, specifically in {country}?
Answer in 5 words or less. Example: "Food delivery service" or "Banking and finance"."""

    try:
        content = _call_ai_completion(prompt, max_tokens=1000)
        if content:
            return content.strip().strip('"').strip("'")
    except Exception as e:
        print(f"[AI CLIENT] Error getting industry: {e}")
        
    return "Commercial Enterprise"


# Test execution
if __name__ == "__main__":
    test_brands = ["GTBank", "Chowdeck", "MTN Nigeria"]
    for brand in test_brands:
        print(f"\n--- Testing: {brand} ---")
        comps = get_competitors(brand)
        print(f"Competitors: {comps}")
        ind = get_industry_context(brand)
        print(f"Industry: {ind}")
