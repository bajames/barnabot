"""
Google Calendar Client

Provides high-level interface for Google Calendar operations.
"""

from datetime import datetime, timezone
from typing import List, Dict, Optional
from googleapiclient.errors import HttpError
from .auth import GoogleAuthManager


class GoogleCalendarClient:
    """Client for interacting with Google Calendar API."""

    def __init__(self, auth_manager: GoogleAuthManager = None):
        self.auth = auth_manager or GoogleAuthManager()
        self.service = None

    def _ensure_service(self):
        if not self.service:
            self.service = self.auth.get_calendar_service()

    def list_calendars(self) -> List[Dict]:
        """List all calendars for the authenticated user."""
        self._ensure_service()
        try:
            result = self.service.calendarList().list().execute()
            return result.get('items', [])
        except HttpError as error:
            print(f"Error listing calendars: {error}")
            raise

    def list_events(self, calendar_id: str = 'primary', time_min: datetime = None,
                    time_max: datetime = None, max_results: int = 10) -> List[Dict]:
        """
        List events from a calendar.

        Args:
            calendar_id: Calendar ID (default: 'primary')
            time_min: Start of time range (default: now)
            time_max: End of time range (optional)
            max_results: Maximum number of events to return

        Returns:
            List of event dictionaries
        """
        self._ensure_service()

        if time_min is None:
            time_min = datetime.now(timezone.utc)

        params = {
            'calendarId': calendar_id,
            'timeMin': time_min.isoformat(),
            'maxResults': max_results,
            'singleEvents': True,
            'orderBy': 'startTime',
        }
        if time_max:
            params['timeMax'] = time_max.isoformat()

        try:
            result = self.service.events().list(**params).execute()
            return result.get('items', [])
        except HttpError as error:
            print(f"Error listing events: {error}")
            raise

    def create_event(self, summary: str, start: datetime, end: datetime,
                     description: str = None, location: str = None,
                     attendees: List[str] = None,
                     calendar_id: str = 'primary') -> Dict:
        """
        Create a calendar event.

        Args:
            summary: Event title
            start: Start datetime
            end: End datetime
            description: Event description (optional)
            location: Event location (optional)
            attendees: List of attendee email addresses (optional)
            calendar_id: Calendar ID (default: 'primary')

        Returns:
            Created event metadata
        """
        self._ensure_service()

        event = {
            'summary': summary,
            'start': {'dateTime': start.isoformat(), 'timeZone': 'UTC'},
            'end': {'dateTime': end.isoformat(), 'timeZone': 'UTC'},
        }
        if description:
            event['description'] = description
        if location:
            event['location'] = location
        if attendees:
            event['attendees'] = [{'email': e} for e in attendees]

        try:
            result = self.service.events().insert(
                calendarId=calendar_id, body=event
            ).execute()
            print(f"Event created: {result.get('summary')} (ID: {result.get('id')})")
            return result
        except HttpError as error:
            print(f"Error creating event: {error}")
            raise

    def update_event(self, event_id: str, calendar_id: str = 'primary', **kwargs) -> Dict:
        """
        Update an existing calendar event.

        Args:
            event_id: Event ID
            calendar_id: Calendar ID
            **kwargs: Fields to update (summary, description, location, start, end)

        Returns:
            Updated event metadata
        """
        self._ensure_service()

        try:
            event = self.service.events().get(
                calendarId=calendar_id, eventId=event_id
            ).execute()

            for key, value in kwargs.items():
                if key in ('start', 'end') and isinstance(value, datetime):
                    event[key] = {'dateTime': value.isoformat(), 'timeZone': 'UTC'}
                else:
                    event[key] = value

            result = self.service.events().update(
                calendarId=calendar_id, eventId=event_id, body=event
            ).execute()
            print(f"Event updated: {result.get('summary')}")
            return result
        except HttpError as error:
            print(f"Error updating event: {error}")
            raise

    def delete_event(self, event_id: str, calendar_id: str = 'primary'):
        """Delete a calendar event."""
        self._ensure_service()
        try:
            self.service.events().delete(
                calendarId=calendar_id, eventId=event_id
            ).execute()
            print(f"Event deleted: {event_id}")
        except HttpError as error:
            print(f"Error deleting event: {error}")
            raise
