"""Tests for the diff_attendees service in the ``bbb`` app of the Marsha project."""

from django.test import TestCase

from marsha.bbb.factories import AttendeeFactory
from marsha.bbb.utils.bbb_utils import diff_attendees


class ClassroomServiceDiffAttendeesTestCase(TestCase):
    """Test our intentions about the Classroom diff_attendees service."""

    maxDiff = None

    def test_diff_attendees_no_diff(self):
        """Check diff attendees when there is no diff."""
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        current_attendees = [attendee_1, attendee_2]
        stored_attendees = [attendee_1, attendee_2]

        diff = diff_attendees(current_attendees, stored_attendees)
        self.assertEqual(diff, {"joined": [], "left": []})

    def test_diff_attendees_joined(self):
        """Check diff attendees when a user joins."""
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        current_attendees = [attendee_1, attendee_2]
        stored_attendees = [attendee_1]

        diff = diff_attendees(current_attendees, stored_attendees)
        self.assertEqual(
            diff,
            {
                "joined": [attendee_2],
                "left": [],
            },
        )

    def test_diff_attendees_leaved(self):
        """Check diff attendees when a user leaves."""
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        current_attendees = [attendee_1]
        stored_attendees = [attendee_1, attendee_2]

        diff = diff_attendees(current_attendees, stored_attendees)
        self.assertEqual(
            diff,
            {
                "joined": [],
                "left": [attendee_2],
            },
        )

    def test_diff_attendees_session_starting(self):
        """Check diff attendees when no user is in the session."""
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        current_attendees = [attendee_1, attendee_2]
        stored_attendees = []

        diff = diff_attendees(current_attendees, stored_attendees)
        self.assertEqual(diff, {"joined": [attendee_1, attendee_2], "left": []})

    def test_diff_attendees_session_ending(self):
        """Check diff attendees when all users left the session."""
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        current_attendees = []
        stored_attendees = [attendee_1, attendee_2]

        diff = diff_attendees(current_attendees, stored_attendees)
        self.assertEqual(diff, {"joined": [], "left": [attendee_1, attendee_2]})
