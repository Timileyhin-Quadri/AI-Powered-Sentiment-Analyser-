#!/usr/bin/env python
# export_cookies.py - User-facing script to log in once and save session cookies
import sys
import os

# Add root directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.session_manager import (
    interactive_manual_login,
    check_saved_session,
    export_from_cdp_session,
    is_cdp_port_open
)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(
        description="Twitter/X Initial Login & Session Cookie Saver",
        epilog="Once saved to cookies.json, future scraping runs will not require logging in again."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check if valid session cookies are already saved"
    )
    parser.add_argument(
        "--from-cdp",
        action="store_true",
        help="Extract session cookies directly from your open Chrome (debugging port 9222)"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=300,
        help="Timeout in seconds to wait for manual login (default: 300s / 5 minutes)"
    )

    args = parser.parse_args()

    if args.check:
        status = check_saved_session()
        print("\n--- Session Cookie Status ---")
        print(f"Session Saved:   {status['saved']}")
        print(f"Has auth_token:  {status['has_auth_token']}")
        print(f"Total Cookies:   {status['cookie_count']}")
        print(f"Cookies File:    {status['cookies_path']}")
        print(f"Status Message:  {status['message']}\n")
    elif args.from_cdp:
        print("Extracting cookies from active Chrome on port 9222...")
        export_from_cdp_session(verbose=True)
    else:
        interactive_manual_login(timeout_seconds=args.timeout)
