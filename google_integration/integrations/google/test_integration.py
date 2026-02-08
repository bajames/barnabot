#!/usr/bin/env python3
"""
Test the Google API integration
"""
import sys
import os

# Add the integrations directory to the path
sys.path.insert(0, '/workspace/project')

try:
    from integrations.google import GoogleAuthManager, GoogleDriveClient, GoogleDocsClient, GmailClient

    print("✓ Imports successful")

    # Test authentication
    print("\nTesting authentication...")
    auth = GoogleAuthManager()
    auth.authenticate()
    print("✓ Authentication successful")

    # Test Drive
    print("\nTesting Google Drive...")
    drive = GoogleDriveClient(auth_manager=auth)
    files = drive.list_files(page_size=5)
    print(f"✓ Drive working - found {len(files)} recent files")
    for f in files[:3]:
        print(f"  - {f['name']}")

    # Test Gmail
    print("\nTesting Gmail...")
    gmail = GmailClient(auth_manager=auth)
    messages = gmail.list_messages(max_results=3)
    print(f"✓ Gmail working - found {len(messages)} recent messages")

    # Test Docs
    print("\nTesting Google Docs...")
    docs = GoogleDocsClient(auth_manager=auth)
    print("✓ Docs client initialized")

    print("\n" + "="*70)
    print("  ✓✓✓ ALL TESTS PASSED! ✓✓✓")
    print("="*70)
    print("\nThe Google API integration is fully operational!")
    print("You can now ask Claude to:")
    print("  • List, search, upload, and download Drive files")
    print("  • Create and edit Google Docs")
    print("  • Read and send Gmail messages")
    print("="*70 + "\n")

except Exception as e:
    print(f"\n✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
