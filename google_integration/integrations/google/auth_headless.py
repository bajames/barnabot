#!/usr/bin/env python3
"""
Headless authentication helper for Google APIs
Prints the authorization URL and waits for the code
"""

import os
from google_auth_oauthlib.flow import InstalledAppFlow

# Same scopes as auth.py
SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
]

def main():
    credentials_path = os.path.join(os.path.dirname(__file__), 'credentials.json')
    token_path = os.path.join(os.path.dirname(__file__), 'token.json')

    if not os.path.exists(credentials_path):
        print(f"ERROR: credentials.json not found at {credentials_path}")
        return

    if os.path.exists(token_path):
        print("Token already exists! Delete token.json to re-authenticate.")
        return

    print("Initializing OAuth flow...")
    flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)

    # Get the authorization URL
    auth_url, _ = flow.authorization_url(prompt='consent')

    print("\n" + "="*70)
    print("  GOOGLE API AUTHENTICATION")
    print("="*70)
    print("\nSTEP 1: Open this URL in your browser:")
    print("\n" + auth_url)
    print("\nSTEP 2: After authorizing, you'll be redirected to a URL like:")
    print("   http://localhost:xxxxx/?code=4/0A...&scope=...")
    print("\nSTEP 3: Copy the FULL REDIRECT URL and paste it below")
    print("="*70 + "\n")

    redirect_url = input("Paste the full redirect URL here: ").strip()

    print("\nProcessing authorization...")

    # Extract the code from the redirect URL
    from urllib.parse import urlparse, parse_qs
    parsed = urlparse(redirect_url)
    code = parse_qs(parsed.query).get('code', [None])[0]

    if not code:
        print("ERROR: Could not extract authorization code from URL")
        return

    # Exchange code for credentials
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Save credentials
    with open(token_path, 'w') as token:
        token.write(creds.to_json())

    print(f"\n✓ SUCCESS! Credentials saved to {token_path}")
    print("✓ You can now use the Google API integration!")

if __name__ == '__main__':
    main()
