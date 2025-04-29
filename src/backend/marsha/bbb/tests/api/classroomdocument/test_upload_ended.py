"""Tests for the classroom document upload ended API."""

from django.test import TestCase, override_settings

from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
from marsha.core import factories, models
from marsha.core.defaults import READY
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.core.tests.testing_utils import reload_urlconf


@override_settings(BBB_ENABLED=True)
class ClassroomDocumentUploadEndedAPITest(TestCase):
    """Test the "upload-ended" API of the classroom document object."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

        cls.organization = factories.OrganizationFactory()
        cls.classroom = ClassroomFactory(playlist__organization=cls.organization)
        cls.classroom_document = ClassroomDocumentFactory(
            upload_state="pending",
            classroom=cls.classroom,
        )

    def assert_user_cannot_end_an_upload(self, classroom, classroom_document, token):
        """Assert the user cannot end an upload."""

        response = self.client.post(
            f"/api/classrooms/{classroom.pk}/classroomdocuments/"
            f"{classroom_document.pk}/upload-ended/",
            {
                "file_key": f"classroom/{classroom.pk}/classroomdocument/"
                f"{classroom_document.pk}/foo.pdf",
            },
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 403)

    def assert_user_can_end_an_upload(self, classroom, classroom_document, token):
        """Assert the user can end an upload."""
        response = self.client.post(
            f"/api/classrooms/{classroom.pk}/classroomdocuments/"
            f"{classroom_document.pk}/upload-ended/",
            {
                "file_key": f"classroom/{classroom.pk}/classroomdocument/"
                f"{classroom_document.pk}/{classroom_document.filename}",
            },
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)

        classroom_document.refresh_from_db()
        self.assertEqual(classroom_document.upload_state, READY)

    def test_end_upload_by_anonymous_user(self):
        """Anonymous users cannot end an upload."""
        response = self.client.post(
            f"/api/classrooms/{self.classroom_document.classroom.pk}/"
            f"classroomdocuments/{self.classroom_document.pk}/upload-ended/"
        )
        self.assertEqual(response.status_code, 401)

    def test_end_upload_by_random_user(self):
        """Authenticated user without access cannot end an upload."""
        user = factories.UserFactory()

        jwt_token = UserAccessTokenFactory(user=user)
        self.assert_user_cannot_end_an_upload(
            self.classroom, self.classroom_document, jwt_token
        )

    def test_end_upload_by_organization_student(self):
        """Organization students cannot end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.STUDENT,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_cannot_end_an_upload(
            self.classroom, self.classroom_document, jwt_token
        )

    def test_end_upload_by_organization_instructor(self):
        """Organization instructors cannot end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.INSTRUCTOR,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_cannot_end_an_upload(
            self.classroom, self.classroom_document, jwt_token
        )

    def test_end_upload_by_organization_administrator(self):
        """Organization administrators can end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.ADMINISTRATOR,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_can_end_an_upload(
            self.classroom, self.classroom_document, jwt_token
        )

    def test_end_upload_by_consumer_site_any_role(self):
        """Consumer site roles cannot end an upload."""
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            consumer_site=self.classroom.playlist.consumer_site,
        )

        jwt_token = UserAccessTokenFactory(user=consumer_site_access.user)
        self.assert_user_cannot_end_an_upload(
            self.classroom, self.classroom_document, jwt_token
        )

    def test_end_upload_by_playlist_student(self):
        """Playlist student cannot end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.classroom.playlist,
            role=models.STUDENT,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_cannot_end_an_upload(
            self.classroom, self.classroom_document, jwt_token
        )

    def test_end_upload_by_playlist_instructor(self):
        """Playlist instructor can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.classroom.playlist,
            role=models.INSTRUCTOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_can_end_an_upload(
            self.classroom, self.classroom_document, jwt_token
        )

    def test_end_upload_by_lti_instructor(self):
        """Playlist instructor can end an upload."""
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=self.classroom.playlist)

        self.assert_user_can_end_an_upload(
            self.classroom, self.classroom_document, jwt_token
        )

    def test_end_upload_by_playlist_admin(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.classroom.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_can_end_an_upload(
            self.classroom, self.classroom_document, jwt_token
        )

    def test_end_upload_with_wrong_body(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.classroom.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            (
                f"/api/classrooms/{self.classroom.pk}/classroomdocuments/"
                f"{self.classroom_document.pk}/upload-ended/"
            ),
            {
                "wrong_key": f"source/{self.classroom.pk}/thumbnail/4564565456",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)

    def test_end_upload_with_forged_path(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.classroom.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            (
                f"/api/classrooms/{self.classroom.pk}/classroomdocuments/"
                f"{self.classroom_document.pk}/upload-ended/"
            ),
            {
                "file_key": f"classroom/{self.classroom.pk}/crafted/4564565456",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)

    def test_end_upload_with_forged_stamp(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.classroom.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            (
                f"/api/classrooms/{self.classroom.pk}/classroomdocuments/"
                f"{self.classroom_document.pk}/upload-ended/"
            ),
            {
                "wrong_key": f"classroom/{self.classroom.pk}/classroom/crafted_stamp",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
