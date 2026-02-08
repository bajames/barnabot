#!/usr/bin/env python3
"""
Simple script to generate the Google OAuth URL
Run this to get the URL to visit for authentication
"""

import json
import urllib.parse

# Read credentials
with open('credentials.json', 'r') as f:
    creds = json.load(f)

client_id = creds['installed']['client_id']
redirect_uri = creds['installed']['redirect_uris'][0]

# Build authorization URL
params = {
    'client_id': client_id,
    'redirect_uri': redirect_uri,
    'response_type': 'code',
    'scope': ' '.join([
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
    ]),
    'access_type': 'offline',
    'prompt': 'consent'
}

auth_url = 'https://accounts.google.com/o/oauth2/auth?' + urllib.parse.urlencode(params)

print("\n" + "="*70)
print("  GOOGLE API AUTHENTICATION - STEP 1")
print("="*70)
print("\nOpen this URL in your browser:\n")
print(auth_url)
print("\n" + "="*70)
print("\nAfter authorizing, copy the FULL redirect URL and we'll continue...")
print("="*70 + "\n")
