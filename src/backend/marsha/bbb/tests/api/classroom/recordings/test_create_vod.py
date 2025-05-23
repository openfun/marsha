"""Tests for the ClassroomRecording create vod API."""

from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone

import responses

from marsha.bbb.factories import ClassroomFactory, ClassroomRecordingFactory
from marsha.core.defaults import PENDING
from marsha.core.factories import OrganizationAccessFactory, PlaylistAccessFactory
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT, Video
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_API_CALLBACK_SECRET="OtherSuperSecret")
@override_settings(BBB_ENABLED=True)
@override_settings(AWS_S3_REGION_NAME="us-east-1")
@override_settings(AWS_SOURCE_BUCKET_NAME="test-source-bucket")
class ClassroomRecordingCreateVodAPITest(TestCase):
    """Test for the ClassroomRecording create vod API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    def test_api_classroom_recording_create_anonymous(self):
        """An anonymous should not be able to convert a recording to a VOD."""
        recording = ClassroomRecordingFactory()

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
            )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(),
            {
                "detail": "Authentication credentials were not provided.",
            },
        )

    def test_api_classroom_recording_create_anonymous_unknown_recording(self):
        """An anonymous should not be able to convert an unknown recording to a VOD."""
        recording = ClassroomRecordingFactory()

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}"
                f"/recordings/{recording.classroom.id}/create-vod/",
            )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(),
            {
                "detail": "Authentication credentials were not provided.",
            },
        )

    def test_api_classroom_recording_create_vod_student(self):
        """Students should not be able to convert a recording to a VOD."""
        recording = ClassroomRecordingFactory()
        jwt_token = StudentLtiTokenFactory(playlist=recording.classroom.playlist)

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {
                "detail": "You do not have permission to perform this action.",
            },
        )

    @responses.activate
    def test_api_classroom_recording_create_vod_instructor_or_admin(self):
        """Instructors and admins should be able to convert a recording to a VOD."""
        recording = ClassroomRecordingFactory(
            started_at="2019-08-21T15:00:02Z",
            record_id="67df5782-c17b-46d8-9dcb-a404e0b31251",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=recording.classroom.playlist
        )

        self.assertEqual(Video.objects.count(), 0)

        now = timezone.now()

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

        with (
            mock.patch("marsha.bbb.api.chain") as mock_chain,
            mock.patch("marsha.bbb.api.copy_video_recording.si") as mock_copy,
            mock.patch(
                "marsha.bbb.api.launch_video_transcoding.si"
            ) as mock_transcoding,
            mock.patch.object(timezone, "now", return_value=now),
            self.assertNumQueries(9),
        ):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"title": "My title"},
            )

        self.assertEqual(Video.objects.count(), 1)
        self.assertEqual(Video.objects.first().transcode_pipeline, "peertube")
        self.assertEqual(response.status_code, 201)

        recording.refresh_from_db()
        self.assertDictEqual(
            response.json(),
            {
                "classroom_id": str(recording.classroom.id),
                "id": str(recording.id),
                "record_id": str(recording.record_id),
                "started_at": "2019-08-21T15:00:02Z",
                "video_file_url": (
                    "https://10.7.7.1/presentation/"
                    "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
                ),
                "vod": {
                    "id": str(recording.vod.id),
                    "title": "My title",
                    "upload_state": "pending",
                },
            },
        )

        self.assertEqual(Video.objects.first(), recording.vod)
        self.assertEqual(recording.vod.upload_state, PENDING)
        stamp = str(int(now.timestamp()))
        mock_copy.assert_called_once_with(
            record_url=(
                "https://10.7.7.1/presentation/"
                "c62c9c205d37815befe1b75ae6ef5878d8da5bb6-1673282694493/meeting.mp4"
            ),
            video_pk=recording.vod.pk,
            stamp=stamp,
        )
        mock_transcoding.assert_called_once_with(
            video_pk=recording.vod.pk, stamp=stamp, domain="http://testserver"
        )
        mock_chain.assert_called_once_with(mock_copy(), mock_transcoding())

    def test_api_classroom_recording_create_vod_instructor_or_admin_unknown_recording(
        self,
    ):
        """Instructors and admins should not be able to convert an unknown recording to a VOD."""
        recording = ClassroomRecordingFactory(
            started_at="2019-08-21T15:00:02Z",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=recording.classroom.playlist
        )

        self.assertEqual(Video.objects.count(), 0)

        now = timezone.now()

        with (
            mock.patch.object(timezone, "now", return_value=now),
            self.assertNumQueries(1),
        ):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}"
                f"/recordings/{recording.classroom.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"title": "My title"},
            )

        self.assertEqual(Video.objects.count(), 0)
        self.assertEqual(response.status_code, 404)

        self.assertDictEqual(
            response.json(),
            {"detail": "No ClassroomRecording matches the given query."},
        )

    def test_api_classroom_recording_create_vod_user_access_token(self):
        """A user with UserAccessToken should not be able to convert a recording to a VOD."""
        organization_access = OrganizationAccessFactory()
        recording = ClassroomRecordingFactory(
            classroom__playlist__organization=organization_access.organization
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 403)

    @responses.activate
    def test_api_classroom_recording_create_vod_user_access_token_organization_admin(
        self,
    ):
        """An organization administrator should be able to convert a recording to a VOD."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist__organization=organization_access.organization,
            record_id="67df5782-c17b-46d8-9dcb-a404e0b31251",
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

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

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Video.objects.count(), 1)
        self.assertEqual(Video.objects.first().transcode_pipeline, "peertube")

    @responses.activate
    def test_api_classroom_recording_create_vod_from_standalone_site_no_consumer_site(
        self,
    ):
        """
        An organization administrator should be able to convert a recording to a VOD
        from standalone site.
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist__organization=organization_access.organization,
            classroom__playlist__consumer_site=None,
            classroom__playlist__lti_id=None,
            record_id="67df5782-c17b-46d8-9dcb-a404e0b31251",
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

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

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Video.objects.count(), 1)
        self.assertEqual(Video.objects.first().transcode_pipeline, "peertube")

    def test_api_classroom_recording_create_vod_from_standalone_site_inactive_conversion(
        self,
    ):
        """
        An organization administrator should not be able to convert a recording to a VOD
        from standalone site when inactive.
        """
        organization_access = OrganizationAccessFactory(
            role=ADMINISTRATOR,
            organization__inactive_features=["vod_convert"],
        )
        recording = ClassroomRecordingFactory(
            classroom__playlist__organization=organization_access.organization,
            classroom__playlist__consumer_site=None,
            classroom__playlist__lti_id=None,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 405)

    @responses.activate
    def test_api_classroom_recording_create_vod_user_access_token_playlist_admin(
        self,
    ):
        """A playlist administrator should be able to convert a recording to a VOD."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist,
            record_id="67df5782-c17b-46d8-9dcb-a404e0b31251",
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

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Video.objects.count(), 1)
        self.assertEqual(Video.objects.first().transcode_pipeline, "peertube")

    @responses.activate
    def test_api_classroom_recording_create_vod_user_access_token_playlist_instructor(
        self,
    ):
        """A playlist instructor should be able to convert a recording to a VOD."""
        playlist_access = PlaylistAccessFactory(role=INSTRUCTOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist,
            record_id="67df5782-c17b-46d8-9dcb-a404e0b31251",
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

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Video.objects.count(), 1)
        self.assertEqual(Video.objects.first().transcode_pipeline, "peertube")

    def test_api_classroom_recording_create_vod_user_access_token_playlist_student(
        self,
    ):
        """A playlist student should not be able to convert a recording to a VOD."""
        playlist_access = PlaylistAccessFactory(role=STUDENT)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.post(
            f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def test_api_classroom_recording_create_vod_user_access_token_other_playlist_admin(
        self,
    ):
        """
        A playlist administrator should not be able to convert a recording to a VOD
        in a playlist he is not administrator.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist
        )
        classroom_other = ClassroomFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{classroom_other.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 404)

    def test_api_classroom_recording_create_vod_admin_other_playlist_access(
        self,
    ):
        """
        A playlist administrator in another access should not be able to convert
        a recording to a VOD in a playlist he is not administrator.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        other_playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=other_playlist_access.user)

        with mock.patch("marsha.bbb.api.chain"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 403)

    def test_api_classroom_recording_create_vod_instructor_or_admin_inactive_conversion(
        self,
    ):
        """
        Instructors and admins should not be able to convert a recording to a VOD
        from LTI when inactive.
        """
        recording = ClassroomRecordingFactory(
            started_at="2019-08-21T15:00:02Z",
            classroom__playlist__consumer_site__inactive_features=["vod_convert"],
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=recording.classroom.playlist
        )

        self.assertEqual(Video.objects.count(), 0)

        now = timezone.now()

        with (
            mock.patch("marsha.bbb.api.chain") as mock_chain,
            mock.patch.object(timezone, "now", return_value=now),
            self.assertNumQueries(1),
        ):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"title": "My title"},
            )

        self.assertEqual(Video.objects.count(), 0)
        self.assertEqual(response.status_code, 405)

        recording.refresh_from_db()
        self.assertDictEqual(
            response.json(),
            {"error": "VOD conversion is disabled."},
        )
        self.assertEqual(Video.objects.count(), 0)
        mock_chain.assert_not_called()
