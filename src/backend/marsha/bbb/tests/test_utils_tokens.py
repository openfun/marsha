"""Tests for the specific classroom related simple JWT helpers."""
from datetime import datetime, timedelta, timezone as baseTimezone
import json
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.utils.tokens import create_classroom_stable_invite_jwt
from marsha.core.models import INSTRUCTOR
from marsha.core.tests.testing_utils import reload_urlconf


class CreateStableInviteJwtTestCase(TestCase):
    """Test the create_classroom_stable_invite_jwt function."""

    maxDiff = None

    @override_settings(BBB_INVITE_JWT_DEFAULT_DAYS_DURATION=30)
    def test_jwt_content_starting_at_and_duration(self):
        """Assert the payload contains the expected data."""
        now_fixed = datetime(2020, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now_fixed):
            classroom = ClassroomFactory(
                pk="ad0395fd-3023-45da-8801-93d1ce64acd5",
                created_on=timezone.now(),
                starting_at=datetime(2020, 8, 20, 14, tzinfo=baseTimezone.utc),
                estimated_duration=timedelta(hours=2),
            )
            jwt = create_classroom_stable_invite_jwt(classroom)

        self.assertDictEqual(
            jwt.payload,
            {
                "exp": 1599436800,  # Saturday 22 August 2020 14:00:00 UTC
                "iat": 1596844800,  # Saturday 8 August 2020 00:00:00 UTC
                "jti": "classroom-invite-ad0395fd-3023-45da-8801-93d1ce64acd5-2020-08-08",
                "locale": "en_US",
                "maintenance": False,
                "permissions": {"can_access_dashboard": False, "can_update": False},
                "playlist_id": str(classroom.playlist_id),
                "roles": ["none"],
                "session_id": "ad0395fd-3023-45da-8801-93d1ce64acd5-invite",
                "token_type": "playlist_access",
            },
        )

    @override_settings(BBB_INVITE_JWT_DEFAULT_DAYS_DURATION=30)
    def test_jwt_content_starting_at_in_past(self):
        """Assert the payload contains the expected data."""
        now_fixed = datetime(2020, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now_fixed):
            classroom = ClassroomFactory(
                pk="ad0395fd-3023-45da-8801-93d1ce64acd5",
                created_on=datetime(2020, 8, 4, 11, tzinfo=baseTimezone.utc),
                starting_at=datetime(2020, 8, 4, 14, tzinfo=baseTimezone.utc),
                estimated_duration=timedelta(hours=2),
            )
            jwt = create_classroom_stable_invite_jwt(classroom)

        self.assertDictEqual(
            jwt.payload,
            {
                "exp": 1599436800,  # Thursday 6 August 2020 14:00:00 UTC
                "iat": 1596538800,  # Tuesday 4 August 2020 11:00:00 UTC
                "jti": "classroom-invite-ad0395fd-3023-45da-8801-93d1ce64acd5-2020-08-04",
                "locale": "en_US",
                "maintenance": False,
                "permissions": {"can_access_dashboard": False, "can_update": False},
                "playlist_id": str(classroom.playlist_id),
                "roles": ["none"],
                "session_id": "ad0395fd-3023-45da-8801-93d1ce64acd5-invite",
                "token_type": "playlist_access",
            },
        )

    @override_settings(BBB_INVITE_JWT_DEFAULT_DAYS_DURATION=30)
    def test_jwt_content_starting_at_and_no_duration(self):
        """Assert the payload contains the expected data."""
        now_fixed = datetime(2020, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now_fixed):
            classroom = ClassroomFactory(
                pk="ad0395fd-3023-45da-8801-93d1ce64acd5",
                created_on=timezone.now(),
                starting_at=datetime(2020, 8, 20, 14, tzinfo=baseTimezone.utc),
            )
            jwt = create_classroom_stable_invite_jwt(classroom)

        self.assertDictEqual(
            jwt.payload,
            {
                "exp": 1599436800,  # Saturday 22 August 2020 14:00:00 UTC
                "iat": 1596844800,  # Saturday 8 August 2020 00:00:00 UTC
                "jti": "classroom-invite-ad0395fd-3023-45da-8801-93d1ce64acd5-2020-08-08",
                "locale": "en_US",
                "maintenance": False,
                "permissions": {"can_access_dashboard": False, "can_update": False},
                "playlist_id": str(classroom.playlist_id),
                "roles": ["none"],
                "session_id": "ad0395fd-3023-45da-8801-93d1ce64acd5-invite",
                "token_type": "playlist_access",
            },
        )

    def test_jwt_content_without_starting_at_and_no_duration(self):
        """
        Assert the payload contains the expected data,
        when classroom has no starting time and no duration.

        JWT will be valid for at least 24 hours.
        """
        now_fixed = datetime(2020, 8, 8, 14, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now_fixed):
            classroom = ClassroomFactory(
                pk="ad0395fd-3023-45da-8801-93d1ce64acd5",
                created_on=timezone.now(),
            )
            jwt = create_classroom_stable_invite_jwt(classroom)

        self.assertDictEqual(
            jwt.payload,
            {
                "exp": 1599436800,  # Monday 7 September 2020 00:00:00 UTC
                "iat": 1596895200,  # Saturday 8 August 2020 14:00:00 UTC
                "jti": "classroom-invite-ad0395fd-3023-45da-8801-93d1ce64acd5-2020-08-08",
                "locale": "en_US",
                "maintenance": False,
                "permissions": {"can_access_dashboard": False, "can_update": False},
                "playlist_id": str(classroom.playlist_id),
                "roles": ["none"],
                "session_id": "ad0395fd-3023-45da-8801-93d1ce64acd5-invite",
                "token_type": "playlist_access",
            },
        )

    def test_jwt_content_without_starting_at_and_duration(self):
        """Assert the payload contains the expected data."""
        now_fixed = datetime(2020, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now_fixed):
            classroom = ClassroomFactory(
                pk="ad0395fd-3023-45da-8801-93d1ce64acd5",
                created_on=timezone.now(),
                estimated_duration=timedelta(hours=2),
            )
            jwt = create_classroom_stable_invite_jwt(classroom)

        self.assertDictEqual(
            jwt.payload,
            {
                "exp": 1599436800,  # Monday 7 September 2020 00:00:00 UTC
                "iat": 1596844800,  # Saturday 8 August 2020 00:00:00 UTC
                "jti": "classroom-invite-ad0395fd-3023-45da-8801-93d1ce64acd5-2020-08-08",
                "locale": "en_US",
                "maintenance": False,
                "permissions": {"can_access_dashboard": False, "can_update": False},
                "playlist_id": str(classroom.playlist_id),
                "roles": ["none"],
                "session_id": "ad0395fd-3023-45da-8801-93d1ce64acd5-invite",
                "token_type": "playlist_access",
            },
        )

    @override_settings(BBB_INVITE_JWT_INSTRUCTOR_DAYS_DURATION=60)
    def test_jwt_content_without_starting_at_and_no_duration_instructor(self):
        """
        Assert the payload contains the expected data,
        when classroom has no starting time and no duration.

        JWT will be valid for at least 24 hours.
        """
        now_fixed = datetime(2020, 8, 8, 14, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now_fixed):
            classroom = ClassroomFactory(
                pk="ad0395fd-3023-45da-8801-93d1ce64acd5",
                created_on=timezone.now(),
            )
            jwt = create_classroom_stable_invite_jwt(classroom, role=INSTRUCTOR)

        self.assertDictEqual(
            jwt.payload,
            {
                "exp": 1602028800,  # Wednesday 7 October 2020 00:00:00 UTC
                "iat": 1596895200,  # Saturday 8 August 2020 14:00:00 UTC
                "jti": "classroom-invite-ad0395fd-3023-45da-8801-93d1ce64acd5-2020-08-08",
                "locale": "en_US",
                "maintenance": False,
                "permissions": {"can_access_dashboard": False, "can_update": False},
                "playlist_id": str(classroom.playlist_id),
                "roles": ["instructor"],
                "session_id": "ad0395fd-3023-45da-8801-93d1ce64acd5-invite",
                "token_type": "playlist_access",
            },
        )

    @override_settings(BBB_INVITE_JWT_INSTRUCTOR_DAYS_DURATION=60)
    def test_jwt_content_without_starting_at_and_duration_instructor(self):
        """Assert the payload contains the expected data."""
        now_fixed = datetime(2020, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now_fixed):
            classroom = ClassroomFactory(
                pk="ad0395fd-3023-45da-8801-93d1ce64acd5",
                created_on=timezone.now(),
                estimated_duration=timedelta(hours=2),
            )
            jwt = create_classroom_stable_invite_jwt(classroom, role=INSTRUCTOR)

        self.assertDictEqual(
            jwt.payload,
            {
                "exp": 1602028800,  # Wednesday 7 October 2020 00:00:00 UTC
                "iat": 1596844800,  # Saturday 8 August 2020 00:00:00 UTC
                "jti": "classroom-invite-ad0395fd-3023-45da-8801-93d1ce64acd5-2020-08-08",
                "locale": "en_US",
                "maintenance": False,
                "permissions": {"can_access_dashboard": False, "can_update": False},
                "playlist_id": str(classroom.playlist_id),
                "roles": ["instructor"],
                "session_id": "ad0395fd-3023-45da-8801-93d1ce64acd5-invite",
                "token_type": "playlist_access",
            },
        )

    def test_jwt_content_when_called_twice(self):
        """Assert the payload contains the same data for several calls for same classroom."""
        classroom = ClassroomFactory()
        jwt = create_classroom_stable_invite_jwt(classroom)
        jwt2 = create_classroom_stable_invite_jwt(classroom)

        self.assertDictEqual(jwt.payload, jwt2.payload)
        self.assertEqual(str(jwt), str(jwt2))

    @override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
    @override_settings(BBB_API_SECRET="SuperSecret")
    @override_settings(BBB_ENABLED=True)
    def test_classroom_stable_invite_jwt_allows_access_to_classroom(self):
        """Assert the JWT allows to join to the classroom."""
        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

        classroom = ClassroomFactory()
        jwt = create_classroom_stable_invite_jwt(classroom)

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/join/",
            data=json.dumps({"fullname": "John Doe"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "https://10.7.7.1/bigbluebutton/api/join?"
            f"fullName=John+Doe&meetingID={classroom.meeting_id}&"
            "role=viewer&userID=None_None&redirect=true",
            response.data.get("url"),
        )

    @override_settings(BBB_INVITE_JWT_INSTRUCTOR_DAYS_DURATION=60)
    def test_jwt_content_instructor(self):
        """Assert the payload contains the expected role."""
        now_fixed = datetime(2020, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now_fixed):
            classroom = ClassroomFactory(
                pk="ad0395fd-3023-45da-8801-93d1ce64acd5",
                created_on=timezone.now(),
                starting_at=datetime(2020, 8, 20, 14, tzinfo=baseTimezone.utc),
                estimated_duration=timedelta(hours=2),
            )
            jwt = create_classroom_stable_invite_jwt(classroom, role=INSTRUCTOR)

        self.assertDictEqual(
            jwt.payload,
            {
                "exp": 1602028800,  # Saturday 22 August 2020 14:00:00 UTC
                "iat": 1596844800,  # Saturday 8 August 2020 00:00:00 UTC
                "jti": "classroom-invite-ad0395fd-3023-45da-8801-93d1ce64acd5-2020-08-08",
                "locale": "en_US",
                "maintenance": False,
                "permissions": {"can_access_dashboard": False, "can_update": False},
                "playlist_id": str(classroom.playlist_id),
                "roles": ["instructor"],
                "session_id": "ad0395fd-3023-45da-8801-93d1ce64acd5-invite",
                "token_type": "playlist_access",
            },
        )

    @override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
    @override_settings(BBB_API_SECRET="SuperSecret")
    @override_settings(BBB_ENABLED=True)
    def test_classroom_stable_invite_jwt_allows_instructor_access_to_classroom(self):
        """Assert the JWT allows to join to the classroom as instructor."""
        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

        classroom = ClassroomFactory()
        jwt = create_classroom_stable_invite_jwt(classroom, role=INSTRUCTOR)

        response = self.client.patch(
            f"/api/classrooms/{classroom.id}/join/",
            data=json.dumps({"fullname": "John Doe"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "https://10.7.7.1/bigbluebutton/api/join?"
            f"fullName=John+Doe&meetingID={classroom.meeting_id}&"
            "role=moderator&userID=None_None&redirect=true",
            response.data.get("url"),
        )
