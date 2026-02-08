#!/usr/bin/env python3
"""
Example usage of Google API integration

This script demonstrates how to use the Google Drive, Docs, and Gmail clients.
"""

from integrations.google import GoogleAuthManager, GoogleDriveClient, GoogleDocsClient, GmailClient


def drive_examples():
    """Examples of Google Drive operations."""
    print("\n" + "="*60)
    print("GOOGLE DRIVE EXAMPLES")
    print("="*60 + "\n")

    drive = GoogleDriveClient()

    # List recent files
    print("📁 Listing recent files...")
    files = drive.list_files(page_size=5)
    for f in files:
        print(f"  - {f['name']} ({f.get('mimeType', 'unknown')})")

    # Search for files
    print("\n🔍 Searching for PDF files...")
    pdfs = drive.search_files(mime_type='application/pdf')
    print(f"  Found {len(pdfs)} PDF files")

    # Create a folder
    print("\n📂 Creating a test folder...")
    folder = drive.create_folder('Test Folder - Delete Me')
    print(f"  Created: {folder['name']} (ID: {folder['id']})")

    # Upload text content
    print("\n⬆️  Uploading a text file...")
    text_file = drive.upload_content(
        content="This is a test file created by the Google API integration.",
        name="test.txt",
        folder_id=folder['id'],
        mime_type="text/plain"
    )
    print(f"  Uploaded: {text_file['name']}")
    print(f"  View at: {text_file['webViewLink']}")

    return folder['id'], text_file['id']


def docs_examples():
    """Examples of Google Docs operations."""
    print("\n" + "="*60)
    print("GOOGLE DOCS EXAMPLES")
    print("="*60 + "\n")

    docs = GoogleDocsClient()

    # Create a document
    print("📝 Creating a new document...")
    doc = docs.create_document(title='Test Document - Delete Me')
    doc_id = doc['documentId']
    print(f"  Created: {doc['title']} (ID: {doc_id})")

    # Add content
    print("\n✏️  Adding content to the document...")
    docs.insert_text(doc_id, "Hello from the Google API integration!\n\n", index=1)
    docs.insert_text(doc_id, "This is a test document.\n\n", index=1)

    # Format text
    print("🎨 Formatting text...")
    docs.format_text(doc_id, start_index=1, end_index=20, bold=True, font_size=14)

    # Read the document
    print("\n📖 Reading document content...")
    text = docs.read_document_text(doc_id)
    print(f"  Content preview: {text[:100]}...")

    # Find and replace
    print("\n🔄 Finding and replacing text...")
    docs.replace_text(doc_id, find_text='test', replace_text='example')

    return doc_id


def gmail_examples():
    """Examples of Gmail operations."""
    print("\n" + "="*60)
    print("GMAIL EXAMPLES")
    print("="*60 + "\n")

    gmail = GmailClient()

    # List recent messages
    print("📧 Listing recent emails...")
    messages = gmail.list_messages(max_results=5)
    print(f"  Found {len(messages)} recent messages")

    for msg in messages[:3]:
        msg_data = gmail.get_message(msg['id'], format='metadata')
        headers = {h['name']: h['value'] for h in msg_data['payload']['headers']}
        subject = headers.get('Subject', 'No Subject')
        from_addr = headers.get('From', 'Unknown')
        print(f"  - From: {from_addr}")
        print(f"    Subject: {subject[:50]}...")

    # Search for emails
    print("\n🔍 Searching unread emails...")
    unread = gmail.search_messages(is_unread=True)
    print(f"  Found {len(unread)} unread messages")

    # Get labels
    print("\n🏷️  Listing Gmail labels...")
    labels = gmail.get_labels()
    for label in labels[:5]:
        print(f"  - {label['name']}")


def main():
    """Run all examples."""
    print("\n" + "="*60)
    print("GOOGLE API INTEGRATION EXAMPLES")
    print("="*60)

    # Shared authentication
    print("\n🔐 Authenticating with Google...")
    auth = GoogleAuthManager()
    auth.authenticate()
    print("✓ Authentication successful!")

    try:
        # Run examples
        folder_id, file_id = drive_examples()
        doc_id = docs_examples()
        gmail_examples()

        print("\n" + "="*60)
        print("✓ ALL EXAMPLES COMPLETED SUCCESSFULLY!")
        print("="*60)

        print("\n📋 Created resources:")
        print(f"  - Drive folder ID: {folder_id}")
        print(f"  - Drive file ID: {file_id}")
        print(f"  - Document ID: {doc_id}")
        print("\nℹ️  These are test resources - you can delete them from Google Drive/Docs")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
