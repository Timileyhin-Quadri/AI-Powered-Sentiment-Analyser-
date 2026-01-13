import os
import time
import json
import pandas as pd
import random
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# --- Configuration ---
# Improved Keywords for Better Sentiment Capture
# These are designed to capture authentic customer experiences and emotions

keywords = [
    # --- GT Bank Negative Sentiment ---
    'GTBank OR "GT Bank" OR @gtbank_help (failed transaction OR "can\'t withdraw" OR "account locked" OR frustrating OR disappointed OR angry)',
    'GTBank OR "GT Bank" (poor service OR slow OR "not working" OR unavailable OR "worst bank" OR terrible)',
    'GTBank OR "GT Bank" (scam OR fraud OR "lost money" OR unauthorized OR debit)',
    '"my GTBank" OR "my GT Bank" (problem OR issue OR complaint OR help OR stuck)',
    
    # --- GT Bank Positive Sentiment ---
    'GTBank OR "GT Bank" (excellent OR amazing OR "love it" OR "thank you" OR grateful OR impressed)',
    'GTBank OR "GT Bank" (quick OR fast OR smooth OR seamless OR efficient OR reliable)',
    'GTBank OR "GT Bank" (best OR recommend OR "well done" OR appreciate OR satisfied)',
    
    # --- Kuda Bank Negative Sentiment ---
    'Kuda OR @kudabank OR @kudahelp (blocked OR frozen OR "can\'t access" OR locked OR restricted)',
    'Kuda (disappointed OR frustrated OR angry OR terrible OR "worst experience" OR regret)',
    'Kuda (failed OR error OR "not working" OR down OR glitch OR bug)',
    '"my Kuda" OR "my Kuda account" (problem OR issue OR help OR complaint OR stuck)',
    
    # --- Kuda Bank Positive Sentiment ---
    'Kuda OR @kudabank (amazing OR excellent OR "love it" OR fantastic OR incredible OR "best bank")',
    'Kuda (fast OR instant OR quick OR seamless OR smooth OR easy)',
    'Kuda (recommend OR "thank you" OR impressed OR happy OR satisfied OR convenient)',
    
    # --- Opay Queries (Nigerian fintech) ---
    'Opay OR OPay (failed transaction OR problem OR issue OR "not working" OR frustrated)',
    'Opay OR OPay (love OR amazing OR fast OR convenient OR "best app" OR recommend)',
    
    # --- Palmpay Queries ---
    'Palmpay OR "Palm Pay" (issue OR problem OR failed OR error OR complaint)',
    'Palmpay OR "Palm Pay" (great OR love OR easy OR fast OR reliable)',
    
    # --- Dangote Products - Negative ---
    'Dangote (poor quality OR expensive OR overpriced OR disappointed OR "not worth")',
    'Dangote cement (bad OR problem OR weak OR substandard OR complaint)',
    'Dangote (sugar OR pasta OR flour OR noodles) (quality OR taste OR price OR review)',
    
    # --- Dangote Products - Positive ---
    'Dangote (good quality OR affordable OR reliable OR trust OR recommend)',
    'Dangote cement (strong OR excellent OR "best quality" OR durable)',
    'Dangote (proud OR "Nigerian made" OR support OR quality)',
    
    # --- MTN Nigeria ---
    'MTN OR @MTNNG (poor network OR "no service" OR slow OR terrible OR frustrating)',
    'MTN OR @MTNNG (good network OR fast OR reliable OR "thank you" OR satisfied)',
    
    # --- Airtel Nigeria ---
    'Airtel OR @AirtelNigeria (network issue OR poor OR slow OR complaint OR problem)',
    'Airtel OR @AirtelNigeria (good OR fast OR better OR reliable OR recommend)',
    
    # --- General Nigerian Banking Sentiment ---
    '"Nigerian banks" OR "Nigerian banking" (experience OR frustrating OR improved OR review)',
    
    # --- Comparison Queries (Rich Sentiment Data) ---
    '(GTBank OR Kuda OR Access OR UBA) "better than" OR "worse than" OR compare',
    '(MTN OR Airtel OR Glo OR 9mobile) "better than" OR "worse than" OR "switched to"',
]

# Alternative: More Focused Keywords (if you want fewer but higher quality)
# Uncomment to use these instead of the main keywords list
"""
keywords = [
    '"just tried GTBank" OR "using GTBank" OR "my GTBank experience"',
    '"just tried Kuda" OR "using Kuda" OR "my Kuda experience" OR "switched to Kuda"',
    '"GTBank is" (amazing OR terrible OR good OR bad OR slow OR fast)',
    '"Kuda is" (amazing OR terrible OR good OR bad OR the best OR worst)',
    'GTBank (love OR hate OR disappointed OR impressed OR frustrated OR happy)',
    'Kuda (love OR hate OR disappointed OR impressed OR frustrated OR happy)',
    '"bought Dangote" OR "using Dangote" OR "tried Dangote"',
    'Dangote (quality OR price OR expensive OR cheap OR good OR bad)',
    '"my MTN" OR "my Airtel" (network OR data OR service) (good OR bad OR terrible OR excellent)',
]
"""

