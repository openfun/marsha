"""Tests for the classroom retrieve API."""


from django.test import TestCase, override_settings

from marsha.bbb.factories import (
    ClassroomDocumentFactory,
    ClassroomFactory,
    ClassroomRecordingFactory,
)
from marsha.bbb.models import Classroom, ClassroomDocument, ClassroomRecording
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomDeleteAPITest(TestCase):
    """Test for the Classroom delete API."""

    maxDiff = None

    def test_api_classroom_delete_anonymous(self):
        """An anonymous should not be able to delete a classroom."""
        classroom = ClassroomFactory()
        response = self.client.delete(f"/api/classrooms/{classroom.id}/")
        self.assertEqual(response.status_code, 401)

    def test_api_classroom_delete_student(self):
        """A student should not be able to delete a classroom."""
        classroom = ClassroomFactory()

        jwt_token = StudentLtiTokenFactory(
            playlist=classroom.playlist,
            permissions__can_update=True,
        )

        response = self.client.delete(
            f"/api/classrooms/{classroom.id}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_classroom_delete_instructor(self):
        """An instructor without playlist token should not be able to delete a classroom."""
        classroom = ClassroomFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.delete(
            f"/api/classrooms/{classroom.id}/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_classroom_delete_user_access_token(self):
        """A user with UserAccessToken should not be able to delete a classroom."""
        organization_access = OrganizationAccessFactory()
        classroom = ClassroomFactory()

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.delete(
            f"/api/classrooms/{classroom.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_classroom_delete_user_access_token_organization_admin(self):
        """An organization administrator should be able to delete a classroom."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(Classroom.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{classroom.id}/",
            {
                "playlist": str(playlist.id),
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Classroom.objects.count(), 0)

    def test_api_classroom_delete_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to delete a classroom."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(Classroom.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{classroom.id}/",
            {
                "playlist": str(playlist_access.playlist.id),
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(Classroom.objects.count(), 0)

    def test_api_classroom_delete_with_records(self):
        """An organization administrator should be able to delete a classroom
        having video records."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        ClassroomRecordingFactory(classroom=classroom)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(Classroom.objects.count(), 1)
        self.assertEqual(ClassroomRecording.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{classroom.id}/",
            {
                "playlist": str(playlist.id),
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Classroom.objects.count(), 0)
        self.assertEqual(ClassroomRecording.objects.count(), 0)

    def test_api_classroom_delete_with_document(self):
        """An organization administrator should be able to delete a classroom having documents."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        ClassroomDocumentFactory(classroom=classroom)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(Classroom.objects.count(), 1)
        self.assertEqual(ClassroomDocument.objects.count(), 1)

        response = self.client.delete(
            f"/api/classrooms/{classroom.id}/",
            {
                "playlist": str(playlist.id),
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Classroom.objects.count(), 0)
        self.assertEqual(ClassroomDocument.objects.count(), 0)
