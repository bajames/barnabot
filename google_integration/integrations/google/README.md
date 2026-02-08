# Google API Integration

This integration provides access to Google Drive, Google Docs, and Gmail APIs with OAuth 2.0 authentication.

## Features

### Google Drive
- 📁 List, search, and browse files
- ⬆️ Upload files and content
- ⬇️ Download files
- 📂 Create and manage folders
- 🗑️ Delete and move files
- 🔗 Share files with users

### Google Docs
- 📝 Create and read documents
- ✏️ Insert, append, and replace text
- 🎨 Format text (bold, italic, font size)
- 🔍 Search within documents
- ✂️ Delete content ranges

### Gmail
- 📧 List and search emails
- 📬 Read email content
- ✉️ Send emails (with attachments)
- 🏷️ Manage labels
- ✅ Mark as read/unread
- 🗑️ Trash messages

## Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name/ID

### 2. Enable APIs

Enable the following APIs in your project:
1. Go to **APIs & Services** > **Library**
2. Search for and enable:
   - **Google Drive API**
   - **Google Docs API**
   - **Gmail API**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Fill in required fields:
   - **App name**: Your app name (e.g., "Claude Assistant")
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. On the Scopes screen, click **Save and Continue** (we'll use scopes defined in code)
6. Add test users (your email address) if using External type
7. Click **Save and Continue**

### 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Desktop app** as application type
4. Enter a name (e.g., "Claude Desktop Client")
5. Click **Create**
6. Download the JSON file
7. Save it as `credentials.json` in this directory (`/workspace/project/integrations/google/`)

### 5. Install Python Dependencies

```bash
cd /workspace/project/integrations/google
pip install -r requirements.txt
```

### 6. First-Time Authentication

Run the authentication test:

```bash
python auth.py
```

This will:
1. Open your browser for OAuth consent
2. Ask you to log in with your Google account
3. Request permissions for Drive, Docs, and Gmail
4. Save credentials to `token.json`

**Important**: The first time you authenticate, Google may show a warning that the app is unverified. Click "Advanced" > "Go to [Your App Name] (unsafe)" to proceed. This is normal for apps in testing mode.

## Usage Examples

### Google Drive

```python
from integrations.google import GoogleDriveClient

# Initialize client
drive = GoogleDriveClient()

# List recent files
files = drive.list_files(page_size=10)
for f in files:
    print(f"{f['name']} - {f['mimeType']}")

# Search for files
results = drive.search_files(name_contains="report", mime_type="application/pdf")

# Upload a file
file = drive.upload_file('/path/to/file.pdf', name='My Report')
print(f"Uploaded: {file['webViewLink']}")

# Upload content directly
file = drive.upload_content(
    content="Hello, World!",
    name="greeting.txt",
    mime_type="text/plain"
)

# Download a file
content = drive.download_file(file_id='abc123xyz', destination='/path/to/save.pdf')

# Create a folder
folder = drive.create_folder('My Documents')

# Share a file
drive.share_file(file_id='abc123xyz', email='user@example.com', role='reader')
```

### Google Docs

```python
from integrations.google import GoogleDocsClient

# Initialize client
docs = GoogleDocsClient()

# Create a new document
doc = docs.create_document(title='Meeting Notes')
doc_id = doc['documentId']

# Read document text
text = docs.read_document_text(doc_id)
print(text)

# Append text
docs.append_text(doc_id, '\n\nNew paragraph added!')

# Find and replace
docs.replace_text(doc_id, find_text='old', replace_text='new')

# Format text (make first 10 characters bold)
docs.format_text(doc_id, start_index=1, end_index=11, bold=True)

# Search within document
matches = docs.search_in_document(doc_id, 'important')
print(f"Found {len(matches)} matches")
```

### Gmail

```python
from integrations.google import GmailClient

# Initialize client
gmail = GmailClient()

# List recent emails
messages = gmail.list_messages(max_results=10)

# Search for emails
results = gmail.search_messages(
    from_email='boss@company.com',
    subject='quarterly report',
    is_unread=True
)

# Read an email
for msg in results:
    body = gmail.get_message_body(msg['id'])
    print(body)

# Send an email
gmail.send_message(
    to='colleague@example.com',
    subject='Project Update',
    body='Here is the latest update...'
)

# Send with attachment
gmail.send_message_with_attachment(
    to='colleague@example.com',
    subject='Report',
    body='Please see attached.',
    attachment_path='/path/to/report.pdf'
)

# Manage emails
gmail.mark_as_read(message_id='abc123')
gmail.trash_message(message_id='xyz789')

# Get labels
labels = gmail.get_labels()
for label in labels:
    print(f"{label['name']} - {label['id']}")
```

### Using Shared Auth Manager

All three clients can share the same authentication:

```python
from integrations.google import GoogleAuthManager, GoogleDriveClient, GoogleDocsClient, GmailClient

# Create one auth manager
auth = GoogleAuthManager()
auth.authenticate()

# Share it across all clients
drive = GoogleDriveClient(auth_manager=auth)
docs = GoogleDocsClient(auth_manager=auth)
gmail = GmailClient(auth_manager=auth)

# Now use all three without re-authenticating
```

## File Structure

```
/workspace/project/integrations/google/
├── __init__.py           # Package exports
├── auth.py               # OAuth 2.0 authentication
├── drive_client.py       # Google Drive operations
├── docs_client.py        # Google Docs operations
├── gmail_client.py       # Gmail operations
├── requirements.txt      # Python dependencies
├── README.md            # This file
├── credentials.json     # OAuth credentials (YOU MUST CREATE THIS)
└── token.json           # Auto-generated auth tokens
```

## Security Notes

⚠️ **Important Security Information**:

- **Never commit `credentials.json` or `token.json` to version control**
- These files contain sensitive authentication data
- Add them to `.gitignore`:
  ```
  integrations/google/credentials.json
  integrations/google/token.json
  ```
- Store `credentials.json` securely
- `token.json` will be auto-generated and should also be kept private

## Scopes

The integration requests these permissions:

- `https://www.googleapis.com/auth/drive` - Full Drive access
- `https://www.googleapis.com/auth/documents` - Google Docs access
- `https://www.googleapis.com/auth/gmail.readonly` - Read Gmail
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.modify` - Modify Gmail (labels, trash, etc.)

If you need to change scopes, edit `SCOPES` in `auth.py` and delete `token.json` to re-authenticate.

## Troubleshooting

### "Access blocked: This app hasn't been verified"

This is normal for apps in testing mode. Click "Advanced" > "Go to [App Name] (unsafe)" to proceed. To remove this warning, you'd need to verify your app with Google (requires publishing).

### "The file token.json doesn't exist"

This is normal on first run. The authentication flow will create it.

### "Invalid credentials"

1. Make sure `credentials.json` is in the correct location
2. Verify you downloaded it from the correct Google Cloud project
3. Check that you created "Desktop app" credentials (not Web app or Service account)

### "Insufficient Permission"

1. Delete `token.json`
2. Run `python auth.py` again to re-authenticate
3. Make sure you grant all requested permissions during OAuth flow

### Import errors

Make sure dependencies are installed:
```bash
pip install -r requirements.txt
```

## References

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [Google Docs API Documentation](https://developers.google.com/docs/api/how-tos/overview)
- [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
- [OAuth 2.0 for Python](https://googleapis.github.io/google-api-python-client/docs/oauth-installed.html)
