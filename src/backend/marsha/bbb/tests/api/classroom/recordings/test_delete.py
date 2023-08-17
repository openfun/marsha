"""Tests for the ClassroomRecording delete API."""
from unittest.mock import patch

from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomFactory, ClassroomRecordingFactory
from marsha.bbb.models import ClassroomRecording
from marsha.bbb.utils.bbb_utils import ApiMeetingException
from marsha.core.factories import OrganizationAccessFactory, PlaylistAccessFactory
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(
    BBB_ENABLED=True,
    BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api",
    BBB_API_SECRET="SuperSecret",
    AWS_S3_REGION_NAME="us-east-1",
    AWS_SOURCE_BUCKET_NAME="test-source-bucket",
    AWS_ACCESS_KEY_ID="test",
    AWS_SECRET_ACCESS_KEY="test",
)
class ClassroomDeletingRecordingAPITest(TestCase):
    """Test for the ClassroomRecording delete API."""

    maxDiff = None

    bbb_fail_return = {
        "message": "404 video doesn't exists",
        "returncode": "FAILED",
    }

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    @patch("marsha.bbb.api.delete_recording")
    def test_api_delete_classroom_recording_anonymous(self, delete_recording_mock):
        """An anonymous should not be able to delete a recording."""
        recording = ClassroomRecordingFactory()

        response = self.client.delete(
            f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/",
        )

        self.assertEqual(
            response.json(),
            {
                "detail": "Authentication credentials were not provided.",
            },
        )
        self.assertEqual(response.status_code, 401)
        delete_recording_mock.assert_not_called()

    @patch("marsha.bbb.api.delete_recording")
    def test_api_delete_classroom_recording_student(self, delete_recording_mock):
        """Students should not be able to delete a recording."""
        recording = ClassroomRecordingFactory()
        jwt_token = StudentLtiTokenFactory(playlist=recording.classroom.playlist)
        self.assertEqual(ClassroomRecording.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(
            response.json(),
            {
                "detail": "You do not have permission to perform this action.",
            },
        )
        self.assertEqual(response.status_code, 403)
        delete_recording_mock.assert_not_called()

    @patch("marsha.bbb.api.delete_recording")
    def test_api_delete_classroom_recording_instructor_or_admin(
        self, delete_recording_mock
    ):
        """Instructors and admins should be able to delete a recording."""
        recording = ClassroomRecordingFactory(
            started_at="2019-08-21T15:00:02Z",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=recording.classroom.playlist
        )
        self.assertEqual(ClassroomRecording.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassroomRecording.objects.count(), 0)
        delete_recording_mock.assert_called_once()

    @patch("marsha.bbb.api.delete_recording")
    def test_api_delete_classroom_recording_user_access_token(
        self, delete_recording_mock
    ):
        """A user with UserAccessToken should not be able to delete a recording."""
        organization_access = OrganizationAccessFactory()
        recording = ClassroomRecordingFactory(
            classroom__playlist__organization=organization_access.organization
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assertEqual(ClassroomRecording.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        delete_recording_mock.assert_not_called()

    @patch("marsha.bbb.api.delete_recording")
    def test_api_delete_classroom_recording_user_access_token_organization_admin(
        self, delete_recording_mock
    ):
        """An organization administrator should be able to delete a recording."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist__organization=organization_access.organization
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assertEqual(ClassroomRecording.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassroomRecording.objects.count(), 0)
        delete_recording_mock.assert_called_once()

    @patch(
        "marsha.bbb.api.delete_recording",
        side_effect=ApiMeetingException(bbb_fail_return),
    )
    def test_api_fail_delete_classroom_recording_user_access_token_organization_admin(
        self, delete_recording_mock
    ):
        """An organization administrator should be able to delete a recording."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist__organization=organization_access.organization
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assertEqual(ClassroomRecording.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.json(), "BBB API failed to delete the recording")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(ClassroomRecording.objects.count(), 1)
        delete_recording_mock.assert_called_once()

    @patch("marsha.bbb.api.delete_recording")
    def test_api_delete_classroom_recording_user_access_token_playlist_admin(
        self, delete_recording_mock
    ):
        """A playlist administrator should be able to delete a recording."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assertEqual(ClassroomRecording.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassroomRecording.objects.count(), 0)
        delete_recording_mock.assert_called_once()

    @patch("marsha.bbb.api.delete_recording")
    def test_api_delete_classroom_recording_user_access_token_other_playlist_admin(
        self, delete_recording_mock
    ):
        """
        A playlist administrator should not be able to delete a recording
        in a playlist he is not administrator.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist
        )
        classroom_other = ClassroomFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assertEqual(ClassroomRecording.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{classroom_other.id}/recordings/{recording.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(ClassroomRecording.objects.count(), 1)
        delete_recording_mock.assert_not_called()

    @patch("marsha.bbb.api.delete_recording")
    def test_api_delete_classroom_recording_admin_other_playlist_access(
        self, delete_recording_mock
    ):
        """
        A playlist administrator in another access should not be able to delete
        a recording in a playlist he is not administrator.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        other_playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        recording = ClassroomRecordingFactory(
            classroom__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=other_playlist_access.user)
        self.assertEqual(ClassroomRecording.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{recording.classroom.id}/recordings/{recording.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(ClassroomRecording.objects.count(), 1)
        delete_recording_mock.assert_not_called()
