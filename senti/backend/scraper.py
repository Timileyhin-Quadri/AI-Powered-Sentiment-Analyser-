import time
import os
import pandas as pd
import psutil
import random
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from urllib.parse import quote
from datetime import datetime
import re
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


# User agents to rotate
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]


def kill_chromedriver_only():
    """Kill only chromedriver processes (not Chrome itself)."""
    print("🧹 Cleaning up old chromedriver processes...")
    killed = 0
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            proc_name = proc.info['name'].lower() if proc.info['name'] else ''
            if 'chromedriver' in proc_name:
                proc.kill()
                killed += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    if killed > 0:
        print(f"   Killed {killed} chromedriver process(es)")
        time.sleep(2)


def get_driver():
    """Initialize Chrome driver with user profile for authenticated session."""
    kill_chromedriver_only()
    
    print("🚀 Initializing WebDriver...")
    chrome_options = Options()
    
    # Get Chrome profile path from environment
    chrome_profile = os.environ.get("CHROME_PROFILE_PATH", r"C:\Users\QuadriAkanbi\AppData\Local\Google\Chrome\User Data - Copy")
    chrome_options.add_argument(f"--user-data-dir={chrome_profile}") 
    chrome_options.add_argument(r"--profile-directory=Default")
    
    # Visible mode
    chrome_options.add_argument("--start-maximized")
    
    # Stability flags
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    print("✅ WebDriver initialized!")
    return driver


def scrape_with_selenium(topic: str, max_tweets: int = 30) -> list:
    """Scrape tweets using Selenium with Chrome profile."""
    driver = None
    tweets_data = []
    
    try:
        driver = get_driver()
        print(f"🕷️ Scraping topic: {topic}")
        
        query = f"{topic} lang:en"
        url = f'https://twitter.com/search?q={quote(query)}&f=live'
        
        driver.get(url)
        time.sleep(random.uniform(4, 6))
        
        wait = WebDriverWait(driver, 20)
        try:
            wait.until(EC.presence_of_element_located((By.XPATH, "//article[@data-testid='tweet']")))
        except:
            print(f"⚠️ Timeout: No tweets found for {topic}")
            return []
        
        seen_text = set()
        scroll_attempts = 0
        
        while len(tweets_data) < max_tweets and scroll_attempts < 10:
            try:
                articles = driver.find_elements(By.XPATH, "//article[@data-testid='tweet']")
                new_found = False
                
                for article in articles:
                    try:
                        text_elem = article.find_element(By.XPATH, ".//div[@data-testid='tweetText']")
                        text = text_elem.text.strip()
                        
                        if text in seen_text or len(text) < 10:
                            continue
                        
                        try:
                            ts = article.find_element(By.XPATH, ".//time").get_attribute("datetime")
                        except:
                            ts = datetime.now().isoformat()

                        tweets_data.append({
                            "text": text,
                            "timestamp": ts,
                            "keyword": topic
                        })
                        seen_text.add(text)
                        new_found = True
                        print(f"[+] Tweet {len(tweets_data)}: {text[:60]}...")
                        
                        if len(tweets_data) >= max_tweets:
                            break
                    except:
                        continue
                
                if not new_found:
                    scroll_attempts += 1
                else:
                    scroll_attempts = 0
                
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(random.uniform(1.5, 3.0))
                
            except Exception as e:
                print(f"⚠️ Scroll error: {e}")
                scroll_attempts += 1
                
    finally:
        if driver:
            print("🛑 Closing Browser...")
            try:
                driver.quit()
            except:
                pass
            
    return tweets_data


def scrape_topic(topic: str, max_tweets: int = 30) -> pd.DataFrame:
    """
    Main scraping function.
    Uses Selenium with Chrome profile.
    """
    # Close any existing Chrome browsers before starting
    print("🧹 Closing any existing Chrome browsers...")
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            proc_name = proc.info['name'].lower() if proc.info['name'] else ''
            if 'chrome' in proc_name and 'chromedriver' not in proc_name:
                proc.kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    time.sleep(2)
    
    print(f"🕷️ Starting scrape for: {topic}")
    tweets_data = []
    
    # Use Selenium
    try:
        tweets_data = scrape_with_selenium(topic, max_tweets)
    except Exception as e:
        print(f"[ERROR] Selenium failed: {e}")
    
    print(f"✅ Scraped {len(tweets_data)} tweets for '{topic}'.")
    time.sleep(random.uniform(1, 2))
    
    return pd.DataFrame(tweets_data)


if __name__ == "__main__":
    df = scrape_topic("dangote", max_tweets=10)
    print(f"\nResults ({len(df)} tweets):")
    if not df.empty:
        for _, row in df.iterrows():
            print(f"- {row['text'][:100]}...")