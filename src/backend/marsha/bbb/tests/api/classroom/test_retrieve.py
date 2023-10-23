"""Tests for the classroom retrieve API."""
from datetime import datetime, timedelta
import json
from unittest import mock
import zoneinfo

from django.core.cache import cache
from django.test import TestCase, override_settings

import responses

from marsha.bbb import serializers
from marsha.bbb.factories import ClassroomFactory, ClassroomRecordingFactory
from marsha.bbb.utils.tokens import create_classroom_stable_invite_jwt
from marsha.core.defaults import CLASSROOM_RECORDINGS_KEY_CACHE
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines,duplicate-code


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
@override_settings(
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        },
        "memory_cache": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
    }
)
class ClassroomRetrieveAPITest(TestCase):
    """Test for the Classroom retrieve API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

        cache.clear()

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_student(self, mock_get_meeting_infos):
        """A student should be allowed to fetch a classroom."""
        classroom = ClassroomFactory()
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = StudentLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "public_token": None,
                "instructor_token": None,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
            },
            content,
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_student_with_recordings(self, mock_get_meeting_infos):
        """Existing recordings should not be retrieved by students."""
        classroom = ClassroomFactory()
        ClassroomRecordingFactory(
            classroom=classroom,
            started_at="2019-08-21T15:00:02Z",
        )
        ClassroomRecordingFactory(
            classroom=classroom,
            started_at="2019-08-21T11:00:02Z",
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = StudentLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "retention_date": None,
                "public_token": None,
                "instructor_token": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
            },
            content,
        )

    def test_api_classroom_fetch_from_other_classroom(self):
        """
        Fetching a classroom with a token resource for another classroom should not be allowed.
        """
        classroom = ClassroomFactory()
        other_classroom = ClassroomFactory()

        jwt_token = StudentLtiTokenFactory(playlist=other_classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_student_scheduled(self, mock_get_meeting_infos):
        """A student should be allowed to fetch a scheduled classroom."""
        now = datetime(2018, 8, 8, tzinfo=zoneinfo.ZoneInfo("Europe/Paris"))

        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (now + timedelta(hours=3)).replace(microsecond=0)
        estimated_duration = timedelta(seconds=60)

        classroom = ClassroomFactory(
            starting_at=starting_at, estimated_duration=estimated_duration
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = StudentLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": "2018-08-08T01:00:00Z",
                "estimated_duration": "00:01:00",
                "public_token": None,
                "instructor_token": None,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
            },
            content,
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_instructor(self, mock_get_meeting_infos):
        """An instructor should be able to fetch a classroom."""
        classroom = ClassroomFactory()
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
            },
            content,
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_user_access_token(self, mock_get_meeting_infos):
        """A user with UserAccessToken should not be able to fetch a classroom."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_user_access_token_organization_admin(
        self, mock_get_meeting_infos
    ):
        """An organization administrator should be able to fetch a classroom."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
            },
            content,
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_user_access_token_playlist_admin(
        self, mock_get_meeting_infos
    ):
        """A playlist administrator should be able to fetch a classroom."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
            },
            content,
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_user_access_token_playlist_instructor(
        self, mock_get_meeting_infos
    ):
        """A playlist instructor should be able to fetch a classroom."""
        playlist_access = PlaylistAccessFactory(role=INSTRUCTOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
            },
            content,
        )

    @responses.activate
    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_with_recordings(self, mock_get_meeting_infos):
        """Existing recordings should be retrieved."""
        classroom = ClassroomFactory()
        classroom_recording_1 = ClassroomRecordingFactory(
            record_id="67df5782-c17b-46d8-9dcb-a404e0b31251",
            classroom=classroom,
            started_at="2019-08-21T15:00:02Z",
        )
        classroom_recording_2 = ClassroomRecordingFactory(
            record_id="35c165e6-75fd-4bb4-8352-a74057689e40",
            classroom=classroom,
            started_at="2019-08-21T11:00:02Z",
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "recordID": "67df5782-c17b-46d8-9dcb-a404e0b31251",
                        "checksum": "5b9680a8fcca9e43f41f494b0503a41c14a86be9",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <recordings>
                    <recording>
                        <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
                        <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</internalMeetingID>
                        <name>test ncl</name>
                        <published>true</published>
                        <state>published</state>
                        <startTime>1673282694493</startTime>
                        <endTime>1673282727208</endTime>
                        <participants>1</participants>
                        <metadata>
                            <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                            </analytics-callback-url>
                        </metadata>
                        <playback>
                            <format>
                                <type>presentation</type>
                                <url>
                                    https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4
                                </url>
                                <length>0</length>
                            </format>
                        </playback>
                    </recording>
                </recordings>
            </response>
            """,
            status=200,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "recordID": "35c165e6-75fd-4bb4-8352-a74057689e40",
                        "checksum": "3ccf4770fcc739a037f6a8156b99467c6d8c95c5",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <recordings>
                    <recording>
                        <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
                        <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</internalMeetingID>
                        <name>test ncl</name>
                        <published>true</published>
                        <state>published</state>
                        <startTime>1673282694493</startTime>
                        <endTime>1673282727208</endTime>
                        <participants>1</participants>
                        <metadata>
                            <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                            </analytics-callback-url>
                        </metadata>
                        <playback>
                            <format>
                                <type>presentation</type>
                                <url>
                                    https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4
                                </url>
                                <length>0</length>
                            </format>
                        </playback>
                    </recording>
                </recordings>
            </response>
            """,
            status=200,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [
                    {
                        "classroom_id": str(classroom.id),
                        "id": str(classroom_recording_2.id),
                        "record_id": str(classroom_recording_2.record_id),
                        "video_file_url": (
                            "https://10.7.7.1/presentation/"
                            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
                        ),
                        "started_at": "2019-08-21T11:00:02Z",
                        "vod": None,
                    },
                    {
                        "classroom_id": str(classroom.id),
                        "id": str(classroom_recording_1.id),
                        "record_id": str(classroom_recording_1.record_id),
                        "video_file_url": (
                            "https://10.7.7.1/presentation/"
                            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
                        ),
                        "started_at": "2019-08-21T15:00:02Z",
                        "vod": None,
                    },
                ],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
            },
            content,
        )

    @responses.activate
    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_with_recordings_existing_lti_user_id(
        self, mock_get_meeting_infos
    ):
        """Existing recordings should be retrieved and set in cache when the LTI user id exists."""
        classroom = ClassroomFactory()
        classroom_recording_1 = ClassroomRecordingFactory(
            record_id="67df5782-c17b-46d8-9dcb-a404e0b31251",
            classroom=classroom,
            started_at="2019-08-21T15:00:02Z",
        )
        classroom_recording_2 = ClassroomRecordingFactory(
            record_id="35c165e6-75fd-4bb4-8352-a74057689e40",
            classroom=classroom,
            started_at="2019-08-21T11:00:02Z",
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=classroom.playlist,
            user={"id": "8809baa8-8578-4b1b-bc01-60d313a205f7"},
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "recordID": "67df5782-c17b-46d8-9dcb-a404e0b31251",
                        "checksum": "5b9680a8fcca9e43f41f494b0503a41c14a86be9",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <recordings>
                    <recording>
                        <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
                        <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</internalMeetingID>
                        <name>test ncl</name>
                        <published>true</published>
                        <state>published</state>
                        <startTime>1673282694493</startTime>
                        <endTime>1673282727208</endTime>
                        <participants>1</participants>
                        <metadata>
                            <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                            </analytics-callback-url>
                        </metadata>
                        <playback>
                            <format>
                                <type>presentation</type>
                                <url>
                                    https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4
                                </url>
                                <length>0</length>
                            </format>
                        </playback>
                    </recording>
                </recordings>
            </response>
            """,
            status=200,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "recordID": "35c165e6-75fd-4bb4-8352-a74057689e40",
                        "checksum": "3ccf4770fcc739a037f6a8156b99467c6d8c95c5",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <recordings>
                    <recording>
                        <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
                        <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</internalMeetingID>
                        <name>test ncl</name>
                        <published>true</published>
                        <state>published</state>
                        <startTime>1673282694493</startTime>
                        <endTime>1673282727208</endTime>
                        <participants>1</participants>
                        <metadata>
                            <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                            </analytics-callback-url>
                        </metadata>
                        <playback>
                            <format>
                                <type>presentation</type>
                                <url>
                                    https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4
                                </url>
                                <length>0</length>
                            </format>
                        </playback>
                    </recording>
                </recordings>
            </response>
            """,
            status=200,
        )

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [
                    {
                        "classroom_id": str(classroom.id),
                        "id": str(classroom_recording_2.id),
                        "record_id": str(classroom_recording_2.record_id),
                        "video_file_url": (
                            "https://10.7.7.1/presentation/"
                            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
                        ),
                        "started_at": "2019-08-21T11:00:02Z",
                        "vod": None,
                    },
                    {
                        "classroom_id": str(classroom.id),
                        "id": str(classroom_recording_1.id),
                        "record_id": str(classroom_recording_1.record_id),
                        "video_file_url": (
                            "https://10.7.7.1/presentation/"
                            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
                        ),
                        "started_at": "2019-08-21T15:00:02Z",
                        "vod": None,
                    },
                ],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
            },
            content,
        )

        self.assertEqual(
            cache.get(
                (
                    f"{CLASSROOM_RECORDINGS_KEY_CACHE}{classroom_recording_1.record_id}:"
                    "8809baa8-8578-4b1b-bc01-60d313a205f7"
                )
            ),
            (
                "https://10.7.7.1/presentation/"
                "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
            ),
        )

    @responses.activate
    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_with_recordings_playlist_instructor(
        self, mock_get_meeting_infos
    ):
        """Existing recordings should be retrieved and set in cache when the LTI user id exists."""
        playlist_access = PlaylistAccessFactory(role=INSTRUCTOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)

        classroom_recording_1 = ClassroomRecordingFactory(
            record_id="67df5782-c17b-46d8-9dcb-a404e0b31251",
            classroom=classroom,
            started_at="2019-08-21T15:00:02Z",
        )
        classroom_recording_2 = ClassroomRecordingFactory(
            record_id="35c165e6-75fd-4bb4-8352-a74057689e40",
            classroom=classroom,
            started_at="2019-08-21T11:00:02Z",
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "recordID": "67df5782-c17b-46d8-9dcb-a404e0b31251",
                        "checksum": "5b9680a8fcca9e43f41f494b0503a41c14a86be9",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <recordings>
                    <recording>
                        <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
                        <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</internalMeetingID>
                        <name>test ncl</name>
                        <published>true</published>
                        <state>published</state>
                        <startTime>1673282694493</startTime>
                        <endTime>1673282727208</endTime>
                        <participants>1</participants>
                        <metadata>
                            <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                            </analytics-callback-url>
                        </metadata>
                        <playback>
                            <format>
                                <type>presentation</type>
                                <url>
                                    https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4
                                </url>
                                <length>0</length>
                            </format>
                        </playback>
                    </recording>
                </recordings>
            </response>
            """,
            status=200,
        )

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getRecordings",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "recordID": "35c165e6-75fd-4bb4-8352-a74057689e40",
                        "checksum": "3ccf4770fcc739a037f6a8156b99467c6d8c95c5",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <recordings>
                    <recording>
                        <recordID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</recordID>
                        <meetingID>7e1c8b28-cd7a-4abe-93b2-3121366cb049</meetingID>
                        <internalMeetingID>c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493</internalMeetingID>
                        <name>test ncl</name>
                        <published>true</published>
                        <state>published</state>
                        <startTime>1673282694493</startTime>
                        <endTime>1673282727208</endTime>
                        <participants>1</participants>
                        <metadata>
                            <analytics-callback-url>https://10.7.7.2/bbb-analytics/api/v1/post_events?tag=bbb-dev
                            </analytics-callback-url>
                        </metadata>
                        <playback>
                            <format>
                                <type>presentation</type>
                                <url>
                                    https://10.7.7.1/playback/presentation/2.3/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493
                                </url>
                                <length>0</length>
                            </format>
                            <format>
                                <type>video</type>
                                <url>
                                    https://10.7.7.1/presentation/c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4
                                </url>
                                <length>0</length>
                            </format>
                        </playback>
                    </recording>
                </recordings>
            </response>
            """,
            status=200,
        )

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [
                    {
                        "classroom_id": str(classroom.id),
                        "id": str(classroom_recording_2.id),
                        "record_id": str(classroom_recording_2.record_id),
                        "video_file_url": (
                            "https://10.7.7.1/presentation/"
                            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
                        ),
                        "started_at": "2019-08-21T11:00:02Z",
                        "vod": None,
                    },
                    {
                        "classroom_id": str(classroom.id),
                        "id": str(classroom_recording_1.id),
                        "record_id": str(classroom_recording_1.record_id),
                        "video_file_url": (
                            "https://10.7.7.1/presentation/"
                            "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
                        ),
                        "started_at": "2019-08-21T15:00:02Z",
                        "vod": None,
                    },
                ],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
            },
            content,
        )

        self.assertEqual(
            cache.get(
                (
                    f"{CLASSROOM_RECORDINGS_KEY_CACHE}{classroom_recording_1.record_id}:"
                    f"{playlist_access.user.id}"
                )
            ),
            (
                "https://10.7.7.1/presentation/"
                "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
            ),
        )
        self.assertEqual(
            cache.get(
                (
                    f"{CLASSROOM_RECORDINGS_KEY_CACHE}{classroom_recording_2.record_id}:"
                    f"{playlist_access.user.id}"
                )
            ),
            (
                "https://10.7.7.1/presentation/"
                "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
            ),
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_from_LTI_inactive_conversion(
        self, mock_get_meeting_infos
    ):
        """When consumer site has inactive VOD conversion, it should appear from LTI."""
        classroom = ClassroomFactory(
            playlist__consumer_site__inactive_features=["vod_convert"],
        )
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertFalse(response.json()["vod_conversion_enabled"])

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_from_standalone_site_inactive_conversion(
        self, mock_get_meeting_infos
    ):
        """When organization has inactive VOD conversion, it should appear from standalone site."""
        organization_access = OrganizationAccessFactory(
            role=ADMINISTRATOR,
            organization__inactive_features=["vod_convert"],
        )
        playlist = PlaylistFactory(
            organization=organization_access.organization,
            consumer_site=None,
            lti_id=None,
        )
        classroom = ClassroomFactory(playlist=playlist)
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertFalse(response.json()["vod_conversion_enabled"])

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_public_invite(self, mock_get_meeting_infos):
        """A public invited user should be allowed to fetch a classroom."""
        classroom = ClassroomFactory()
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = create_classroom_stable_invite_jwt(classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "public_token": None,
                "instructor_token": None,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
            },
            content,
        )

    @mock.patch.object(serializers, "get_meeting_infos")
    def test_api_classroom_fetch_moderator_invite(self, mock_get_meeting_infos):
        """A moderator invited user should be allowed to fetch a classroom."""
        classroom = ClassroomFactory()
        mock_get_meeting_infos.return_value = {
            "returncode": "SUCCESS",
            "running": "true",
        }

        jwt_token = create_classroom_stable_invite_jwt(
            classroom,
            role=INSTRUCTOR,
            permissions={
                "can_update": True,
                "can_access_dashboard": True,
            },
        )

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        content = json.loads(response.content)
        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "title": classroom.title,
                "description": classroom.description,
                "started": False,
                "ended": False,
                "meeting_id": str(classroom.meeting_id),
                "welcome_text": classroom.welcome_text,
                "playlist": {
                    "id": str(classroom.playlist.id),
                    "title": classroom.playlist.title,
                    "lti_id": classroom.playlist.lti_id,
                },
                "starting_at": None,
                "estimated_duration": None,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
            },
            content,
        )