# --- Helper Function for Human-like Typing ---
def human_like_typing(element, text):
    """Types text into an element with small random delays."""
    for char in text:
        time.sleep(random.uniform(0.05, 0.2))
        element.send_keys(char)

# --- WebDriver Setup ---
def setup_driver():
    """Configures and returns a Selenium WebDriver instance."""
    print("🚀 Initializing WebDriver...")
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument('--no-sandbox') 
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
    chrome_options.add_argument(f'user-agent={user_agent}')

    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        print("✅ WebDriver initialized successfully.")
        return driver
    except Exception as e:
        print(f"❌ Error initializing WebDriver: {e}")
        return None
    
def setup_driver_with_profile():
    """Configures and returns a Selenium WebDriver instance using a dedicated Chrome Profile COPY."""
    print("🚀 Initializing WebDriver with a dedicated Chrome Profile...")
    chrome_options = Options()

    chrome_options.add_argument(r"--user-data-dir=C:\Users\QuadriAkanbi\AppData\Local\Google\Chrome\User Data - Copy") 
    chrome_options.add_argument(r"--profile-directory=Default")
    
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        print("✅ WebDriver initialized with your dedicated logged-in profile.")
        return driver
    except Exception as e:
        print(f"❌ Error initializing WebDriver: {e}")
        return None

def load_cookies(driver, cookie_file):
    """Loads cookies from a JSON file into the driver."""
    print(f"🍪 Loading cookies from {cookie_file}...")
    try:
        with open(cookie_file, 'r') as f:
            cookies = json.load(f)
            
        # We need to be on the domain to set cookies
        driver.get("https://twitter.com")
        
        for cookie in cookies:
            if 'sameSite' in cookie:
                if cookie['sameSite'] not in ["Strict", "Lax", "None"]:
                    del cookie['sameSite']
            
            try:
                driver.add_cookie(cookie)
            except Exception as e:
                pass
                
        print("✅ Cookies loaded successfully.")
        driver.refresh() # Refresh to apply cookies
        time.sleep(3) # Wait for reload
        return True
    except Exception as e:
        print(f"❌ Error loading cookies: {e}")
        return False

# --- Scraper Function (IMPROVED) ---
def scrape_tweets(driver, keyword, min_tweets=50, max_scroll_attempts=30):
    """
    Searches for a keyword and scrapes tweets containing the exact keyword.
    
    Args:
        driver: Selenium WebDriver instance
        keyword: The exact keyword to search for
        min_tweets: Minimum number of tweets to collect (default 50, reduced from 100)
        max_scroll_attempts: Maximum number of times to scroll for more tweets
    """
    print(f"\n🔍 Searching for tweets containing: '{keyword}'")
    
    # IMPROVED: Add language filter and date filter for better quality
    query = f"{keyword} lang:en since:2024-01-01"
    search_url = f'https://twitter.com/search?q={quote(query)}&f=live'
    driver.get(search_url)
    
    wait = WebDriverWait(driver, 20)
    tweets_data = []
    tweet_ids = set()
    scroll_attempts = 0
    no_new_tweets_count = 0

    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//article[@data-testid='tweet']")))
        
        last_height = driver.execute_script("return document.body.scrollHeight")
        last_tweet_count = 0
        
        while len(tweets_data) < min_tweets and scroll_attempts < max_scroll_attempts:
            articles = driver.find_elements(By.XPATH, "//article[@data-testid='tweet']")
            
            for article in articles:
                try:
                    tweet_text_element = article.find_element(By.XPATH, ".//div[@data-testid='tweetText']")
                    tweet_text = tweet_text_element.text.strip()
                    
                    if tweet_text and tweet_text not in tweet_ids:
                        timestamp = article.find_element(By.XPATH, ".//time").get_attribute("datetime")
                        author = article.find_element(By.XPATH, ".//div[@data-testid='User-Name']").text
                        
                        # IMPROVED: Try to get engagement metrics
                        try:
                            likes = article.find_element(By.XPATH, ".//button[@data-testid='like']").get_attribute("aria-label")
                        except:
                            likes = "0"
                        
                        try:
                            retweets = article.find_element(By.XPATH, ".//button[@data-testid='retweet']").get_attribute("aria-label")
                        except:
                            retweets = "0"
                        
                        tweet_data = {
                            'keyword': keyword,
                            'text': tweet_text,
                            'author': author,
                            'timestamp': timestamp,
                            'likes': likes,
                            'retweets': retweets
                        }
                        
                        tweets_data.append(tweet_data)
                        tweet_ids.add(tweet_text)
                        print(f"    ✅ Tweet #{len(tweets_data)}: {tweet_text[:60]}...")

                except NoSuchElementException:
                    continue
                
                if len(tweets_data) >= min_tweets:
                    print(f"🎉 Reached target of {min_tweets} tweets!")
                    break

            if len(tweets_data) == last_tweet_count:
                no_new_tweets_count += 1
                if no_new_tweets_count >= 3:
                    print("⚠️ No new tweets found after multiple scrolls.")
                    break
            else:
                no_new_tweets_count = 0
            
            last_tweet_count = len(tweets_data)
            
            scroll_delay = random.uniform(2.5, 4.0)
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(scroll_delay)
            
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                no_new_tweets_count += 1
                if no_new_tweets_count >= 3:
                    print("🏁 Reached end of scrollable content.")
                    break
            
            last_height = new_height
            scroll_attempts += 1
            print(f"📊 Progress: {len(tweets_data)}/{min_tweets} tweets | Scroll #{scroll_attempts}/{max_scroll_attempts}")
            
    except TimeoutException:
        print(f"⚠️ No tweets found for '{keyword}' or page took too long to load.")
    except Exception as e:
        print(f"An error occurred while scraping for '{keyword}': {e}")
        
    return tweets_data

