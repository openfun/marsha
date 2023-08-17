"""Tests for the classroomdocument delete API."""
from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
from marsha.bbb.models import ClassroomDocument
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
from marsha.core.tests.testing_utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_ENABLED=True)
class ClassroomDocumentDeleteAPITest(TestCase):
    """Test for the ClassroomDocument delete API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    def test_api_classroom_document_delete_student(self):
        """
        A student should not be able to delete a document
        for an existing classroom.
        """

        classroom_document = ClassroomDocumentFactory()
        jwt_token = StudentLtiTokenFactory(
            playlist=classroom_document.classroom.playlist
        )

        self.assertEqual(ClassroomDocument.objects.count(), 1)
        response = self.client.delete(
            f"/api/classrooms/{classroom_document.classroom.id}"
            f"/classroomdocuments/{classroom_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(ClassroomDocument.objects.count(), 1)

    def test_api_classroom_document_delete_instructor_document(self):
        """
        An instructor should be able to delete a document
        for an existing classroom.
        """
        classroom_document = ClassroomDocumentFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=classroom_document.classroom.playlist
        )

        self.assertEqual(ClassroomDocument.objects.count(), 1)
        response = self.client.delete(
            f"/api/classrooms/{classroom_document.classroom.id}"
            f"/classroomdocuments/{classroom_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassroomDocument.objects.count(), 0)

    def test_api_classroom_document_delete_instructor_first_document(self):
        """
        An instructor should be able to delete a default document
        for an existing classroom.

        Second document should become the default one once the first deleted.
        """
        classroom = ClassroomFactory()
        first_document = ClassroomDocumentFactory(
            classroom=classroom,
            is_default=True,
        )
        second_document = ClassroomDocumentFactory(
            classroom=classroom,
            is_default=False,
        )
        ClassroomDocumentFactory(
            classroom=classroom,
            is_default=False,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        self.assertEqual(ClassroomDocument.objects.count(), 3)
        response = self.client.delete(
            f"/api/classrooms/{classroom.id}/classroomdocuments/{first_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassroomDocument.objects.count(), 2)
        second_document.refresh_from_db()
        self.assertTrue(second_document.is_default)

    def test_api_classroom_document_delete_instructor_second_document(self):
        """
        An instructor should be able to delete a second a document
        for an existing classroom.

        First document should stay default one.
        """
        classroom = ClassroomFactory()
        first_document = ClassroomDocumentFactory(
            classroom=classroom,
            is_default=True,
        )
        second_document = ClassroomDocumentFactory(
            classroom=classroom,
            is_default=False,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=classroom.playlist)

        self.assertEqual(ClassroomDocument.objects.count(), 2)
        response = self.client.delete(
            f"/api/classrooms/{classroom.id}/classroomdocuments/{second_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassroomDocument.objects.count(), 1)
        first_document.refresh_from_db()
        self.assertTrue(first_document.is_default)

    def test_api_classroom_document_delete_user_access_token(self):
        """
        A user with UserAccessToken should not be able to delete a document
        for an existing classroom.
        """
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom_document = ClassroomDocumentFactory(classroom__playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        self.assertEqual(ClassroomDocument.objects.count(), 1)
        response = self.client.delete(
            f"/api/classrooms/{classroom_document.classroom.id}"
            f"/classroomdocuments/{classroom_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(ClassroomDocument.objects.count(), 1)

    def test_api_classroom_document_delete_user_access_token_organization_admin(self):
        """
        An organization administrator should be able to delete a document
        for an existing classroom.

        First deleted document should be the default one.
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom_document = ClassroomDocumentFactory(classroom__playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assertEqual(ClassroomDocument.objects.count(), 1)
        response = self.client.delete(
            f"/api/classrooms/{classroom_document.classroom.id}"
            f"/classroomdocuments/{classroom_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassroomDocument.objects.count(), 0)

    def test_api_classroom_document_delete_user_access_token_playlist_admin(self):
        """
        A playlist administrator should be able to delete a document
        for an existing classroom.

        First deleted document should be the default one.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom_document = ClassroomDocumentFactory(
            classroom__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(ClassroomDocument.objects.count(), 1)
        response = self.client.delete(
            f"/api/classrooms/{classroom_document.classroom.id}"
            f"/classroomdocuments/{classroom_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassroomDocument.objects.count(), 0)

    def test_api_classroom_document_delete_user_access_token_playlist_instructor(self):
        """
        A playlist instructor should be able to delete a document
        for an existing classroom.

        First deleted document should be the default one.
        """
        playlist_access = PlaylistAccessFactory(role=INSTRUCTOR)
        classroom_document = ClassroomDocumentFactory(
            classroom__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(ClassroomDocument.objects.count(), 1)
        response = self.client.delete(
            f"/api/classrooms/{classroom_document.classroom.id}"
            f"/classroomdocuments/{classroom_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 204)
        self.assertEqual(ClassroomDocument.objects.count(), 0)

    def test_api_classroom_document_delete_user_access_token_playlist_student(self):
        """
        A playlist student should not be able to delete a document
        for an existing classroom.
        """
        playlist_access = PlaylistAccessFactory(role=STUDENT)
        classroom_document = ClassroomDocumentFactory(
            classroom__playlist=playlist_access.playlist
        )
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        self.assertEqual(ClassroomDocument.objects.count(), 1)
        response = self.client.delete(
            f"/api/classrooms/{classroom_document.classroom.id}"
            f"/classroomdocuments/{classroom_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(ClassroomDocument.objects.count(), 1)

    def test_api_classroom_document_delete_user_access_token_admin_other_playlist(self):
        """
        A playlist administrator should not be able to delete a classroom document in a playlist
        he is not administrator.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        other_playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)

        classroom_document = ClassroomDocumentFactory(
            classroom__playlist=playlist_access.playlist
        )

        # user from the other_playlist must not be able to access the classroom
        # as it is not administrator.
        jwt_token = UserAccessTokenFactory(user=other_playlist_access.user)

        self.assertEqual(ClassroomDocument.objects.count(), 1)
        response = self.client.delete(
            f"/api/classrooms/{classroom_document.classroom.id}"
            f"/classroomdocuments/{classroom_document.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(ClassroomDocument.objects.count(), 1)
