"""Test the public document view."""
from html import unescape
import json
import random
import re
import uuid

from django.core.cache import cache
from django.test import TestCase

from marsha.core.simple_jwt.tokens import ResourceAccessToken, ResourceRefreshToken

from ..defaults import STATE_CHOICES
from ..factories import DocumentFactory, OrganizationFactory, PlaylistFactory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class DocumentPublicViewTestCase(TestCase):
    """Test the public document view in the ``core`` app of the Marsha project."""

    maxDiff = None

    def tearDown(self):
        super().tearDown()
        cache.clear()

    def test_document_publicly_accessible(self):
        """Validate to access to a public document."""
        document = DocumentFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c396",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site__domain="trusted_domain.com",
            is_public=True,
            title="document-001",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
        )

        # First response has no cache
        with self.assertNumQueries(6):
            response = self.client.get(f"/documents/{document.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertIn("Content-Security-Policy", response.headers)
        self.assertNotIn("X-Frame-Options", response.headers)
        self.assertEqual(
            response.headers["Content-Security-Policy"],
            "frame-ancestors trusted_domain.com *.trusted_domain.com;",
        )
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = ResourceAccessToken(context.get("jwt"))
        ResourceRefreshToken(context.get("refresh_token"))  # Must not raise

        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": "1569309880",
                "is_ready_to_show": True,
                "show_download": True,
                "id": str(document.id),
                "upload_state": document.upload_state,
                "title": document.title,
                "extension": None,
                "filename": "playlist-003_document-001",
                "playlist": {
                    "id": str(document.playlist.id),
                    "title": "playlist-003",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "url": (
                    "https://abc.cloudfront.net/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396"
                    "/document/1569309880?response-content-disposition=attachment%3B"
                    "+filename%3Dplaylist-003_document-001"
                ),
            },
        )
        self.assertEqual(context.get("modelName"), "documents")
        self.assertIsNone(context.get("context_id"))
        self.assertIsNone(context.get("consumer_site"))

        # The second response is cached, the header should not have need changed
        # and should still contains the CSP frame-ancestors
        with self.assertNumQueries(0):
            cached_response = self.client.get(f"/documents/{document.pk}")

        self.assertEqual(cached_response.status_code, 200)
        self.assertContains(cached_response, "<html>")
        self.assertIn("Content-Security-Policy", cached_response.headers)
        self.assertNotIn("X-Frame-Options", cached_response.headers)
        self.assertEqual(
            cached_response.headers["Content-Security-Policy"],
            "frame-ancestors trusted_domain.com *.trusted_domain.com;",
        )

    def test_public_document_without_consumer_site(self):
        """Public document without consumer site should have x-frame-options header"""
        organization = OrganizationFactory()
        playlist = PlaylistFactory(
            title="playlist-003",
            lti_id=None,
            organization=organization,
            consumer_site=None,
        )
        document = DocumentFactory(
            playlist=playlist,
            is_public=True,
            title="document-001",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
        )

        response = self.client.get(f"/documents/{document.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("Content-Security-Policy", response.headers)
        self.assertIn("X-Frame-Options", response.headers)
        self.assertEqual(response.headers["X-Frame-Options"], "DENY")
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = ResourceAccessToken(context.get("jwt"))
        ResourceRefreshToken(context.get("refresh_token"))  # Must not raise

        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("resource"),
            {
                "active_stamp": "1569309880",
                "is_ready_to_show": True,
                "show_download": True,
                "id": str(document.pk),
                "upload_state": document.upload_state,
                "title": document.title,
                "extension": None,
                "filename": "playlist-003_document-001",
                "playlist": {
                    "id": str(document.playlist.pk),
                    "title": "playlist-003",
                    "lti_id": None,
                },
                "url": (
                    f"https://abc.cloudfront.net/{document.pk}"
                    "/document/1569309880?response-content-disposition=attachment%3B"
                    "+filename%3Dplaylist-003_document-001"
                ),
            },
        )
        self.assertEqual(context.get("modelName"), "documents")
        self.assertIsNone(context.get("context_id"))
        self.assertIsNone(context.get("consumer_site"))

    def test_document_not_publicly_accessible(self):
        """Validate it is impossible to access to a non public document."""
        document = DocumentFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c396",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            is_public=False,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
        )

        response = self.client.get(f"/documents/{document.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))

        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("state"), "error")
        self.assertEqual(context.get("modelName"), "documents")

    def test_document_not_existing(self):
        """Accessing a non existing document should return an error state."""
        response = self.client.get(f"/documents/{uuid.uuid4()}")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))

        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("state"), "error")
        self.assertEqual(context.get("modelName"), "documents")
