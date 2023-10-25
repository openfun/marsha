"""Tests for the classroom retrieve API."""
from datetime import datetime, timedelta
import json
import zoneinfo

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone

import responses

from marsha.bbb.factories import (
    ClassroomFactory,
    ClassroomRecordingFactory,
    ClassroomSessionFactory,
)
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

    def test_api_classroom_fetch_student(self):
        """A student should be allowed to fetch a classroom."""
        classroom = ClassroomFactory()

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
                "infos": None,
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
                "sessions": [],
            },
            content,
        )

    def test_api_classroom_fetch_student_with_recordings(self):
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
                "infos": None,
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
                "sessions": [],
            },
            content,
        )

    def test_api_classroom_fetch_student_with_sessions(self):
        """Existing sessions should not be retrieved by students."""
        classroom = ClassroomFactory()
        ClassroomSessionFactory(
            classroom=classroom,
            cookie=json.dumps({"SESSION_ID": "123"}),
            bbb_learning_analytics_url="https://bbb.learning-analytics.info",
        )

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
                "infos": None,
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
                "sessions": [],
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

    def test_api_classroom_fetch_student_scheduled(self):
        """A student should be allowed to fetch a scheduled classroom."""
        now = datetime(2018, 8, 8, tzinfo=zoneinfo.ZoneInfo("Europe/Paris"))

        # set microseconds to 0 to compare date surely as serializer truncate them
        starting_at = (now + timedelta(hours=3)).replace(microsecond=0)
        estimated_duration = timedelta(seconds=60)

        classroom = ClassroomFactory(
            starting_at=starting_at, estimated_duration=estimated_duration
        )

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
                "infos": None,
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
                "sessions": [],
            },
            content,
        )

    def test_api_classroom_fetch_instructor(self):
        """An instructor should be able to fetch a classroom."""
        classroom = ClassroomFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": None,
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
                "sessions": [],
            },
            response.json(),
        )

    def test_api_classroom_fetch_user_access_token(self):
        """A user with UserAccessToken should not be able to fetch a classroom."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_classroom_fetch_user_access_token_organization_admin(self):
        """An organization administrator should be able to fetch a classroom."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)

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
                "infos": None,
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
                "sessions": [],
            },
            content,
        )

    def test_api_classroom_fetch_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to fetch a classroom."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)

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
                "infos": None,
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
                "sessions": [],
            },
            content,
        )

    def test_api_classroom_fetch_user_access_token_playlist_instructor(self):
        """A playlist instructor should be able to fetch a classroom."""
        playlist_access = PlaylistAccessFactory(role=INSTRUCTOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)

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
                "infos": None,
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
                "sessions": [],
            },
            content,
        )

    @responses.activate
    def test_api_classroom_fetch_with_recordings(self):
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
                "infos": None,
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
                "sessions": [],
            },
            content,
        )

    @responses.activate
    def test_api_classroom_fetch_with_recordings_existing_lti_user_id(self):
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
                "infos": None,
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
                "sessions": [],
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
    def test_api_classroom_fetch_with_recordings_playlist_instructor(self):
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
                "infos": None,
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
                "sessions": [],
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

    def test_api_classroom_fetch_with_sessions(self):
        """An instructor should be able to fetch classroom sessions."""
        entered_at_1 = datetime(2021, 10, 29, 13, 32, 27, tzinfo=timezone.utc)
        leaved_at_1 = datetime(2021, 10, 29, 13, 42, 27, tzinfo=timezone.utc)
        entered_at_2 = datetime(2021, 10, 29, 13, 52, 27, tzinfo=timezone.utc)
        classroom = ClassroomFactory()
        ClassroomSessionFactory(
            classroom=classroom,
            started_at=entered_at_1,
            ended_at=leaved_at_1,
            learning_analytics=json.dumps(
                {
                    "intId": "0cbb2ac668bb4ac05bf7db4a440aee6de8cd0066-1697111611289",
                    "extId": "86c5bb46-ace5-4362-9a0d-6dbdde9e745f",
                    "name": "Classroom webhook",
                    "users": {
                        "8ade4720": {
                            "userKey": "8ade4720",
                            "extId": "5bc189df9500bfbc70418b399ad5745b",
                            "intIds": {
                                "w_xzkbsh7stiq8": {
                                    "intId": "w_xzkbsh7stiq8",
                                    "registeredOn": 1697111634434,
                                    "leftOn": 0,
                                    "userLeftFlag": False,
                                }
                            },
                            "name": "Instructor",
                            "isModerator": True,
                            "isDialIn": False,
                            "currentIntId": "w_xzkbsh7stiq8",
                            "answers": {},
                            "talk": {"totalTime": 0, "lastTalkStartedOn": 0},
                            "emojis": [],
                            "webcams": [],
                            "totalOfMessages": 0,
                        },
                        "6af84fe6": {
                            "userKey": "6af84fe6",
                            "extId": "dd02eb66ff1f7088facb52c102473230",
                            "intIds": {
                                "w_ecvwvvvhwhum": {
                                    "intId": "w_ecvwvvvhwhum",
                                    "registeredOn": 1697111639229,
                                    "leftOn": 1697111696308,
                                    "userLeftFlag": True,
                                },
                                "w_j5dism2ei19x": {
                                    "intId": "w_j5dism2ei19x",
                                    "registeredOn": 1697111692850,
                                    "leftOn": 0,
                                    "userLeftFlag": False,
                                },
                            },
                            "name": "Student 2",
                            "isModerator": False,
                            "isDialIn": False,
                            "currentIntId": "w_j5dism2ei19x",
                            "answers": {},
                            "talk": {"totalTime": 0, "lastTalkStartedOn": 0},
                            "emojis": [],
                            "webcams": [],
                            "totalOfMessages": 0,
                        },
                        "869e1c1e": {
                            "userKey": "869e1c1e",
                            "extId": "a39b0fa4be7c54821d0409d1ccb44099",
                            "intIds": {
                                "w_bgguwo64n4ib": {
                                    "intId": "w_bgguwo64n4ib",
                                    "registeredOn": 1697111642068,
                                    "leftOn": 0,
                                    "userLeftFlag": False,
                                }
                            },
                            "name": "Student 1",
                            "isModerator": False,
                            "isDialIn": False,
                            "currentIntId": "w_bgguwo64n4ib",
                            "answers": {},
                            "talk": {"totalTime": 0, "lastTalkStartedOn": 0},
                            "emojis": [],
                            "webcams": [],
                            "totalOfMessages": 0,
                        },
                    },
                    "polls": {},
                    "screenshares": [],
                    "presentationSlides": [
                        {
                            "presentationId": "31f33b5e",
                            "pageNum": 1,
                            "setOn": 1697111617283,
                            "presentationName": "default.pdf",
                        }
                    ],
                    "createdOn": 1697111611293,
                    "endedOn": 0,
                }
            ),
        )
        ClassroomSessionFactory(
            classroom=classroom,
            started_at=entered_at_2,
            ended_at=None,
            learning_analytics=json.dumps(
                {
                    "intId": "0cbb2ac668bb4ac05bf7db4a440aee6de8cd0066-1697111611289",
                    "extId": "86c5bb46-ace5-4362-9a0d-6dbdde9e745f",
                    "name": "Classroom webhook",
                    "users": {
                        "8ade4720": {
                            "userKey": "8ade4720",
                            "extId": "5bc189df9500bfbc70418b399ad5745b",
                            "intIds": {
                                "w_xzkbsh7stiq8": {
                                    "intId": "w_xzkbsh7stiq8",
                                    "registeredOn": 1697111634434,
                                    "leftOn": 0,
                                    "userLeftFlag": False,
                                }
                            },
                            "name": "Instructor",
                            "isModerator": True,
                            "isDialIn": False,
                            "currentIntId": "w_xzkbsh7stiq8",
                            "answers": {},
                            "talk": {"totalTime": 0, "lastTalkStartedOn": 0},
                            "emojis": [],
                            "webcams": [],
                            "totalOfMessages": 0,
                        },
                        "6af84fe6": {
                            "userKey": "6af84fe6",
                            "extId": "dd02eb66ff1f7088facb52c102473230",
                            "intIds": {
                                "w_ecvwvvvhwhum": {
                                    "intId": "w_ecvwvvvhwhum",
                                    "registeredOn": 1697111639229,
                                    "leftOn": 1697111696308,
                                    "userLeftFlag": True,
                                },
                                "w_j5dism2ei19x": {
                                    "intId": "w_j5dism2ei19x",
                                    "registeredOn": 1697111692850,
                                    "leftOn": 0,
                                    "userLeftFlag": False,
                                },
                            },
                            "name": "Student 2",
                            "isModerator": False,
                            "isDialIn": False,
                            "currentIntId": "w_j5dism2ei19x",
                            "answers": {},
                            "talk": {"totalTime": 0, "lastTalkStartedOn": 0},
                            "emojis": [],
                            "webcams": [],
                            "totalOfMessages": 0,
                        },
                        "869e1c1e": {
                            "userKey": "869e1c1e",
                            "extId": "a39b0fa4be7c54821d0409d1ccb44099",
                            "intIds": {
                                "w_bgguwo64n4ib": {
                                    "intId": "w_bgguwo64n4ib",
                                    "registeredOn": 1697111642068,
                                    "leftOn": 0,
                                    "userLeftFlag": False,
                                }
                            },
                            "name": "Student 1",
                            "isModerator": False,
                            "isDialIn": False,
                            "currentIntId": "w_bgguwo64n4ib",
                            "answers": {},
                            "talk": {"totalTime": 0, "lastTalkStartedOn": 0},
                            "emojis": [],
                            "webcams": [],
                            "totalOfMessages": 0,
                        },
                    },
                    "polls": {},
                    "screenshares": [],
                    "presentationSlides": [
                        {
                            "presentationId": "31f33b5e",
                            "pageNum": 1,
                            "setOn": 1697111617283,
                            "presentationName": "default.pdf",
                        }
                    ],
                    "createdOn": 1697111611293,
                    "endedOn": 0,
                }
            ),
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertDictEqual(
            {
                "id": str(classroom.id),
                "infos": None,
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
                "sessions": [
                    {
                        "started_at": "2021-10-29T13:32:27Z",
                        "ended_at": "2021-10-29T13:42:27Z",
                        "attendees": {
                            "6af84fe6": {
                                "fullname": "Student 2",
                                "presence": [
                                    {
                                        "entered_at": 1697111639229,
                                        "left_at": 1697111696308,
                                    },
                                    {
                                        "entered_at": 1697111692850,
                                        "left_at": 0,
                                    },
                                ],
                            },
                            "869e1c1e": {
                                "fullname": "Student 1",
                                "presence": [
                                    {
                                        "entered_at": 1697111642068,
                                        "left_at": 0,
                                    }
                                ],
                            },
                        },
                    },
                    {
                        "started_at": "2021-10-29T13:52:27Z",
                        "ended_at": None,
                        "attendees": {
                            "6af84fe6": {
                                "fullname": "Student 2",
                                "presence": [
                                    {
                                        "entered_at": 1697111639229,
                                        "left_at": 1697111696308,
                                    },
                                    {
                                        "entered_at": 1697111692850,
                                        "left_at": 0,
                                    },
                                ],
                            },
                            "869e1c1e": {
                                "fullname": "Student 1",
                                "presence": [
                                    {
                                        "entered_at": 1697111642068,
                                        "left_at": 0,
                                    }
                                ],
                            },
                        },
                    },
                ],
            },
            response.json(),
        )

    def test_api_classroom_fetch_from_LTI_inactive_conversion(self):
        """When consumer site has inactive VOD conversion, it should appear from LTI."""
        classroom = ClassroomFactory(
            playlist__consumer_site__inactive_features=["vod_convert"],
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertFalse(response.json()["vod_conversion_enabled"])

    def test_api_classroom_fetch_from_standalone_site_inactive_conversion(self):
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

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id!s}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        self.assertFalse(response.json()["vod_conversion_enabled"])

    def test_api_classroom_fetch_public_invite(self):
        """A public invited user should be allowed to fetch a classroom."""
        classroom = ClassroomFactory()

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
                "infos": None,
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
                "sessions": [],
            },
            content,
        )

    def test_api_classroom_fetch_moderator_invite(self):
        """A moderator invited user should be allowed to fetch a classroom."""
        classroom = ClassroomFactory()

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
                "infos": None,
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
                "sessions": [],
            },
            content,
        )
