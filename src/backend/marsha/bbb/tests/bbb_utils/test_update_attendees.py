"""Tests for the update_attendees service in the ``bbb`` app of the Marsha project."""
from unittest import mock

from django.test import TestCase
from django.utils import timezone
from django.utils.datetime_safe import datetime

from marsha.bbb.factories import AttendeeFactory
from marsha.bbb.utils.bbb_utils import update_attendees
from marsha.core.utils.time_utils import to_timestamp


class ClassroomServiceUpdateAttendeesTestCase(TestCase):
    """Test our intentions about the Classroom update_attendees service."""

    maxDiff = None

    def test_update_attendees_joined(self):
        """Test manage_attendees when a user joins."""
        entered_at = datetime(2021, 10, 29, 13, 32, 27, tzinfo=timezone.utc)
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        attendees = {
            attendee_1["userID"]: {
                "fullname": attendee_1["fullName"],
                "presence": [
                    {
                        "entered_at": to_timestamp(entered_at),
                        "left_at": None,
                    }
                ],
            },
        }

        updates = {
            "joined": [attendee_2],
            "left": [],
        }

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            attendees = update_attendees(attendees, updates)
        self.assertDictEqual(
            attendees,
            {
                attendee_1["userID"]: {
                    "fullname": attendee_1["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(entered_at),
                            "left_at": None,
                        }
                    ],
                },
                attendee_2["userID"]: {
                    "fullname": attendee_2["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(now),
                            "left_at": None,
                        }
                    ],
                },
            },
        )

    def test_update_attendees_leaved(self):
        """Test manage_attendees updates when a user leaves."""
        entered_at = datetime(2021, 10, 29, 13, 32, 27, tzinfo=timezone.utc)
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        attendees = {
            attendee_1["userID"]: {
                "fullname": attendee_1["fullName"],
                "presence": [
                    {
                        "entered_at": to_timestamp(entered_at),
                        "left_at": None,
                    }
                ],
            },
            attendee_2["userID"]: {
                "fullname": attendee_2["fullName"],
                "presence": [
                    {
                        "entered_at": to_timestamp(entered_at),
                        "left_at": None,
                    }
                ],
            },
        }

        updates = {
            "joined": [],
            "left": [attendee_1, attendee_2],
        }

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            attendees = update_attendees(attendees, updates)
        self.assertDictEqual(
            attendees,
            {
                attendee_1["userID"]: {
                    "fullname": attendee_1["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(entered_at),
                            "left_at": to_timestamp(now),
                        }
                    ],
                },
                attendee_2["userID"]: {
                    "fullname": attendee_2["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(entered_at),
                            "left_at": to_timestamp(now),
                        }
                    ],
                },
            },
        )

    def test_update_attendees_session_starting(self):
        """Test manage_attendees updates when no user is in the session."""
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        attendees = {}

        updates = {
            "joined": [attendee_1, attendee_2],
            "left": [],
        }

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            attendees = update_attendees(attendees, updates)
        self.assertDictEqual(
            attendees,
            {
                attendee_1["userID"]: {
                    "fullname": attendee_1["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(now),
                            "left_at": None,
                        }
                    ],
                },
                attendee_2["userID"]: {
                    "fullname": attendee_2["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(now),
                            "left_at": None,
                        }
                    ],
                },
            },
        )

    def test_update_attendees_session_ending(self):
        """Test manage_attendees updates when all users left the session."""
        entered_at = datetime(2021, 10, 29, 13, 32, 27, tzinfo=timezone.utc)
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        attendees = {
            attendee_1["userID"]: {
                "fullname": attendee_1["fullName"],
                "presence": [
                    {
                        "entered_at": to_timestamp(entered_at),
                        "left_at": None,
                    }
                ],
            },
            attendee_2["userID"]: {
                "fullname": attendee_2["fullName"],
                "presence": [
                    {
                        "entered_at": to_timestamp(entered_at),
                        "left_at": None,
                    }
                ],
            },
        }

        updates = {
            "joined": [],
            "left": [attendee_1, attendee_2],
        }

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            attendees = update_attendees(attendees, updates)
        self.assertDictEqual(
            attendees,
            {
                attendee_1["userID"]: {
                    "fullname": attendee_1["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(entered_at),
                            "left_at": to_timestamp(now),
                        }
                    ],
                },
                attendee_2["userID"]: {
                    "fullname": attendee_2["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(entered_at),
                            "left_at": to_timestamp(now),
                        }
                    ],
                },
            },
        )

    def test_update_attendees_rejoined(self):
        """Test manage_attendees when a user joins."""
        entered_at = datetime(2021, 10, 29, 13, 32, 27, tzinfo=timezone.utc)
        leaved_at = datetime(2021, 10, 29, 13, 35, 27, tzinfo=timezone.utc)
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        attendees = {
            attendee_1["userID"]: {
                "fullname": attendee_1["fullName"],
                "presence": [
                    {
                        "entered_at": to_timestamp(entered_at),
                        "left_at": None,
                    }
                ],
            },
            attendee_2["userID"]: {
                "fullname": attendee_2["fullName"],
                "presence": [
                    {
                        "entered_at": to_timestamp(entered_at),
                        "left_at": leaved_at.isoformat(),
                    }
                ],
            },
        }

        updates = {
            "joined": [attendee_2],
            "left": [],
        }

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            attendees = update_attendees(attendees, updates)
        self.assertDictEqual(
            attendees,
            {
                attendee_1["userID"]: {
                    "fullname": attendee_1["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(entered_at),
                            "left_at": None,
                        }
                    ],
                },
                attendee_2["userID"]: {
                    "fullname": attendee_2["fullName"],
                    "presence": [
                        {
                            "entered_at": to_timestamp(entered_at),
                            "left_at": leaved_at.isoformat(),
                        },
                        {
                            "entered_at": to_timestamp(now),
                            "left_at": None,
                        },
                    ],
                },
            },
        )
