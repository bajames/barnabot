"""
Google Docs Client

Provides high-level interface for Google Docs operations.
"""

from typing import List, Dict, Optional
from googleapiclient.errors import HttpError
from .auth import GoogleAuthManager


class GoogleDocsClient:
    """Client for interacting with Google Docs API."""

    def __init__(self, auth_manager: GoogleAuthManager = None):
        """
        Initialize the Docs client.

        Args:
            auth_manager: GoogleAuthManager instance (creates new if not provided)
        """
        self.auth = auth_manager or GoogleAuthManager()
        self.service = None
        self.drive_service = None

    def _ensure_service(self):
        """Ensure Docs service is initialized."""
        if not self.service:
            self.service = self.auth.get_docs_service()
        if not self.drive_service:
            self.drive_service = self.auth.get_drive_service()

    def create_document(self, title: str, folder_id: str = None) -> Dict:
        """
        Create a new Google Doc.

        Args:
            title: Document title
            folder_id: Parent folder ID (optional)

        Returns:
            Document metadata including documentId
        """
        self._ensure_service()

        try:
            doc = self.service.documents().create(body={'title': title}).execute()
            doc_id = doc.get('documentId')

            # Move to folder if specified
            if folder_id:
                self.drive_service.files().update(
                    fileId=doc_id,
                    addParents=folder_id,
                    fields='id, parents'
                ).execute()

            print(f"Document created: {title} (ID: {doc_id})")
            return doc
        except HttpError as error:
            print(f"Error creating document: {error}")
            raise

    def get_document(self, document_id: str) -> Dict:
        """
        Get a Google Doc's content and metadata.

        Args:
            document_id: Document ID

        Returns:
            Full document data including content
        """
        self._ensure_service()

        try:
            doc = self.service.documents().get(documentId=document_id).execute()
            return doc
        except HttpError as error:
            print(f"Error getting document: {error}")
            raise

    def read_document_text(self, document_id: str) -> str:
        """
        Extract plain text from a Google Doc.

        Args:
            document_id: Document ID

        Returns:
            Document text as string
        """
        doc = self.get_document(document_id)
        content = doc.get('body', {}).get('content', [])

        text_parts = []
        for element in content:
            if 'paragraph' in element:
                for text_run in element['paragraph'].get('elements', []):
                    if 'textRun' in text_run:
                        text_parts.append(text_run['textRun'].get('content', ''))

        return ''.join(text_parts)

    def append_text(self, document_id: str, text: str) -> Dict:
        """
        Append text to the end of a document.

        Args:
            document_id: Document ID
            text: Text to append

        Returns:
            Update response
        """
        self._ensure_service()

        requests = [{
            'insertText': {
                'location': {
                    'index': 1  # Start of document
                },
                'text': text
            }
        }]

        try:
            result = self.service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()

            print(f"Text appended to document {document_id}")
            return result
        except HttpError as error:
            print(f"Error appending text: {error}")
            raise

    def insert_text(self, document_id: str, text: str, index: int = 1) -> Dict:
        """
        Insert text at a specific position.

        Args:
            document_id: Document ID
            text: Text to insert
            index: Character index (1 = start of document)

        Returns:
            Update response
        """
        self._ensure_service()

        requests = [{
            'insertText': {
                'location': {'index': index},
                'text': text
            }
        }]

        try:
            result = self.service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()

            print(f"Text inserted at index {index}")
            return result
        except HttpError as error:
            print(f"Error inserting text: {error}")
            raise

    def replace_text(self, document_id: str, find_text: str, replace_text: str,
                     match_case: bool = False) -> Dict:
        """
        Find and replace text in a document.

        Args:
            document_id: Document ID
            find_text: Text to find
            replace_text: Replacement text
            match_case: Case-sensitive matching

        Returns:
            Update response
        """
        self._ensure_service()

        requests = [{
            'replaceAllText': {
                'containsText': {
                    'text': find_text,
                    'matchCase': match_case
                },
                'replaceText': replace_text
            }
        }]

        try:
            result = self.service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()

            replacements = result.get('replies', [{}])[0].get('replaceAllText', {}).get('occurrencesChanged', 0)
            print(f"Replaced {replacements} occurrence(s) of '{find_text}'")
            return result
        except HttpError as error:
            print(f"Error replacing text: {error}")
            raise

    def format_text(self, document_id: str, start_index: int, end_index: int,
                   bold: bool = None, italic: bool = None,
                   font_size: int = None) -> Dict:
        """
        Apply formatting to text range.

        Args:
            document_id: Document ID
            start_index: Start position
            end_index: End position
            bold: Make text bold (optional)
            italic: Make text italic (optional)
            font_size: Set font size in points (optional)

        Returns:
            Update response
        """
        self._ensure_service()

        text_style = {}
        if bold is not None:
            text_style['bold'] = bold
        if italic is not None:
            text_style['italic'] = italic
        if font_size is not None:
            text_style['fontSize'] = {'magnitude': font_size, 'unit': 'PT'}

        requests = [{
            'updateTextStyle': {
                'range': {
                    'startIndex': start_index,
                    'endIndex': end_index
                },
                'textStyle': text_style,
                'fields': ','.join(text_style.keys())
            }
        }]

        try:
            result = self.service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()

            print(f"Formatted text from {start_index} to {end_index}")
            return result
        except HttpError as error:
            print(f"Error formatting text: {error}")
            raise

    def search_in_document(self, document_id: str, search_term: str) -> List[Dict]:
        """
        Search for text within a document.

        Args:
            document_id: Document ID
            search_term: Text to search for

        Returns:
            List of matches with positions
        """
        text = self.read_document_text(document_id)
        matches = []

        start = 0
        while True:
            index = text.find(search_term, start)
            if index == -1:
                break

            matches.append({
                'text': search_term,
                'start_index': index,
                'end_index': index + len(search_term)
            })
            start = index + 1

        return matches

    def delete_content_range(self, document_id: str, start_index: int,
                            end_index: int) -> Dict:
        """
        Delete content in a specific range.

        Args:
            document_id: Document ID
            start_index: Start position
            end_index: End position

        Returns:
            Update response
        """
        self._ensure_service()

        requests = [{
            'deleteContentRange': {
                'range': {
                    'startIndex': start_index,
                    'endIndex': end_index
                }
            }
        }]

        try:
            result = self.service.documents().batchUpdate(
                documentId=document_id,
                body={'requests': requests}
            ).execute()

            print(f"Deleted content from {start_index} to {end_index}")
            return result
        except HttpError as error:
            print(f"Error deleting content: {error}")
            raise


if __name__ == '__main__':
    # Test Docs client
    client = GoogleDocsClient()

    print("\n=== Testing Google Docs Client ===\n")
    print("Docs client ready for operations")
