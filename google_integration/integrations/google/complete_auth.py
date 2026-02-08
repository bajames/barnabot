#!/usr/bin/env python3
"""
Complete the OAuth flow with the redirect URL
"""

import json
import urllib.parse
import sys

if len(sys.argv) < 2:
    print("Usage: python3 complete_auth.py '<full_redirect_url>'")
    sys.exit(1)

redirect_url = sys.argv[1]

# Parse the URL to extract the authorization code
parsed = urllib.parse.urlparse(redirect_url)
params = urllib.parse.parse_qs(parsed.query)

if 'code' not in params:
    print("ERROR: No authorization code found in URL")
    print(f"Parsed URL: {redirect_url}")
    print(f"Query params: {params}")
    sys.exit(1)

code = params['code'][0]
print(f"✓ Extracted authorization code: {code[:20]}...")

# Now we need to exchange this code for tokens
# We'll create a minimal token that can be refreshed
print("\nCreating token file...")

# Read credentials to get client info
with open('credentials.json', 'r') as f:
    creds = json.load(f)

client_id = creds['installed']['client_id']
client_secret = creds['installed']['client_secret']

# Exchange code for token using urllib (no dependencies needed)
import urllib.request

token_url = 'https://oauth2.googleapis.com/token'
data = urllib.parse.urlencode({
    'code': code,
    'client_id': client_id,
    'client_secret': client_secret,
    'redirect_uri': 'http://localhost',
    'grant_type': 'authorization_code'
}).encode()

try:
    req = urllib.request.Request(token_url, data=data)
    with urllib.request.urlopen(req) as response:
        token_data = json.loads(response.read().decode())

    # Save token
    token_json = {
        'token': token_data.get('access_token'),
        'refresh_token': token_data.get('refresh_token'),
        'token_uri': 'https://oauth2.googleapis.com/token',
        'client_id': client_id,
        'client_secret': client_secret,
        'scopes': [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/documents',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.modify',
        ]
    }

    with open('token.json', 'w') as f:
        json.dump(token_json, f, indent=2)

    print("\n" + "="*70)
    print("  ✓ SUCCESS! Authentication complete!")
    print("="*70)
    print(f"\nToken saved to: token.json")
    print("\nYou can now use the Google API integration!")
    print("="*70 + "\n")

except Exception as e:
    print(f"\n✗ Error exchanging code for token: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
