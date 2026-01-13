# azure_openai_client.py - AI-powered competitor identification using Azure OpenAI
import json
import re
from typing import List
import os
from dotenv import load_dotenv
from openai import AzureOpenAI

# Load environment variables from .env file
load_dotenv()

# Configure Azure OpenAI API
AZURE_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT")

# Initialize the Azure OpenAI client with extended timeout
client = AzureOpenAI(
    api_version=os.environ.get("AZURE_OPENAI_API_VERSION", "2024-12-01-preview"),
    azure_endpoint=AZURE_ENDPOINT, # type: ignore
    api_key=AZURE_API_KEY,
    timeout=60.0,  # 60 second timeout
)

# Deployment name for the model
DEPLOYMENT_NAME = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")


def get_competitors(brand: str, country: str = "Nigeria", num_competitors: int = 4) -> List[str]:
    """
    Use Azure OpenAI to identify real competitors of a brand in a specific market.
    
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
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "You are a market research expert. Always respond with valid JSON arrays only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Try to extract JSON array from response
        # Handle cases where response might have extra text
        json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
        if json_match:
            competitors = json.loads(json_match.group())
            # Clean and validate
            competitors = [str(c).strip() for c in competitors if c]
            print(f"[AZURE OPENAI] Found competitors: {competitors}")
            return competitors[:num_competitors]
        
        # Fallback: try to parse the entire response as JSON
        competitors = json.loads(response_text)
        return competitors[:num_competitors]
        
    except Exception as e:
        print(f"[AZURE OPENAI] Error getting competitors: {e}")
        # Return generic fallback
        return [f"{brand} Competitor A", f"{brand} Competitor B", 
                f"{brand} Competitor C", f"{brand} Competitor D"]


def get_industry_context(brand: str, country: str = "Nigeria") -> str:
    """
    Get a brief description of the brand's industry for context.
    """
    prompt = f"""What industry/sector does "{brand}" operate in, specifically in {country}?
Answer in 5 words or less. Example: "Food delivery service" or "Banking and finance"."""

    try:
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "You are a market research expert. Be concise."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=50
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[AZURE OPENAI] Error getting industry: {e}")
        return "Unknown industry"


# Test function
if __name__ == "__main__":
    # Test with some Nigerian brands
    test_brands = ["Chowdeck", "GTBank", "MTN Nigeria", "Jumia"]
    
    for brand in test_brands:
        print(f"\n--- {brand} ---")
        competitors = get_competitors(brand)
        print(f"Competitors: {competitors}")
