import time
import json
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

def export_cookies():
    """
    Launches a browser for the user to log in, then saves cookies to cookies.json.
    """
    print("🚀 Initializing WebDriver for Cookie Export...")
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--start-maximized")
    
    # Use the existing "Copy" profile that we know works/has history
    # This avoids the "New Login" detection triggers
    chrome_options.add_argument(r"--user-data-dir=C:\Users\QuadriAkanbi\AppData\Local\Google\Chrome\User Data - Copy") 
    chrome_options.add_argument(r"--profile-directory=Default")

    # Anti-detection flags
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Fake User Agent
    user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    chrome_options.add_argument(f'user-agent={user_agent}')
    # We don't use the profile here because we want a fresh session to capture the login
    # OR we can use the profile to make it easier, but let's try to capture a fresh valid session
    # actually, using the profile is better if they are already logged in there.
    # But the user wants to move to Docker, so a clean export is best.
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print("\n" + "="*60)
        print("🛑 ACTION REQUIRED")
        print("1. The browser has opened.")
        print("2. Please log in to Twitter (x.com) manually.")
        print("3. Once you are on the home timeline, come back here.")
        print("="*60 + "\n")
        
        driver.get("https://twitter.com/i/flow/login")
        
        # Wait for user to log in
        input("⌨️  Press ENTER here after you have successfully logged in and can see your timeline... ")
        
        # Get cookies
        cookies = driver.get_cookies()
        
        if not cookies:
            print("❌ No cookies found. Did you log in?")
            return
            
        # Save to file
        with open("cookies.json", "w") as f:
            json.dump(cookies, f, indent=4)
            
        print(f"\n✅ Success! {len(cookies)} cookies saved to 'cookies.json'.")
        print("You can now use these cookies with the scraper in Docker.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if 'driver' in locals():
            driver.quit()

if __name__ == "__main__":
    export_cookies()
