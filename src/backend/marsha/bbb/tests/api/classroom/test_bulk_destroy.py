"""Tests for the classroom bulk destroy API."""
import json

from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomFactory
from marsha.bbb.models import Classroom
from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT
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
class ClassroomBulkDestroyAPITest(TestCase):
    """Test for the bulk destroy API."""

    maxDiff = None

    def _api_url(self):
        """Bulk destroy api url."""
        return "/api/classrooms/"

    def test_api_classroom_bulk_delete_anonymous(self):
        """An anonymous should not be able to delete a list of classroom."""
        classroom = ClassroomFactory()
        response = self.client.delete(self._api_url())
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        self.assertTrue(Classroom.objects.filter(id=classroom.id).exists())

    def test_api_classroom_bulk_delete_student(self):
        """A student should not be able to delete a list of classroom."""
        classroom1 = ClassroomFactory()
        classroom2 = ClassroomFactory()

        jwt_token = StudentLtiTokenFactory(
            playlist=classroom1.playlist,
            permissions__can_update=True,
        )

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(classroom1.pk), str(classroom2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_classroom_bulk_delete_instructor(self):
        """LTI Token can't delete a list of classroom."""
        classroom = ClassroomFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(classroom.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "You do not have permission to perform this action."}
        )

    def test_api_classroom_bulk_delete_user_access_token(self):
        """LTI Token can't delete a list of classroom."""
        organization_access = OrganizationAccessFactory()
        classroom1 = ClassroomFactory()
        classroom2 = ClassroomFactory()

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(classroom1.pk), str(classroom2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            "You do not have permission to perform this action for objects:"
            f"['{str(classroom1.id)}', '{str(classroom2.id)}']",
        )

    def test_api_classroom_bulk_delete_user_access_token_organization_admin(self):
        """An organization administrator should be able to delete a list of classroom."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom1 = ClassroomFactory(playlist=playlist)
        classroom2 = ClassroomFactory(playlist=playlist)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(Classroom.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(classroom1.pk), str(classroom2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Classroom.objects.count(), 0)

    def test_api_classroom_bulk_delete_user_access_token_playlist_admin(self):
        """A playlist administrator should be able to delete a list of classroom."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom1 = ClassroomFactory(playlist=playlist_access.playlist)
        classroom2 = ClassroomFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(Classroom.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(classroom1.pk), str(classroom2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Classroom.objects.count(), 0)

    def test_api_classroom_bulk_delete_user_access_token_playlist_instructor(self):
        """A playlist instructor should be able to delete a list of classroom."""
        playlist_access = PlaylistAccessFactory(role=INSTRUCTOR)
        classroom1 = ClassroomFactory(playlist=playlist_access.playlist)
        classroom2 = ClassroomFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(Classroom.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(classroom1.pk), str(classroom2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 204)
        self.assertEqual(Classroom.objects.count(), 0)

    def test_api_classroom_bulk_delete_user_access_token_playlist_student(self):
        """A playlist student should not be able to delete a list of classroom."""
        playlist_access = PlaylistAccessFactory(role=STUDENT)
        classroom1 = ClassroomFactory(playlist=playlist_access.playlist)
        classroom2 = ClassroomFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(Classroom.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(classroom1.pk), str(classroom2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Classroom.objects.count(), 2)

    def test_api_classroom_bulk_delete_user_access_token_playlist_admin_partial_permission(
        self,
    ):
        """
        A playlist administrator should not be able to delete a list of classroom
        if one the classroom is not from their playlist.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom1 = ClassroomFactory(playlist=playlist_access.playlist)
        classroom2 = ClassroomFactory()
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(Classroom.objects.count(), 2)

        response = self.client.delete(
            self._api_url(),
            {"ids": [str(classroom1.pk), str(classroom2.pk)]},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Classroom.objects.count(), 2)
        content = json.loads(response.content)
        self.assertEqual(
            content,
            "You do not have permission to perform this action for objects:"
            f"['{str(classroom2.id)}']",
        )
