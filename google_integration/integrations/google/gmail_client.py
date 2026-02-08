"""
Google Gmail Client

Provides high-level interface for Gmail operations.
"""

import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Dict, Optional
from googleapiclient.errors import HttpError
from .auth import GoogleAuthManager


class GmailClient:
    """Client for interacting with Gmail API."""

    def __init__(self, auth_manager: GoogleAuthManager = None):
        """
        Initialize the Gmail client.

        Args:
            auth_manager: GoogleAuthManager instance (creates new if not provided)
        """
        self.auth = auth_manager or GoogleAuthManager()
        self.service = None

    def _ensure_service(self):
        """Ensure Gmail service is initialized."""
        if not self.service:
            self.service = self.auth.get_gmail_service()

    def list_messages(self, query: str = '', max_results: int = 100,
                     label_ids: List[str] = None) -> List[Dict]:
        """
        List messages matching query.

        Args:
            query: Gmail search query (e.g., 'from:example@gmail.com')
            max_results: Maximum number of messages to return
            label_ids: Filter by label IDs (e.g., ['INBOX', 'UNREAD'])

        Returns:
            List of message metadata
        """
        self._ensure_service()

        try:
            response = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results,
                labelIds=label_ids
            ).execute()

            messages = response.get('messages', [])
            return messages
        except HttpError as error:
            print(f"Error listing messages: {error}")
            raise

    def get_message(self, message_id: str, format: str = 'full') -> Dict:
        """
        Get a specific message.

        Args:
            message_id: Message ID
            format: Message format ('full', 'metadata', 'minimal', 'raw')

        Returns:
            Message data
        """
        self._ensure_service()

        try:
            message = self.service.users().messages().get(
                userId='me',
                id=message_id,
                format=format
            ).execute()

            return message
        except HttpError as error:
            print(f"Error getting message: {error}")
            raise

    def get_message_body(self, message_id: str) -> str:
        """
        Extract plain text body from a message.

        Args:
            message_id: Message ID

        Returns:
            Message body as text
        """
        message = self.get_message(message_id)

        def parse_parts(parts):
            """Recursively parse message parts."""
            text = []
            for part in parts:
                if part.get('mimeType') == 'text/plain':
                    data = part.get('body', {}).get('data', '')
                    if data:
                        text.append(base64.urlsafe_b64decode(data).decode('utf-8'))
                elif 'parts' in part:
                    text.extend(parse_parts(part['parts']))
            return text

        # Handle different message structures
        payload = message.get('payload', {})

        if 'parts' in payload:
            body_parts = parse_parts(payload['parts'])
            return '\n'.join(body_parts)
        else:
            # Simple message with no parts
            data = payload.get('body', {}).get('data', '')
            if data:
                return base64.urlsafe_b64decode(data).decode('utf-8')

        return ''

    def search_messages(self, from_email: str = None, to_email: str = None,
                       subject: str = None, after_date: str = None,
                       before_date: str = None, has_attachment: bool = None,
                       is_unread: bool = None) -> List[Dict]:
        """
        Search messages with specific criteria.

        Args:
            from_email: Filter by sender
            to_email: Filter by recipient
            subject: Filter by subject
            after_date: Messages after date (YYYY/MM/DD)
            before_date: Messages before date (YYYY/MM/DD)
            has_attachment: Filter messages with attachments
            is_unread: Filter unread messages

        Returns:
            List of matching messages
        """
        query_parts = []

        if from_email:
            query_parts.append(f'from:{from_email}')
        if to_email:
            query_parts.append(f'to:{to_email}')
        if subject:
            query_parts.append(f'subject:{subject}')
        if after_date:
            query_parts.append(f'after:{after_date}')
        if before_date:
            query_parts.append(f'before:{before_date}')
        if has_attachment:
            query_parts.append('has:attachment')
        if is_unread:
            query_parts.append('is:unread')

        query = ' '.join(query_parts)
        return self.list_messages(query=query)

    def send_message(self, to: str, subject: str, body: str,
                    cc: str = None, bcc: str = None) -> Dict:
        """
        Send an email message.

        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body (plain text)
            cc: CC recipients (optional)
            bcc: BCC recipients (optional)

        Returns:
            Sent message metadata
        """
        self._ensure_service()

        message = MIMEText(body)
        message['to'] = to
        message['subject'] = subject
        if cc:
            message['cc'] = cc
        if bcc:
            message['bcc'] = bcc

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')

        try:
            sent_message = self.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()

            print(f"Message sent to {to}")
            return sent_message
        except HttpError as error:
            print(f"Error sending message: {error}")
            raise

    def send_message_with_attachment(self, to: str, subject: str, body: str,
                                    attachment_path: str, cc: str = None) -> Dict:
        """
        Send an email with attachment.

        Args:
            to: Recipient email address
            subject: Email subject
            body: Email body
            attachment_path: Path to file to attach
            cc: CC recipients (optional)

        Returns:
            Sent message metadata
        """
        self._ensure_service()

        import os

        message = MIMEMultipart()
        message['to'] = to
        message['subject'] = subject
        if cc:
            message['cc'] = cc

        message.attach(MIMEText(body, 'plain'))

        # Attach file
        filename = os.path.basename(attachment_path)
        with open(attachment_path, 'rb') as f:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header('Content-Disposition', f'attachment; filename="{filename}"')
            message.attach(part)

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')

        try:
            sent_message = self.service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()

            print(f"Message with attachment sent to {to}")
            return sent_message
        except HttpError as error:
            print(f"Error sending message with attachment: {error}")
            raise

    def mark_as_read(self, message_id: str) -> Dict:
        """
        Mark a message as read.

        Args:
            message_id: Message ID

        Returns:
            Updated message metadata
        """
        self._ensure_service()

        try:
            message = self.service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()

            print(f"Message {message_id} marked as read")
            return message
        except HttpError as error:
            print(f"Error marking message as read: {error}")
            raise

    def mark_as_unread(self, message_id: str) -> Dict:
        """
        Mark a message as unread.

        Args:
            message_id: Message ID

        Returns:
            Updated message metadata
        """
        self._ensure_service()

        try:
            message = self.service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'addLabelIds': ['UNREAD']}
            ).execute()

            print(f"Message {message_id} marked as unread")
            return message
        except HttpError as error:
            print(f"Error marking message as unread: {error}")
            raise

    def trash_message(self, message_id: str) -> Dict:
        """
        Move a message to trash.

        Args:
            message_id: Message ID

        Returns:
            Updated message metadata
        """
        self._ensure_service()

        try:
            message = self.service.users().messages().trash(
                userId='me',
                id=message_id
            ).execute()

            print(f"Message {message_id} moved to trash")
            return message
        except HttpError as error:
            print(f"Error trashing message: {error}")
            raise

    def get_labels(self) -> List[Dict]:
        """
        Get all Gmail labels.

        Returns:
            List of label metadata
        """
        self._ensure_service()

        try:
            results = self.service.users().labels().list(userId='me').execute()
            labels = results.get('labels', [])
            return labels
        except HttpError as error:
            print(f"Error getting labels: {error}")
            raise

    def create_label(self, name: str, label_list_visibility: str = 'labelShow',
                    message_list_visibility: str = 'show') -> Dict:
        """
        Create a new Gmail label.

        Args:
            name: Label name
            label_list_visibility: 'labelShow' or 'labelHide'
            message_list_visibility: 'show' or 'hide'

        Returns:
            Created label metadata
        """
        self._ensure_service()

        label = {
            'name': name,
            'labelListVisibility': label_list_visibility,
            'messageListVisibility': message_list_visibility
        }

        try:
            created_label = self.service.users().labels().create(
                userId='me',
                body=label
            ).execute()

            print(f"Label created: {name}")
            return created_label
        except HttpError as error:
            print(f"Error creating label: {error}")
            raise


if __name__ == '__main__':
    # Test Gmail client
    client = GmailClient()

    print("\n=== Testing Gmail Client ===\n")

    # List recent messages
    print("Recent messages:")
    messages = client.list_messages(max_results=5)
    for msg in messages:
        print(f"  - Message ID: {msg['id']}")
