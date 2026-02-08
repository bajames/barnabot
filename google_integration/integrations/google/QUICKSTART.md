# Quick Start Guide

Get up and running with Google Drive, Docs, and Gmail integration in 5 minutes!

## Step 1: Get Your Credentials (5 minutes)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create/Select a Project**
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it (e.g., "Claude Assistant")
   - Click "Create"

3. **Enable APIs**
   - In the left menu: APIs & Services → Library
   - Search and enable these three APIs:
     - ✅ Google Drive API
     - ✅ Google Docs API
     - ✅ Gmail API

4. **Set Up OAuth Consent**
   - APIs & Services → OAuth consent screen
   - Choose "External" → Create
   - Fill in:
     - App name: "Claude Assistant"
     - User support email: your email
     - Developer email: your email
   - Click through: Save and Continue → Save and Continue → Save and Continue

5. **Create Credentials**
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: **Desktop app**
   - Name: "Claude Desktop"
   - Create
   - **Download JSON** (button appears)
   - Save as `credentials.json` in `/workspace/project/integrations/google/`

## Step 2: Install Dependencies

```bash
cd /workspace/project/integrations/google
pip install -r requirements.txt
```

## Step 3: Authenticate

```bash
python auth.py
```

This will:
- Open your browser
- Ask you to log in
- Show a warning about unverified app (click Advanced → Go to app)
- Ask for permissions (click Allow)
- Save your credentials

✅ You're done! The integration is ready to use.

## Step 4: Test It Out

```bash
python example_usage.py
```

This will demonstrate:
- Listing your Drive files
- Creating a test folder and file
- Creating a Google Doc
- Listing your emails

## Quick Usage

### From Python

```python
from integrations.google import GoogleDriveClient, GoogleDocsClient, GmailClient

# Use any client
drive = GoogleDriveClient()
files = drive.list_files(page_size=10)

docs = GoogleDocsClient()
doc = docs.create_document(title='My Document')

gmail = GmailClient()
messages = gmail.list_messages(max_results=5)
```

### From Claude (Me!)

Once you've completed the setup, just ask me:

- "List my recent Drive files"
- "Search for PDFs in my Drive"
- "Create a Google Doc called 'Meeting Notes'"
- "Show me my unread emails"
- "Upload this content to Drive"

I'll use the integration automatically!

## Troubleshooting

**"App is not verified" warning**
- This is normal for testing
- Click "Advanced" → "Go to [app name] (unsafe)"

**Browser doesn't open**
- Copy the URL from terminal and paste in browser

**Permission errors**
- Delete `token.json` and run `python auth.py` again

## Next Steps

Read the full [README.md](README.md) for:
- Complete API reference
- All available methods
- Advanced usage examples
- Security best practices
