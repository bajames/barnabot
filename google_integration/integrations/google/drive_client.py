"""
Google Drive Client

Provides high-level interface for Google Drive operations.
"""

import io
import mimetypes
from typing import List, Dict, Optional, BinaryIO
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload, MediaIoBaseUpload
from googleapiclient.errors import HttpError
from .auth import GoogleAuthManager


class GoogleDriveClient:
    """Client for interacting with Google Drive API."""

    def __init__(self, auth_manager: GoogleAuthManager = None):
        """
        Initialize the Drive client.

        Args:
            auth_manager: GoogleAuthManager instance (creates new if not provided)
        """
        self.auth = auth_manager or GoogleAuthManager()
        self.service = None

    def _ensure_service(self):
        """Ensure Drive service is initialized."""
        if not self.service:
            self.service = self.auth.get_drive_service()

    def list_files(self, query: str = None, page_size: int = 100,
                   fields: str = None) -> List[Dict]:
        """
        List files in Google Drive.

        Args:
            query: Search query (e.g., "name contains 'report'")
            page_size: Number of files to return per page
            fields: Specific fields to return

        Returns:
            List of file metadata dictionaries
        """
        self._ensure_service()

        if fields is None:
            fields = "nextPageToken, files(id, name, mimeType, modifiedTime, size, parents)"

        try:
            results = self.service.files().list(
                q=query,
                pageSize=page_size,
                fields=fields
            ).execute()

            return results.get('files', [])
        except HttpError as error:
            print(f"Error listing files: {error}")
            raise

    def search_files(self, name_contains: str = None, mime_type: str = None,
                     folder_id: str = None, trashed: bool = False) -> List[Dict]:
        """
        Search for files with specific criteria.

        Args:
            name_contains: Search by filename
            mime_type: Filter by MIME type
            folder_id: Search within specific folder
            trashed: Include trashed files

        Returns:
            List of matching files
        """
        query_parts = []

        if name_contains:
            query_parts.append(f"name contains '{name_contains}'")
        if mime_type:
            query_parts.append(f"mimeType = '{mime_type}'")
        if folder_id:
            query_parts.append(f"'{folder_id}' in parents")
        if not trashed:
            query_parts.append("trashed = false")

        query = " and ".join(query_parts) if query_parts else None
        return self.list_files(query=query)

    def get_file_metadata(self, file_id: str, fields: str = None) -> Dict:
        """
        Get metadata for a specific file.

        Args:
            file_id: Google Drive file ID
            fields: Specific fields to return

        Returns:
            File metadata dictionary
        """
        self._ensure_service()

        if fields is None:
            fields = "id, name, mimeType, modifiedTime, size, parents, webViewLink"

        try:
            return self.service.files().get(fileId=file_id, fields=fields).execute()
        except HttpError as error:
            print(f"Error getting file metadata: {error}")
            raise

    def download_file(self, file_id: str, destination: str = None) -> bytes:
        """
        Download a file from Google Drive.

        Args:
            file_id: Google Drive file ID
            destination: Local path to save file (optional)

        Returns:
            File content as bytes
        """
        self._ensure_service()

        try:
            request = self.service.files().get_media(fileId=file_id)
            file_data = io.BytesIO()
            downloader = MediaIoBaseDownload(file_data, request)

            done = False
            while not done:
                status, done = downloader.next_chunk()
                if status:
                    print(f"Download {int(status.progress() * 100)}%")

            content = file_data.getvalue()

            if destination:
                with open(destination, 'wb') as f:
                    f.write(content)
                print(f"File saved to {destination}")

            return content
        except HttpError as error:
            print(f"Error downloading file: {error}")
            raise

    def upload_file(self, file_path: str, name: str = None,
                    folder_id: str = None, mime_type: str = None) -> Dict:
        """
        Upload a file to Google Drive.

        Args:
            file_path: Local path to file
            name: Name for file in Drive (uses filename if not provided)
            folder_id: Parent folder ID (optional)
            mime_type: MIME type (auto-detected if not provided)

        Returns:
            Uploaded file metadata
        """
        self._ensure_service()

        if name is None:
            name = os.path.basename(file_path)

        if mime_type is None:
            mime_type, _ = mimetypes.guess_type(file_path)
            if mime_type is None:
                mime_type = 'application/octet-stream'

        file_metadata = {'name': name}
        if folder_id:
            file_metadata['parents'] = [folder_id]

        try:
            media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, mimeType, webViewLink'
            ).execute()

            print(f"File uploaded: {file.get('name')} (ID: {file.get('id')})")
            return file
        except HttpError as error:
            print(f"Error uploading file: {error}")
            raise

    def upload_content(self, content: bytes, name: str,
                      folder_id: str = None, mime_type: str = 'text/plain') -> Dict:
        """
        Upload content directly to Google Drive.

        Args:
            content: File content as bytes or string
            name: Name for file in Drive
            folder_id: Parent folder ID (optional)
            mime_type: MIME type

        Returns:
            Uploaded file metadata
        """
        self._ensure_service()

        if isinstance(content, str):
            content = content.encode('utf-8')

        file_metadata = {'name': name}
        if folder_id:
            file_metadata['parents'] = [folder_id]

        try:
            media = MediaIoBaseUpload(
                io.BytesIO(content),
                mimetype=mime_type,
                resumable=True
            )
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, mimeType, webViewLink'
            ).execute()

            print(f"Content uploaded: {file.get('name')} (ID: {file.get('id')})")
            return file
        except HttpError as error:
            print(f"Error uploading content: {error}")
            raise

    def create_folder(self, name: str, parent_id: str = None) -> Dict:
        """
        Create a folder in Google Drive.

        Args:
            name: Folder name
            parent_id: Parent folder ID (optional)

        Returns:
            Folder metadata
        """
        self._ensure_service()

        file_metadata = {
            'name': name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            file_metadata['parents'] = [parent_id]

        try:
            folder = self.service.files().create(
                body=file_metadata,
                fields='id, name, webViewLink'
            ).execute()

            print(f"Folder created: {folder.get('name')} (ID: {folder.get('id')})")
            return folder
        except HttpError as error:
            print(f"Error creating folder: {error}")
            raise

    def delete_file(self, file_id: str):
        """
        Delete a file from Google Drive.

        Args:
            file_id: Google Drive file ID
        """
        self._ensure_service()

        try:
            self.service.files().delete(fileId=file_id).execute()
            print(f"File deleted: {file_id}")
        except HttpError as error:
            print(f"Error deleting file: {error}")
            raise

    def move_file(self, file_id: str, new_folder_id: str) -> Dict:
        """
        Move a file to a different folder.

        Args:
            file_id: File to move
            new_folder_id: Destination folder ID

        Returns:
            Updated file metadata
        """
        self._ensure_service()

        try:
            # Get current parents
            file = self.service.files().get(fileId=file_id, fields='parents').execute()
            previous_parents = ",".join(file.get('parents', []))

            # Move file
            file = self.service.files().update(
                fileId=file_id,
                addParents=new_folder_id,
                removeParents=previous_parents,
                fields='id, parents'
            ).execute()

            print(f"File moved to folder: {new_folder_id}")
            return file
        except HttpError as error:
            print(f"Error moving file: {error}")
            raise

    def share_file(self, file_id: str, email: str, role: str = 'reader') -> Dict:
        """
        Share a file with a user.

        Args:
            file_id: File to share
            email: Email address to share with
            role: Permission role ('reader', 'writer', 'commenter')

        Returns:
            Permission metadata
        """
        self._ensure_service()

        permission = {
            'type': 'user',
            'role': role,
            'emailAddress': email
        }

        try:
            result = self.service.permissions().create(
                fileId=file_id,
                body=permission,
                fields='id'
            ).execute()

            print(f"File shared with {email} as {role}")
            return result
        except HttpError as error:
            print(f"Error sharing file: {error}")
            raise


if __name__ == '__main__':
    import os

    # Test Drive client
    client = GoogleDriveClient()

    print("\n=== Testing Google Drive Client ===\n")

    # List recent files
    print("Recent files:")
    files = client.list_files(page_size=5)
    for f in files:
        print(f"  - {f['name']} ({f['mimeType']})")
