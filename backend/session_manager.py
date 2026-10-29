# backend/session_manager.py - Session Cookie Manager & Manual Login Automation
import os
import sys
import json
import time
import urllib.parse
from typing import Dict, List, Optional, Any

# Ensure console supports utf-8 output on Windows
try:
    if hasattr(sys.stdout, 'reconfigure') and hasattr(sys.stdout, 'encoding') and sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, 'reconfigure') and hasattr(sys.stderr, 'encoding') and sys.stderr.encoding != 'utf-8':
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

# Determine root and storage paths
_current_dir = os.path.dirname(os.path.abspath(__file__))
_root_dir = os.path.abspath(os.path.join(_current_dir, ".."))

COOKIES_FILE_PATH = os.path.join(_root_dir, "cookies.json")
STORAGE_STATE_PATH = os.path.join(_root_dir, "session_state.json")
DEFAULT_CDP_URL = os.environ.get("CHROME_CDP_URL", "http://localhost:9222")


def get_cookie_paths() -> Dict[str, str]:
    """Returns absolute paths to cookies.json and session_state.json."""
    return {
        "cookies_json": COOKIES_FILE_PATH,
        "session_state_json": STORAGE_STATE_PATH
    }


def is_cdp_port_open(host: str = "127.0.0.1", port: int = 9222) -> bool:
    """Non-blocking socket check (0.5s) to verify Chrome debugging port is active."""
    import socket
    try:
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except (OSError, ConnectionRefusedError):
        return False


