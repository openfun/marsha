"""Tests for the markdown image upload ended API of the Marsha project."""

from django.test import TestCase

from marsha.core import factories, models
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.markdown.factories import MarkdownDocumentFactory, MarkdownImageFactory


class MarkdownImageUploadEndedAPITest(TestCase):
    """Test the "upload-ended" API of the markdown image object."""

    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.organization = factories.OrganizationFactory()
        cls.markdown_document = MarkdownDocumentFactory(
            playlist__organization=cls.organization
        )
        cls.markdown_image = MarkdownImageFactory(
            upload_state="pending",
            markdown_document=cls.markdown_document,
        )

    def assert_user_cannot_end_an_upload(
        self, markdown_document, markdown_image, token
    ):
        """Assert the user cannot end an upload."""

        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/markdown-images/"
            f"{markdown_image.pk}/upload-ended/",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 403, response.json())

    def assert_user_can_end_an_upload(self, markdown_document, markdown_image, token):
        """Assert the user can end an upload."""
        response = self.client.post(
            f"/api/markdown-documents/{markdown_document.pk}/markdown-images/"
            f"{markdown_image.pk}/upload-ended/",
            {
                "file_key": f"markdowndocument/{markdown_document.pk}/"
                f"markdownimage/{markdown_image.pk}/4564565456",
            },
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200, response.json())

    def test_end_upload_by_anonymous_user(self):
        """Anonymous users cannot end an upload."""
        response = self.client.post(
            f"/api/markdown-documents/{self.markdown_document.pk}/"
            f"markdown-images/{self.markdown_image.pk}/upload-ended/"
        )

        self.assertEqual(response.status_code, 401, response.json())

    def test_end_upload_by_random_user(self):
        """Authenticated user without access cannot end an upload."""
        user = factories.UserFactory()

        jwt_token = UserAccessTokenFactory(user=user)
        self.assert_user_cannot_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_by_organization_student(self):
        """Organization students cannot end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.STUDENT,
        )

        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_cannot_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_by_organization_instructor(self):
        """Organization instructors cannot end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.INSTRUCTOR,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_cannot_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_by_organization_administrator(self):
        """Organization administrators can end an upload."""
        organization_access = factories.OrganizationAccessFactory(
            organization=self.organization,
            role=models.ADMINISTRATOR,
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)
        self.assert_user_can_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_by_consumer_site_any_role(self):
        """Consumer site roles cannot end an upload."""
        consumer_site_access = factories.ConsumerSiteAccessFactory(
            consumer_site=self.markdown_document.playlist.consumer_site,
        )

        jwt_token = UserAccessTokenFactory(user=consumer_site_access.user)
        self.assert_user_cannot_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_by_playlist_student(self):
        """Playlist student cannot end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.markdown_document.playlist,
            role=models.STUDENT,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_cannot_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_by_lti_student(self):
        """Lti student cannot end an upload."""
        jwt_token = StudentLtiTokenFactory(playlist=self.markdown_document.playlist)

        self.assert_user_cannot_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_by_playlist_instructor(self):
        """Playlist instructor cannot end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.markdown_document.playlist,
            role=models.INSTRUCTOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_cannot_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_by_lti_instructor(self):
        """Playlist instructor cannot end an upload."""
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=self.markdown_document.playlist
        )

        self.assert_user_can_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_by_playlist_admin(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.markdown_document.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        self.assert_user_can_end_an_upload(
            self.markdown_document, self.markdown_image, jwt_token
        )

    def test_end_upload_with_wrong_body(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.markdown_document.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            f"/api/markdown-documents/{self.markdown_document.pk}/markdown-images/"
            f"{self.markdown_image.pk}/upload-ended/",
            {
                "wrong_key": f"source/{self.markdown_document.pk}/thumbnail/4564565456",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400, response.json())

    def test_end_upload_with_forged_path(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.markdown_document.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            f"/api/markdown-documents/{self.markdown_document.pk}/markdown-images/"
            f"{self.markdown_image.pk}/upload-ended/",
            {
                "file_key": f"tmp/{self.markdown_document.pk}/crafted/4564565456",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400, response.json())

    def test_end_upload_with_forged_stamp(self):
        """Playlist administrator can end an upload."""
        playlist_access = factories.PlaylistAccessFactory(
            playlist=self.markdown_document.playlist,
            role=models.ADMINISTRATOR,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)
        response = self.client.post(
            f"/api/markdown-documents/{self.markdown_document.pk}/markdown-images/"
            f"{self.markdown_image.pk}/upload-ended/",
            {
                "wrong_key": f"tmp/{self.markdown_document.pk}/markdown-images/crafted_stamp",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400, response.json())
