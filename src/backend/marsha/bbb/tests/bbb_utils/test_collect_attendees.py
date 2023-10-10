"""Tests for the collect_attendees service in the ``bbb`` app of the Marsha project."""
import json
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone
from django.utils.datetime_safe import datetime

import responses

from marsha.bbb.factories import AttendeeFactory, ClassroomSessionFactory
from marsha.bbb.tests.utils import mock_get_meeting_info
from marsha.bbb.utils.bbb_utils import collect_attendees
from marsha.core.utils.time_utils import to_timestamp


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
class ClassroomServiceCollectAttendeesTestCase(TestCase):
    """Test our intentions about the Classroom collect_attendees service."""

    maxDiff = None

    @responses.activate
    def test_collect_attendees_joined(self):
        """Test collect_attendees when a user joins."""
        entered_at = datetime(2021, 10, 29, 13, 32, 27, tzinfo=timezone.utc)
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        session = ClassroomSessionFactory(
            current_attendees=[attendee_1],
            attendees=json.dumps(
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
                }
            ),
        )

        mock_get_meeting_info(
            attendees=[
                attendee_1,
                attendee_2,
                # same user joined twice (happens when user refreshes the page)
                attendee_2,
            ],
        )

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            collect_attendees()

        session.refresh_from_db()
        self.assertListEqual(session.current_attendees, [attendee_1, attendee_2])
        self.assertDictEqual(
            json.loads(session.attendees),
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

    @responses.activate
    def test_collect_attendees_leaved(self):
        """Test collect_attendees when a user leaves."""
        entered_at = datetime(2021, 10, 29, 13, 32, 27, tzinfo=timezone.utc)
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory(
            fullName="Leaver",
        )
        session = ClassroomSessionFactory(
            current_attendees=[attendee_1, attendee_2],
            attendees=json.dumps(
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
                                "left_at": None,
                            }
                        ],
                    },
                }
            ),
        )

        mock_get_meeting_info(attendees=[attendee_1])

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            collect_attendees()

        session.refresh_from_db()
        self.assertListEqual(session.current_attendees, [attendee_1])
        self.assertDictEqual(
            json.loads(session.attendees),
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
                            "left_at": to_timestamp(now),
                        }
                    ],
                },
            },
        )

    @responses.activate
    def test_collect_attendees_session_beginning(self):
        """Test collect_attendees when no user is in the session."""
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        session = ClassroomSessionFactory()

        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()

        mock_get_meeting_info(
            attendees=[
                attendee_1,
                attendee_2,
                # same user joined twice (happens when user refreshes the page)
                attendee_2,
            ],
        )

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            collect_attendees()

        session.refresh_from_db()
        self.assertListEqual(session.current_attendees, [attendee_1, attendee_2])
        self.assertDictEqual(
            json.loads(session.attendees),
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

    @responses.activate
    def test_collect_attendees_session_ending(self):
        """Test collect_attendees when all users left the session."""
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        entered_at = datetime(2021, 10, 29, 13, 32, 27, tzinfo=timezone.utc)
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        session = ClassroomSessionFactory(
            current_attendees=[attendee_1, attendee_2],
            attendees=json.dumps(
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
                                "left_at": None,
                            }
                        ],
                    },
                }
            ),
        )

        mock_get_meeting_info()

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            collect_attendees()

        session.refresh_from_db()
        self.assertListEqual(session.current_attendees, [])
        self.assertDictEqual(
            json.loads(session.attendees),
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

    @responses.activate
    def test_collect_attendees_session_no_diff(self):
        """Test collect_attendees when there is no diff."""
        now = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        entered_at = datetime(2021, 10, 29, 13, 32, 27, tzinfo=timezone.utc)
        attendee_1 = AttendeeFactory()
        attendee_2 = AttendeeFactory()
        session = ClassroomSessionFactory(
            current_attendees=[attendee_1, attendee_2],
            attendees=json.dumps(
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
                                "left_at": None,
                            }
                        ],
                    },
                }
            ),
        )

        mock_get_meeting_info(
            attendees=[
                attendee_1,
                attendee_2,
                # same user joined twice (happens when user refreshes the page)
                attendee_2,
            ],
        )

        with mock.patch(
            "marsha.bbb.utils.bbb_utils.now",
            return_value=now,
        ):
            collect_attendees()

        session.refresh_from_db()
        self.assertListEqual(session.current_attendees, [attendee_1, attendee_2])
        self.assertDictEqual(
            json.loads(session.attendees),
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
                            "left_at": None,
                        }
                    ],
                },
            },
        )