def check_saved_session() -> Dict[str, Any]:
    """
    Checks if a saved Twitter / X session exists and whether it contains
    the essential auth_token cookie.
    """
    has_cookies_file = os.path.exists(COOKIES_FILE_PATH)
    has_state_file = os.path.exists(STORAGE_STATE_PATH)

    if not has_cookies_file and not has_state_file:
        return {
            "saved": False,
            "has_auth_token": False,
            "cookie_count": 0,
            "cookies_path": COOKIES_FILE_PATH,
            "storage_state_path": STORAGE_STATE_PATH,
            "message": "No saved session found. Run python export_cookies.py to save your login."
        }

    cookies_list: List[Dict[str, Any]] = []

    if has_cookies_file:
        try:
            with open(COOKIES_FILE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    cookies_list = data
                elif isinstance(data, dict) and "cookies" in data:
                    cookies_list = data["cookies"]
        except Exception:
            pass

    if not cookies_list and has_state_file:
        try:
            with open(STORAGE_STATE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                cookies_list = data.get("cookies", [])
        except Exception:
            pass

    auth_token_cookie = next((c for c in cookies_list if c.get("name") == "auth_token"), None)
    ct0_cookie = next((c for c in cookies_list if c.get("name") == "ct0"), None)

    return {
        "saved": len(cookies_list) > 0,
        "has_auth_token": auth_token_cookie is not None,
        "has_ct0": ct0_cookie is not None,
        "cookie_count": len(cookies_list),
        "cookies_path": COOKIES_FILE_PATH,
        "storage_state_path": STORAGE_STATE_PATH,
        "message": "Valid authenticated session found." if auth_token_cookie else "Cookies found but missing 'auth_token'."
    }


def save_session_from_context(context, verbose: bool = True) -> Dict[str, Any]:
    """
    Extracts all cookies and storage state from an active Playwright BrowserContext
    and persists them to 'cookies.json' and 'session_state.json'.
    """
    try:
        cookies = context.cookies()
        if not cookies:
            if verbose:
                print("[SESSION WARNING] Context has 0 cookies to save.")
            return {"success": False, "count": 0, "has_auth_token": False}

        # 1. Save standard JSON cookie list to cookies.json
        with open(COOKIES_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(cookies, f, indent=2, ensure_ascii=False)

        # 2. Save full Playwright storage state (cookies + localStorage)
        try:
            context.storage_state(path=STORAGE_STATE_PATH)
        except Exception as e:
            if verbose:
                print(f"[SESSION NOTICE] storage_state export: {e}")

        has_auth_token = any(c.get("name") == "auth_token" for c in cookies)
        has_ct0 = any(c.get("name") == "ct0" for c in cookies)

        if verbose:
            print(f"[SESSION OK] Successfully saved {len(cookies)} cookies to '{COOKIES_FILE_PATH}'.")
            if has_auth_token:
                print(f"[SESSION OK] Verified Twitter 'auth_token' is present and secure.")
            else:
                print(f"[SESSION NOTICE] 'auth_token' not detected yet. Ensure you are fully logged in.")

        return {
            "success": True,
            "count": len(cookies),
            "has_auth_token": has_auth_token,
            "has_ct0": has_ct0,
            "cookies_path": COOKIES_FILE_PATH,
            "storage_state_path": STORAGE_STATE_PATH
        }
    except Exception as e:
        if verbose:
            print(f"[SESSION ERROR] Failed to save session cookies: {e}")
        return {"success": False, "error": str(e), "count": 0, "has_auth_token": False}


def load_session_into_context(context, verbose: bool = False) -> bool:
    """
    Loads saved cookies from cookies.json / session_state.json into a Playwright BrowserContext.
    """
    if not os.path.exists(COOKIES_FILE_PATH) and not os.path.exists(STORAGE_STATE_PATH):
        if verbose:
            print("[SESSION NOTICE] No cookies.json or session_state.json found to load.")
        return False

    cookies_loaded = 0

    # Try loading from cookies.json
    if os.path.exists(COOKIES_FILE_PATH):
        try:
            with open(COOKIES_FILE_PATH, "r", encoding="utf-8") as f:
                cookies = json.load(f)
                if isinstance(cookies, list) and len(cookies) > 0:
                    # Clean sameSite attribute for Playwright compliance
                    clean_cookies = []
                    for c in cookies:
                        cookie_dict = dict(c)
                        if "sameSite" in cookie_dict:
                            same_site = str(cookie_dict["sameSite"]).capitalize()
                            if same_site in ["Strict", "Lax", "None"]:
                                cookie_dict["sameSite"] = same_site
                            else:
                                del cookie_dict["sameSite"]
                        clean_cookies.append(cookie_dict)

                    context.add_cookies(clean_cookies)
                    cookies_loaded = len(clean_cookies)
                    if verbose:
                        print(f"[SESSION OK] Injected {cookies_loaded} cookies into browser context.")
                    return True
        except Exception as e:
            if verbose:
                print(f"[SESSION NOTICE] Error loading cookies.json: {e}")

    return cookies_loaded > 0


def export_from_cdp_session(cdp_url: str = DEFAULT_CDP_URL, verbose: bool = True) -> Dict[str, Any]:
    """
    Connects to an already-running Google Chrome session via CDP (port 9222)
    and saves its active cookies directly to cookies.json.
    """
    from playwright.sync_api import sync_playwright

    parsed = urllib.parse.urlparse(cdp_url)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 9222

    if not is_cdp_port_open(host, port):
        if verbose:
            print(f"[CDP NOTICE] Chrome debugging port {port} is not open.")
        return {"success": False, "error": f"Port {port} not reachable"}

    if verbose:
        print(f"[CDP] Connecting to active Chrome at {cdp_url} to extract session cookies...")

    try:
        with sync_playwright() as p:
            browser = p.chromium.connect_over_cdp(cdp_url, timeout=5000)
            context = browser.contexts[0] if browser.contexts else None
            if not context:
                return {"success": False, "error": "No browser context found on CDP"}

            res = save_session_from_context(context, verbose=verbose)
            return res
    except Exception as e:
        if verbose:
            print(f"[CDP ERROR] Failed to extract cookies from CDP: {e}")
        return {"success": False, "error": str(e)}


def interactive_manual_login(
    cdp_url: str = DEFAULT_CDP_URL,
    timeout_seconds: int = 300,
    check_interval: float = 1.5
) -> bool:
    """
    Launches a dedicated browser session for the user to perform an initial manual login.
    Detects successful login automatically by monitoring for the 'auth_token' cookie and
    navigation to the Twitter home timeline, then automatically saves session cookies.
    """
    from playwright.sync_api import sync_playwright

    print("\n" + "=" * 70)
    print("🔐 TWITTER / X INITIAL MANUAL LOGIN & SESSION CAPTURE")
    print("=" * 70)

    # 1. First check if user is already logged in on Chrome via CDP
    parsed = urllib.parse.urlparse(cdp_url)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 9222

    if is_cdp_port_open(host, port):
        print(f"[CDP DETECTED] Found active Chrome instance on port {port}.")
        print("[CDP] Checking if your running Chrome session is already authenticated...")
        cdp_res = export_from_cdp_session(cdp_url=cdp_url, verbose=False)
        if cdp_res.get("has_auth_token"):
            print(f"✅ Success! Captured {cdp_res.get('count')} cookies from your active Chrome session.")
            print(f"💾 Saved to '{COOKIES_FILE_PATH}'. You're ready to scrape without logging in again!")
            print("=" * 70 + "\n")
            return True
        else:
            print("[INFO] Active Chrome is running, but no authenticated session was detected. Opening login window...")

    # 2. Launch interactive Google Chrome window for manual login
    print("\n🚀 Opening Google Chrome for manual login...")
    print("📋 Instructions:")
    print("  1. Enter your Twitter/X credentials.")
    print("  2. Complete any 2FA or verification prompt.")
    print("  3. As soon as you reach your home timeline, cookies will be captured automatically!")
    print("=" * 70 + "\n")

    try:
        with sync_playwright() as p:
            # Try real Chrome channel first, fallback to bundled Chromium
            browser = None
            try:
                browser = p.chromium.launch(
                    channel="chrome",
                    headless=False,
                    args=[
                        "--start-maximized",
                        "--disable-blink-features=AutomationControlled",
                        "--no-default-browser-check"
                    ]
                )
            except Exception:
                browser = p.chromium.launch(
                    headless=False,
                    args=[
                        "--start-maximized",
                        "--disable-blink-features=AutomationControlled"
                    ]
                )

            context = browser.new_context(
                viewport=None,
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            )

            # Pre-load existing cookies if available
            load_session_into_context(context, verbose=False)

            page = context.new_page()
            print("[BROWSER] Navigating to https://x.com/i/flow/login ...")
            page.goto("https://x.com/i/flow/login", timeout=60000)

            print("[WAITING] Waiting for manual login to complete (monitoring for auth_token)...")

            start_time = time.time()
            login_successful = False

            while time.time() - start_time < timeout_seconds:
                cookies = context.cookies()
                auth_cookie = next((c for c in cookies if c.get("name") == "auth_token"), None)
                current_url = page.url.lower()

                # Check if auth_token is present AND we have navigated past the login flow
                is_on_home_or_timeline = (
                    "x.com/home" in current_url or 
                    "twitter.com/home" in current_url or 
                    (auth_cookie and "flow/login" not in current_url)
                )

                if auth_cookie and is_on_home_or_timeline:
                    print("\n🎉 [LOGIN DETECTED] Authentication confirmed! Finalizing session capture...")
                    # Give the browser 2 seconds to let all session cookies (ct0, personalization) persist
                    page.wait_for_timeout(2000)

                    save_result = save_session_from_context(context, verbose=True)

                    if save_result.get("success"):
                        login_successful = True
                        print("\n" + "=" * 70)
                        print("✅ SESSION COOKIES SAVED SUCCESSFULLY!")
                        print(f"📁 Cookies File:       {COOKIES_FILE_PATH}")
                        print(f"📁 Storage State File: {STORAGE_STATE_PATH}")
                        print(f"🔢 Total Cookies:      {save_result.get('count')}")
                        print("🔒 'auth_token' and session state are now securely cached.")
                        print("⚡ Future scraper requests will reuse this session without manual logins.")
                        print("=" * 70 + "\n")
                    break

                time.sleep(check_interval)

            if not login_successful:
                print("\n[SESSION TIMEOUT] 5-minute timeout reached or login was not completed.")
                # Attempt to save whatever cookies exist anyway
                save_session_from_context(context, verbose=False)

            page.wait_for_timeout(1000)
            browser.close()
            return login_successful

    except Exception as e:
        print(f"\n[SESSION ERROR] Error during interactive manual login: {e}")
        return False


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Twitter / X Session Cookie Manager")
    parser.add_argument("--check", action="store_true", help="Check status of existing saved session")
    parser.add_argument("--from-cdp", action="store_true", help="Export cookies from active Chrome on port 9222")
    args = parser.parse_args()

    if args.check:
        status = check_saved_session()
        print(json.dumps(status, indent=2))
    elif args.from_cdp:
        export_from_cdp_session(verbose=True)
    else:
        interactive_manual_login()
