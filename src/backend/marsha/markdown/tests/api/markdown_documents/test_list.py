"""Tests for the Markdown application list API."""

from django.test import TestCase, override_settings

from marsha.core.factories import (
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    UserFactory,
)
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    StudentLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.markdown.factories import MarkdownDocumentFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings(MARKDOWN_ENABLED=True)
class MarkdownListAPITest(TestCase):
    """Test for the Markdown document list API."""

    maxDiff = None

    def test_api_document_fetch_list_anonymous(self):
        """An anonymous should not be able to fetch a list of Markdown document."""
        response = self.client.get("/api/markdown-documents/")
        self.assertEqual(response.status_code, 401)

    def test_api_document_fetch_list_student(self):
        """A student should not be able to fetch a list of Markdown document."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = StudentLtiTokenFactory(
            playlist=markdown_document.playlist,
            permissions__can_update=True,
        )

        response = self.client.get(
            "/api/markdown-documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_fetch_list_instructor(self):
        """An instrustor should not be able to fetch a Markdown document list."""
        markdown_document = MarkdownDocumentFactory()

        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=markdown_document.playlist
        )

        response = self.client.get(
            "/api/markdown-documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 403)

    def test_api_document_fetch_list_user_access_token_playlist_admin(self):
        """
        A user with UserAccessToken should be able to fetch markdown documents list from playlist
        he is admin.
        """
        playlist_access = PlaylistAccessFactory(role=ADMINISTRATOR)
        markdown_documents = MarkdownDocumentFactory.create_batch(
            3, playlist=playlist_access.playlist
        )
        MarkdownDocumentFactory()

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            "/api/markdown-documents/?limit=2", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        first_translation = markdown_documents[2].translations.first()
        second_translation = markdown_documents[1].translations.first()
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": "http://testserver/api/markdown-documents/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "id": str(markdown_documents[2].id),
                        "playlist": {
                            "id": str(playlist_access.playlist.id),
                            "lti_id": playlist_access.playlist.lti_id,
                            "title": playlist_access.playlist.title,
                        },
                        "images": [],
                        "is_draft": True,
                        "rendering_options": {},
                        "translations": [
                            {
                                "language_code": first_translation.language_code,
                                "title": first_translation.title,
                                "content": first_translation.content,
                                "rendered_content": first_translation.rendered_content,
                            }
                        ],
                        "position": 0,
                    },
                    {
                        "id": str(markdown_documents[1].id),
                        "playlist": {
                            "id": str(playlist_access.playlist.id),
                            "lti_id": playlist_access.playlist.lti_id,
                            "title": playlist_access.playlist.title,
                        },
                        "images": [],
                        "is_draft": True,
                        "rendering_options": {},
                        "translations": [
                            {
                                "language_code": second_translation.language_code,
                                "title": second_translation.title,
                                "content": second_translation.content,
                                "rendered_content": second_translation.rendered_content,
                            }
                        ],
                        "position": 0,
                    },
                ],
            },
        )

    def test_api_document_fetch_list_user_access_token_organization_admin(self):
        """A user with UserAccessToken should be able to fetch a markdown documents list."""
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        organization_access = OrganizationAccessFactory(
            user=organization_access_admin.user
        )
        playlist_1_a = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_1_b = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_2_a = PlaylistFactory(organization=organization_access.organization)
        playlist_2_b = PlaylistFactory(organization=organization_access.organization)
        MarkdownDocumentFactory.create_batch(3, playlist=playlist_1_a)
        markdown_document_1_b = MarkdownDocumentFactory.create_batch(
            3, playlist=playlist_1_b
        )
        MarkdownDocumentFactory.create_batch(3, playlist=playlist_2_a)
        MarkdownDocumentFactory.create_batch(3, playlist=playlist_2_b)
        MarkdownDocumentFactory()

        jwt_token = UserAccessTokenFactory(user=organization_access_admin.user)

        response = self.client.get(
            "/api/markdown-documents/?limit=2", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )

        self.assertEqual(response.status_code, 200)
        first_translation = markdown_document_1_b[2].translations.first()
        second_translation = markdown_document_1_b[1].translations.first()
        self.assertEqual(
            response.json(),
            {
                "count": 6,
                "next": "http://testserver/api/markdown-documents/?limit=2&offset=2",
                "previous": None,
                "results": [
                    {
                        "id": str(markdown_document_1_b[2].id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "images": [],
                        "is_draft": True,
                        "rendering_options": {},
                        "translations": [
                            {
                                "language_code": first_translation.language_code,
                                "title": first_translation.title,
                                "content": first_translation.content,
                                "rendered_content": first_translation.rendered_content,
                            }
                        ],
                        "position": 0,
                    },
                    {
                        "id": str(markdown_document_1_b[1].id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "images": [],
                        "is_draft": True,
                        "rendering_options": {},
                        "translations": [
                            {
                                "language_code": second_translation.language_code,
                                "title": second_translation.title,
                                "content": second_translation.content,
                                "rendered_content": second_translation.rendered_content,
                            }
                        ],
                        "position": 0,
                    },
                ],
            },
        )

    def test_api_document_fetch_list_user_access_token_not_duplicated(self):
        """
        The markdown documents list must not return duplicated values
        for a user with UserAccessToken and proper rights.
        """
        user = UserFactory()

        organization_access = OrganizationAccessFactory(
            user=user,
            role=ADMINISTRATOR,
        )
        OrganizationAccessFactory.create_batch(
            5, organization=organization_access.organization
        )

        playlist = PlaylistFactory(organization=organization_access.organization)

        playlist_access = PlaylistAccessFactory(
            user=user,
            playlist=playlist,
            role=ADMINISTRATOR,
        )
        PlaylistAccessFactory.create_batch(5, playlist=playlist)

        markdown_document = MarkdownDocumentFactory(
            playlist=playlist,
        )

        jwt_token = UserAccessTokenFactory(user=playlist_access.user)

        response = self.client.get(
            "/api/markdown-documents/", HTTP_AUTHORIZATION=f"Bearer {jwt_token}"
        )
        self.assertEqual(response.status_code, 200)
        mardown_translation = markdown_document.translations.first()

        self.assertEqual(
            response.json(),
            {
                "count": 1,
                "next": None,
                "previous": None,
                "results": [
                    {
                        "id": str(markdown_document.id),
                        "playlist": {
                            "id": str(playlist.id),
                            "lti_id": playlist.lti_id,
                            "title": playlist.title,
                        },
                        "images": [],
                        "is_draft": True,
                        "rendering_options": {},
                        "translations": [
                            {
                                "language_code": mardown_translation.language_code,
                                "title": mardown_translation.title,
                                "content": mardown_translation.content,
                                "rendered_content": mardown_translation.rendered_content,
                            }
                        ],
                        "position": 0,
                    },
                ],
            },
        )

    def test_api_document_fetch_list_user_access_token_filter_organization(self):
        """
        A user with UserAccessToken should be able to filter markdown documents list
        by organization.
        """
        organization_access_admin_1 = OrganizationAccessFactory(role=ADMINISTRATOR)
        organization_access_admin_2 = OrganizationAccessFactory(
            user=organization_access_admin_1.user, role=ADMINISTRATOR
        )
        playlist_1_a = PlaylistFactory(
            organization=organization_access_admin_1.organization
        )
        playlist_1_b = PlaylistFactory(
            organization=organization_access_admin_1.organization
        )
        playlist_2_a = PlaylistFactory(
            organization=organization_access_admin_2.organization
        )
        playlist_2_b = PlaylistFactory(
            organization=organization_access_admin_2.organization
        )
        MarkdownDocumentFactory.create_batch(3, playlist=playlist_1_a)
        MarkdownDocumentFactory.create_batch(3, playlist=playlist_1_b)
        MarkdownDocumentFactory.create_batch(3, playlist=playlist_2_a)
        markdown_document_2_b = MarkdownDocumentFactory.create_batch(
            3, playlist=playlist_2_b
        )
        MarkdownDocumentFactory()

        jwt_token = UserAccessTokenFactory(user=organization_access_admin_1.user)

        response = self.client.get(
            "/api/markdown-documents/?limit=2"
            f"&organization={organization_access_admin_2.organization.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        first_translation = markdown_document_2_b[2].translations.first()
        second_translation = markdown_document_2_b[1].translations.first()
        self.assertEqual(
            response.json(),
            {
                "count": 6,
                "next": (
                    "http://testserver/api/markdown-documents/"
                    f"?limit=2&offset=2&organization={organization_access_admin_2.organization.id}"
                ),
                "previous": None,
                "results": [
                    {
                        "id": str(markdown_document_2_b[2].id),
                        "playlist": {
                            "id": str(playlist_2_b.id),
                            "lti_id": playlist_2_b.lti_id,
                            "title": playlist_2_b.title,
                        },
                        "images": [],
                        "is_draft": True,
                        "rendering_options": {},
                        "translations": [
                            {
                                "language_code": first_translation.language_code,
                                "title": first_translation.title,
                                "content": first_translation.content,
                                "rendered_content": first_translation.rendered_content,
                            }
                        ],
                        "position": 0,
                    },
                    {
                        "id": str(markdown_document_2_b[1].id),
                        "playlist": {
                            "id": str(playlist_2_b.id),
                            "lti_id": playlist_2_b.lti_id,
                            "title": playlist_2_b.title,
                        },
                        "images": [],
                        "is_draft": True,
                        "rendering_options": {},
                        "translations": [
                            {
                                "language_code": second_translation.language_code,
                                "title": second_translation.title,
                                "content": second_translation.content,
                                "rendered_content": second_translation.rendered_content,
                            }
                        ],
                        "position": 0,
                    },
                ],
            },
        )

    def test_api_document_fetch_list_user_access_token_filter_playlist(self):
        """
        A user with UserAccessToken should be able to filter markdown documents list
        by playlist.
        """
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        organization_access = OrganizationAccessFactory(
            user=organization_access_admin.user
        )
        playlist_1_a = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_1_b = PlaylistFactory(
            organization=organization_access_admin.organization
        )
        playlist_2_a = PlaylistFactory(organization=organization_access.organization)
        playlist_2_b = PlaylistFactory(organization=organization_access.organization)
        MarkdownDocumentFactory.create_batch(3, playlist=playlist_1_a)
        markdown_document_1_b = MarkdownDocumentFactory.create_batch(
            3, playlist=playlist_1_b
        )
        MarkdownDocumentFactory.create_batch(3, playlist=playlist_2_a)
        MarkdownDocumentFactory.create_batch(3, playlist=playlist_2_b)
        MarkdownDocumentFactory()

        jwt_token = UserAccessTokenFactory(user=organization_access_admin.user)

        response = self.client.get(
            f"/api/markdown-documents/?limit=2&playlist={playlist_1_b.id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        first_translation = markdown_document_1_b[2].translations.first()
        second_translation = markdown_document_1_b[1].translations.first()
        self.assertEqual(
            response.json(),
            {
                "count": 3,
                "next": (
                    "http://testserver/api/markdown-documents/"
                    f"?limit=2&offset=2&playlist={playlist_1_b.id}"
                ),
                "previous": None,
                "results": [
                    {
                        "id": str(markdown_document_1_b[2].id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "images": [],
                        "is_draft": True,
                        "rendering_options": {},
                        "translations": [
                            {
                                "language_code": first_translation.language_code,
                                "title": first_translation.title,
                                "content": first_translation.content,
                                "rendered_content": first_translation.rendered_content,
                            }
                        ],
                        "position": 0,
                    },
                    {
                        "id": str(markdown_document_1_b[1].id),
                        "playlist": {
                            "id": str(playlist_1_b.id),
                            "lti_id": playlist_1_b.lti_id,
                            "title": playlist_1_b.title,
                        },
                        "images": [],
                        "is_draft": True,
                        "rendering_options": {},
                        "translations": [
                            {
                                "language_code": second_translation.language_code,
                                "title": second_translation.title,
                                "content": second_translation.content,
                                "rendered_content": second_translation.rendered_content,
                            }
                        ],
                        "position": 0,
                    },
                ],
            },
        )
