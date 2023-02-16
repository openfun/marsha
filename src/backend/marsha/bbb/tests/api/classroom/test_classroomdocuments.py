"""Tests for the classroom API."""
from datetime import datetime

from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
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
from marsha.core.tests.testing_utils import reload_urlconf


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomClassroomdocumentsAPITest(TestCase):
    """Test for the Classroom API."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    def test_api_list_classroom_documents_anonymous(self):
        """An anonymous should not be able to fetch a list of classroom documents."""
        classroom = ClassroomFactory()
        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/"
        )
        self.assertEqual(response.status_code, 401)

    def test_api_list_classroom_documents_student(self):
        """A student should not be able to fetch a list of classroom documents."""
        classroom = ClassroomFactory()
        ClassroomDocumentFactory.create_batch(3, classroom=classroom)
        jwt_token = StudentLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_list_classroom_documents_instructor(self):
        """An instructor should be able to fetch list of classroom documents."""
        classroom = ClassroomFactory()
        classroom_documents = ClassroomDocumentFactory.create_batch(
            3, classroom=classroom
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/?limit=2",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": f"http://testserver/api/classrooms/{classroom.id}"
                "/classroomdocuments/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[2].filename,
                        "id": str(classroom_documents[2].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[1].filename,
                        "id": str(classroom_documents[1].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )

    @override_settings(
        CLOUDFRONT_SIGNED_URLS_ACTIVE=True,
        CLOUDFRONT_SIGNED_PUBLIC_KEY_ID="cloudfront-access-key-id",
    )
    def test_api_list_classroom_documents_instructor_urls(self):
        """Classroom documents should not been signed."""
        classroom = ClassroomFactory(id="4e126eac-9ca8-47b1-8dcd-157686b43c60")
        now = datetime(2018, 8, 8, tzinfo=timezone.utc)
        classroom_documents = ClassroomDocumentFactory.create_batch(
            3, classroom=classroom, uploaded_on=now
        )
        classroom_documents.append(
            ClassroomDocumentFactory(
                classroom=classroom,
                filename="no_extension_file",
                uploaded_on=now,
            )
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(resource=classroom)

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 4,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[3].filename,
                        "id": str(classroom_documents[3].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{classroom.id}/classroomdocument/"
                            f"{classroom_documents[3].id}/1533686400"
                            f"?response-content-disposition"
                            f"=attachment%3B+filename%3D{classroom_documents[3].filename}"
                        ),
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[2].filename,
                        "id": str(classroom_documents[2].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{classroom.id}/classroomdocument/"
                            f"{classroom_documents[2].id}/1533686400"
                            f".{classroom_documents[2].filename.split('.')[-1]}"
                            f"?response-content-disposition"
                            f"=attachment%3B+filename%3D{classroom_documents[2].filename}"
                        ),
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[1].filename,
                        "id": str(classroom_documents[1].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{classroom.id}/classroomdocument/"
                            f"{classroom_documents[1].id}/1533686400"
                            f".{classroom_documents[1].filename.split('.')[-1]}"
                            f"?response-content-disposition"
                            f"=attachment%3B+filename%3D{classroom_documents[1].filename}"
                        ),
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[0].filename,
                        "id": str(classroom_documents[0].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": "2018-08-08T00:00:00Z",
                        "url": (
                            f"https://abc.cloudfront.net/{classroom.id}/classroomdocument/"
                            f"{classroom_documents[0].id}/1533686400"
                            f".{classroom_documents[0].filename.split('.')[-1]}"
                            f"?response-content-disposition"
                            f"=attachment%3B+filename%3D{classroom_documents[0].filename}"
                        ),
                    },
                ],
            },
        )

    def test_api_list_classroom_documents_user_access(self):
        """A user with UserAccessToken should be able to fetch list of classroom documents."""
        organization_access = OrganizationAccessFactory()
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        ClassroomDocumentFactory.create_batch(3, classroom=classroom)

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/?limit=2",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 403)

    def test_api_list_classroom_documents_user_access_token_organization_admin(self):
        """A user with UserAccessToken should be able to fetch list of classroom documents."""
        organization_access = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist = PlaylistFactory(organization=organization_access.organization)
        classroom = ClassroomFactory(playlist=playlist)
        classroom_documents = ClassroomDocumentFactory.create_batch(
            3, classroom=classroom
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/?limit=2",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": f"http://testserver/api/classrooms/{classroom.id}"
                "/classroomdocuments/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[2].filename,
                        "id": str(classroom_documents[2].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[1].filename,
                        "id": str(classroom_documents[1].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )

    def test_api_list_classroom_documents_user_access_token_playlist_admin(self):
        """A user with UserAccessToken should be able to fetch list of classroom documents."""
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        classroom = ClassroomFactory(playlist=playlist_access.playlist)
        classroom_documents = ClassroomDocumentFactory.create_batch(
            3, classroom=classroom
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            f"/api/classrooms/{classroom.id}/classroomdocuments/?limit=2",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": f"http://testserver/api/classrooms/{classroom.id}"
                "/classroomdocuments/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[2].filename,
                        "id": str(classroom_documents[2].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                    {
                        "classroom": str(classroom.id),
                        "filename": classroom_documents[1].filename,
                        "id": str(classroom_documents[1].id),
                        "is_default": False,
                        "upload_state": "pending",
                        "uploaded_on": None,
                        "url": None,
                    },
                ],
            },
        )