# --- Main Execution ---
if __name__ == "__main__":
    start_time = time.time()
    # Check for cookies.json
    cookie_file = "cookies.json"
    use_cookies = os.path.exists(cookie_file)
    
    if use_cookies:
        print(f"📂 Found '{cookie_file}'. Using Cookie Injection method (Docker-friendly).")
        driver = setup_driver() 
        if driver:
            load_cookies(driver, cookie_file)
    else:
        print(f"📂 '{cookie_file}' not found. Using Local Chrome Profile method.")
        driver = setup_driver_with_profile() 
    all_tweets = []

    if driver:
        print("✅ Driver ready, proceeding to scrape tweets...")
        print(f"📋 Total keywords to process: {len(keywords)}")
        
        for i, keyword in enumerate(keywords, 1):
            print(f"\n{'='*70}")
            print(f"🔄 Processing keyword {i}/{len(keywords)}")
            print(f"{'='*70}")
            
            tweets = scrape_tweets(driver, keyword, min_tweets=50)  # IMPROVED: Reduced to 50
            all_tweets.extend(tweets)
            
            if i < len(keywords):
                wait_time = random.uniform(8, 15)
                print(f"⏳ Waiting {wait_time:.1f} seconds before next keyword...")
                time.sleep(wait_time)
        
        driver.quit()
        print("\n✅ Browser closed.")
        
        if all_tweets:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'tweets_sentiment_{timestamp}.csv')
            
            try:
                df = pd.DataFrame(all_tweets)
                df.to_csv(filename, index=False, encoding='utf-8')
                save_success = True
            except PermissionError:
                print(f"❌ Could not save to {filename} - Permission denied")
                alt_filename = os.path.join(os.path.expanduser("~"), "Documents", f'tweets_sentiment_{timestamp}.csv')
                try:
                    os.makedirs(os.path.dirname(alt_filename), exist_ok=True)
                    df.to_csv(alt_filename, index=False, encoding='utf-8')
                    filename = alt_filename
                    save_success = True
                except Exception as e:
                    print(f"❌ Could not save file: {str(e)}")
                    save_success = False
            except Exception as e:
                print(f"❌ Could not save file: {str(e)}")
                save_success = False
            
            print(f"\n{'='*70}")
            print(f"📊 SCRAPING SUMMARY")
            print(f"{'='*70}")
            print(f"Total tweets collected: {len(all_tweets)}")
            print(f"\nBreakdown by keyword:")
            for keyword in keywords:
                keyword_tweets = len([t for t in all_tweets if t['keyword'] == keyword])
                print(f"  • {keyword[:50]}{'...' if len(keyword) > 50 else ''}: {keyword_tweets} tweets")
            print(f"{'='*70}")
            
            if save_success:
                print(f"✅ Data saved to: {filename}")
            
            runtime = time.time() - start_time
            print(f"⏱️ Total runtime: {runtime/60:.1f} minutes")
            print(f"\n💡 Next Steps:")
            print(f"   1. Load the CSV file for sentiment analysis")
            print(f"   2. Look for sentiment patterns in the 'text' column")
            print(f"   3. Use engagement metrics (likes, retweets) to weight importance")
        else:
            print("❌ No tweets were collected.")