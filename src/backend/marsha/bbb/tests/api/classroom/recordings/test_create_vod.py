"""Tests for the ClassroomRecording create vod API."""
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone

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
from marsha.core.utils.time_utils import to_timestamp


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(
    BBB_ENABLED=True,
    AWS_S3_REGION_NAME="us-east-1",
    AWS_SOURCE_BUCKET_NAME="test-source-bucket",
    AWS_ACCESS_KEY_ID="test",
    AWS_SECRET_ACCESS_KEY="test",
)
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

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
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

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
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
        jwt_token = StudentLtiTokenFactory(resource=recording.classroom)

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
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

    def test_api_classroom_recording_create_vod_instructor_or_admin(self):
        """Instructors and admins should be able to convert a recording to a VOD."""
        recording = ClassroomRecordingFactory(
            started_at="2019-08-21T15:00:02Z",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=recording.classroom)

        self.assertEqual(Video.objects.count(), 0)

        now = timezone.now()

        with mock.patch(
            "marsha.bbb.api.invoke_lambda_convert"
        ) as mock_invoke_lambda_convert, mock.patch.object(
            timezone, "now", return_value=now
        ), self.assertNumQueries(
            9
        ):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                data={"title": "My title"},
            )

        self.assertEqual(Video.objects.count(), 1)
        self.assertEqual(response.status_code, 201)

        recording.refresh_from_db()
        self.assertDictEqual(
            response.json(),
            {
                "classroom": str(recording.classroom.id),
                "id": str(recording.id),
                "record_id": str(recording.record_id),
                "started_at": "2019-08-21T15:00:02Z",
                "video_file_url": recording.video_file_url,
                "vod": {
                    "id": str(recording.vod.id),
                    "title": "My title",
                    "upload_state": "pending",
                },
            },
        )

        self.assertEqual(Video.objects.first(), recording.vod)
        self.assertEqual(recording.vod.upload_state, PENDING)
        mock_invoke_lambda_convert.assert_called_once_with(
            recording.video_file_url,
            recording.vod.get_source_s3_key(stamp=to_timestamp(now)),
        )

    def test_api_classroom_recording_create_vod_instructor_or_admin_unknown_recording(
        self,
    ):
        """Instructors and admins should not be able to convert an unknown recording to a VOD."""
        recording = ClassroomRecordingFactory(
            started_at="2019-08-21T15:00:02Z",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=recording.classroom)

        self.assertEqual(Video.objects.count(), 0)

        now = timezone.now()

        with mock.patch.object(
            timezone, "now", return_value=now
        ), self.assertNumQueries(1):
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
            {"detail": "Not found."},
        )

    def test_api_classroom_recording_create_vod_user_access_token(self):
        """A user with UserAccessToken should not be able to convert a recording to a VOD."""
        organization_access = OrganizationAccessFactory()
        recording = ClassroomRecordingFactory(
            classroom__playlist__organization=organization_access.organization
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 403)

    def test_api_classroom_recording_create_vod_user_access_token_organization_admin(
        self,
    ):
        """An organization administrator should be able to convert a recording to a VOD."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist__organization=organization_access.organization
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 201)

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
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 201)

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

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 405)

    def test_api_classroom_recording_create_vod_user_access_token_playlist_admin(
        self,
    ):
        """A playlist administrator should be able to convert a recording to a VOD."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 201)

    def test_api_classroom_recording_create_vod_user_access_token_playlist_instructor(
        self,
    ):
        """A playlist instructor should be able to convert a recording to a VOD."""
        playlist_access = PlaylistAccessFactory(role=INSTRUCTOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
            response = self.client.post(
                f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/create-vod/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 201)

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

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
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

        with mock.patch("marsha.bbb.api.invoke_lambda_convert"):
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
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=recording.classroom)

        self.assertEqual(Video.objects.count(), 0)

        now = timezone.now()

        with mock.patch(
            "marsha.bbb.api.invoke_lambda_convert"
        ) as mock_invoke_lambda_convert, mock.patch.object(
            timezone, "now", return_value=now
        ), self.assertNumQueries(
            1
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
        mock_invoke_lambda_convert.assert_not_called()
