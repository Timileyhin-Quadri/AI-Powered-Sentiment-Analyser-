import time
import os
import pandas as pd
import psutil
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from urllib.parse import quote

def kill_existing_chrome():
    """Kill old chrome processes to unlock the profile folder."""
    print("🧹 Cleaning up old browser processes...")
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            if 'chromedriver' in proc.info['name'].lower() or 'chrome' in proc.info['name'].lower():
                proc.kill()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass

def get_driver():
    # 1. Kill zombies first
    kill_existing_chrome()
    time.sleep(2)
    
    print("🚀 Initializing WebDriver...")
    chrome_options = Options()
    
    # --- YOUR PROFILE PATH ---
    # Ensure this matches your path exactly
    chrome_options.add_argument(r"--user-data-dir=C:\Users\QuadriAkanbi\AppData\Local\Google\Chrome\User Data - Copy") 
    chrome_options.add_argument(r"--profile-directory=Default")
    
    # Visible mode is safer for Twitter
    chrome_options.add_argument("--start-maximized")
    
    # Stability flags
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)

    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        return driver
    except Exception as e:
        print(f"❌ Driver Launch Error: {e}")
        raise e

# --- MODIFIED FUNCTION SIGNATURE ---
# Removed 'driver' from arguments. The function now creates its own driver.
def scrape_topic(topic, max_tweets=30):
    driver = None
    tweets_data = []
    
    try:
        # Initialize Driver INSIDE the function
        driver = get_driver()
        print(f"🕷️ Scraping topic: {topic}")
        
        query = f"{topic} lang:en"
        url = f'https://twitter.com/search?q={quote(query)}&f=live'
        
        driver.get(url)
        time.sleep(5)
        
        wait = WebDriverWait(driver, 20)
        try:
            wait.until(EC.presence_of_element_located((By.XPATH, "//article[@data-testid='tweet']")))
        except:
            print(f"⚠️ Timeout: No tweets found for {topic}")
            return pd.DataFrame() # Return empty DF

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
                        
                        if text in seen_text or len(text) < 10: continue
                        
                        try: ts = article.find_element(By.XPATH, ".//time").get_attribute("datetime")
                        except: ts = str(time.time())

                        tweets_data.append({"text": text, "timestamp": ts, "keyword": topic})
                        seen_text.add(text)
                        new_found = True
                        
                        if len(tweets_data) >= max_tweets: break
                    except: continue
                
                if not new_found:
                    scroll_attempts += 1
                else:
                    scroll_attempts = 0
                
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
                
            except Exception as e:
                scroll_attempts += 1
            
    except Exception as e:
        print(f"❌ Critical Scraping Error: {e}")
        
    finally:
        # CRITICAL: Always close the driver when done
        if driver:
            print("🛑 Closing Browser...")
            driver.quit()
            
    print(f"✅ Scraped {len(tweets_data)} tweets for '{topic}'.")
    return pd.DataFrame(tweets_data)