"""
Google API Authentication Module

Handles OAuth 2.0 authentication for Google Drive, Docs, and Gmail APIs.
"""

import os
import json
from pathlib import Path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the token.json file
SCOPES = [
    'https://www.googleapis.com/auth/drive',  # Full Drive access
    'https://www.googleapis.com/auth/documents',  # Google Docs
    'https://www.googleapis.com/auth/gmail.readonly',  # Gmail read
    'https://www.googleapis.com/auth/gmail.send',  # Gmail send
    'https://www.googleapis.com/auth/gmail.modify',  # Gmail modify
]

class GoogleAuthManager:
    """Manages Google API authentication and service creation."""

    def __init__(self, credentials_path=None, token_path=None):
        """
        Initialize the authentication manager.

        Args:
            credentials_path: Path to credentials.json file
            token_path: Path to token.json file (stores access/refresh tokens)
        """
        self.credentials_path = credentials_path or os.path.join(
            os.path.dirname(__file__), 'credentials.json'
        )
        self.token_path = token_path or os.path.join(
            os.path.dirname(__file__), 'token.json'
        )
        self.creds = None

    def authenticate(self):
        """
        Authenticate with Google APIs using OAuth 2.0.

        Returns:
            Credentials object
        """
        # Check if token.json exists with valid credentials
        if os.path.exists(self.token_path):
            self.creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)

        # If credentials are invalid or don't exist, authenticate
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                # Refresh expired credentials
                print("Refreshing expired credentials...")
                self.creds.refresh(Request())
            else:
                # Run OAuth flow for new credentials
                if not os.path.exists(self.credentials_path):
                    raise FileNotFoundError(
                        f"Credentials file not found at {self.credentials_path}. "
                        "Please download credentials.json from Google Cloud Console."
                    )

                print("Starting OAuth flow...")
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, SCOPES
                )
                # Try local server first, fall back to manual flow
                try:
                    self.creds = flow.run_local_server(port=0)
                except Exception as e:
                    print(f"\nCould not open browser automatically.")
                    print("\n" + "="*70)
                    print("  MANUAL AUTHENTICATION REQUIRED")
                    print("="*70)
                    print("\n1. Open this URL in your browser:")
                    print("\n   " + flow.authorization_url(prompt='consent')[0])
                    print("\n2. After authorizing, you'll be redirected to a URL like:")
                    print("   http://localhost:xxxxx/?code=AUTHORIZATION_CODE&...")
                    print("\n3. Copy the AUTHORIZATION CODE from that URL and paste below")
                    print("   (just the code part, not the full URL)")
                    print("="*70 + "\n")
                    code = input("Enter authorization code: ").strip()
                    flow.fetch_token(code=code)
                    self.creds = flow.credentials

            # Save credentials for future use
            with open(self.token_path, 'w') as token:
                token.write(self.creds.to_json())
            print(f"Credentials saved to {self.token_path}")

        return self.creds

    def get_drive_service(self):
        """Get authenticated Google Drive service."""
        if not self.creds:
            self.authenticate()
        return build('drive', 'v3', credentials=self.creds)

    def get_docs_service(self):
        """Get authenticated Google Docs service."""
        if not self.creds:
            self.authenticate()
        return build('docs', 'v1', credentials=self.creds)

    def get_gmail_service(self):
        """Get authenticated Gmail service."""
        if not self.creds:
            self.authenticate()
        return build('gmail', 'v1', credentials=self.creds)

    def revoke_credentials(self):
        """Revoke and delete stored credentials."""
        if os.path.exists(self.token_path):
            os.remove(self.token_path)
            print(f"Credentials removed from {self.token_path}")
        self.creds = None


if __name__ == '__main__':
    # Test authentication
    auth = GoogleAuthManager()
    try:
        auth.authenticate()
        print("✓ Authentication successful!")
        print("✓ Drive service ready")
        print("✓ Docs service ready")
        print("✓ Gmail service ready")
    except Exception as e:
        print(f"✗ Authentication failed: {e}")
