"""
Google API Integration Package

Provides easy access to Google Drive, Docs, and Gmail APIs.
"""

from .auth import GoogleAuthManager, SCOPES
from .drive_client import GoogleDriveClient
from .docs_client import GoogleDocsClient
from .gmail_client import GmailClient

__all__ = [
    'GoogleAuthManager',
    'GoogleDriveClient',
    'GoogleDocsClient',
    'GmailClient',
    'SCOPES'
]

__version__ = '1.0.0'
