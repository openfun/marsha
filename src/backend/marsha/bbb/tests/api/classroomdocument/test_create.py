"""Tests for the classroomdocument create API."""
import json

from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
from marsha.bbb.models import ClassroomDocument
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
from marsha.core.tests.utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_ENABLED=True)
class ClassroomDocumentCreateAPITest(TestCase):
    """Test for the ClassroomDocument create API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    def test_api_classroom_document_create_student(self):
        """
        A student should not be able to create a document
        for an existing classroom.
        """

        classroom = ClassroomFactory()
        jwt_token = StudentLtiTokenFactory(resource=classroom)

        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test.pdf",
                }
            ),
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(ClassroomDocument.objects.count(), 0)
        self.assertEqual(classroom.classroom_documents.count(), 0)

    def test_api_classroom_document_create_instructor_first_document(self):
        """
        An instructor should be able to create a document
        for an existing classroom.

        First created document should be the default one.
        """
        classroom = ClassroomFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test.pdf",
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClassroomDocument.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "classroom": str(classroom.id),
                "filename": "test.pdf",
                "id": str(ClassroomDocument.objects.first().id),
                "is_default": True,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

    def test_api_classroom_document_create_instructor_second_document(self):
        """
        An instructor should be able to create a document
        for an existing classroom.

        Second created document should not be the default one.
        """
        classroom = ClassroomFactory()
        first_document = ClassroomDocumentFactory(
            classroom=classroom,
            is_default=True,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)
        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test2.pdf",
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClassroomDocument.objects.count(), 2)
        self.assertEqual(
            response.json(),
            {
                "classroom": str(classroom.id),
                "filename": "test2.pdf",
                "id": str(ClassroomDocument.objects.last().id),
                "is_default": False,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )
        first_document.refresh_from_db()
        self.assertTrue(first_document.is_default)

    def test_api_classroom_document_create_user_access_token(self):
        """
        A user with UserAccessToken should not be able to create a document
        for an existing classroom.
        """
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test.pdf",
                }
            ),
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(ClassroomDocument.objects.count(), 0)
        self.assertEqual(classroom.classroom_documents.count(), 0)

    def test_api_classroom_document_create_user_access_token_organization_admin(self):
        """
        An organization administrator should be able to create a document
        for an existing classroom.

        First created document should be the default one.
        """
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test.pdf",
                    "classroom": str(classroom.id),
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClassroomDocument.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "classroom": str(classroom.id),
                "filename": "test.pdf",
                "id": str(ClassroomDocument.objects.first().id),
                "is_default": True,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

    def test_api_classroom_document_create_user_access_token_playlist_admin(self):
        """
        A playlist administrator should be able to create a document
        for an existing classroom.

        First created document should be the default one.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)
        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test.pdf",
                    "classroom": str(classroom.id),
                }
            ),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ClassroomDocument.objects.count(), 1)
        self.assertEqual(
            response.json(),
            {
                "classroom": str(classroom.id),
                "filename": "test.pdf",
                "id": str(ClassroomDocument.objects.first().id),
                "is_default": True,
                "upload_state": "pending",
                "uploaded_on": None,
                "url": None,
            },
        )

    def test_api_classroom_document_create_user_access_token_admin_other_playlist(self):
        """
        A playlist administrator should not be able to create a classroom document in a playlist
        he is not administrator.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        ohter_playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)

        classroom = ClassroomFactory(playlist=playlist_access.playlist)

        # user from the other_playlist must not be able to access the classroom
        # as it is not administrator.
        jwt_token = UserAccessTokenFactory(user=ohter_playlist_access.user)

        response = self.client.post(
            "/api/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
            data=json.dumps(
                {
                    "filename": "test.pdf",
                    "classroom": str(classroom.id),
                }
            ),
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(ClassroomDocument.objects.count(), 0)
        self.assertEqual(classroom.classroom_documents.count(), 0)
