#!/usr/bin/env python3
"""
Check for bills and payment-related emails
"""
import sys
sys.path.insert(0, '/workspace/project')

from integrations.google import GoogleAuthManager, GmailClient
from datetime import datetime, timedelta

auth = GoogleAuthManager()
auth.authenticate()

gmail = GmailClient(auth_manager=auth)

# Search for bill-related emails
print("Searching for bills and payment emails...\n")

# Common bill-related search terms
search_queries = [
    'subject:(bill OR invoice OR payment OR due OR statement)',
    'is:unread (bill OR invoice OR payment OR due)',
]

results = []

for query in search_queries:
    messages = gmail.list_messages(query=query, max_results=20)

    for msg in messages:
        try:
            msg_data = gmail.get_message(msg['id'], format='metadata')
            headers = {h['name']: h['value'] for h in msg_data['payload']['headers']}

            # Check if unread
            is_unread = 'UNREAD' in msg_data.get('labelIds', [])

            result = {
                'id': msg['id'],
                'from': headers.get('From', 'Unknown'),
                'subject': headers.get('Subject', 'No Subject'),
                'date': headers.get('Date', 'Unknown'),
                'is_unread': is_unread
            }

            # Avoid duplicates
            if not any(r['id'] == result['id'] for r in results):
                results.append(result)
        except Exception as e:
            print(f"Error processing message: {e}")

# Sort by unread first, then by date
results.sort(key=lambda x: (not x['is_unread'], x['date']), reverse=True)

if results:
    print(f"Found {len(results)} bill/payment-related emails:\n")
    print("="*80)

    for i, msg in enumerate(results[:15], 1):  # Show top 15
        status = "📧 UNREAD" if msg['is_unread'] else "✓ Read"
        print(f"\n{i}. {status}")
        print(f"   From: {msg['from']}")
        print(f"   Subject: {msg['subject']}")
        print(f"   Date: {msg['date']}")

    print("\n" + "="*80)

    # Count unread bills
    unread_count = sum(1 for m in results if m['is_unread'])
    if unread_count > 0:
        print(f"\n⚠️  You have {unread_count} UNREAD bill/payment emails!")
    else:
        print(f"\n✓ All bill/payment emails have been read")
else:
    print("No bill or payment-related emails found.")
