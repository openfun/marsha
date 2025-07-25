"""Test the public document view."""

from html import unescape
import json
import random
import re
import uuid

from django.core.cache import cache
from django.test import TestCase, override_settings

from marsha.core.defaults import AWS_S3, SCW_S3, STATE_CHOICES
from marsha.core.factories import DocumentFactory, OrganizationFactory, PlaylistFactory
from marsha.core.simple_jwt.tokens import PlaylistAccessToken, PlaylistRefreshToken


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class DocumentPublicViewTestCase(TestCase):
    """Test the public document view in the ``core`` app of the Marsha project."""

    maxDiff = None

    def tearDown(self):
        super().tearDown()
        cache.clear()

    @override_settings(MEDIA_URL="https://abc.svc.edge.scw.cloud/")
    def test_document_publicly_accessible_on_aws(self):
        """Validate to access to a public document."""
        document = DocumentFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c396",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site__domain="trusted_domain.com",
            is_public=True,
            title="document-001",
            filename="document-001.pdf",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
            storage_location=AWS_S3,
        )

        # First response has no cache
        with self.assertNumQueries(11):
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
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise

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
                "filename": "document-001.pdf",
                "playlist": {
                    "id": str(document.playlist.id),
                    "title": "playlist-003",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "url": (
                    "https://abc.svc.edge.scw.cloud/aws/301b5f4f-b9f1-4a5f-897d-f8f1bf22c396"
                    "/document/document-001.pdf"
                ),
            },
        )
        self.assertEqual(context.get("modelName"), "documents")
        self.assertIsNone(context.get("context_id"))
        self.assertIsNone(context.get("consumer_site"))

        # The second response is cached, the header should not have need changed
        # and should still contain the CSP frame-ancestors
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

    @override_settings(MEDIA_URL="https://abc.svc.edge.scw.cloud/")
    def test_document_publicly_accessible_on_scw(self):
        """Validate to access to a public document."""
        document = DocumentFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c396",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site__domain="trusted_domain.com",
            is_public=True,
            title="document-001",
            filename="foo.pdf",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
            storage_location=SCW_S3,
        )

        # First response has no cache
        with self.assertNumQueries(11):
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
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise

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
                "filename": "foo.pdf",
                "playlist": {
                    "id": str(document.playlist.id),
                    "title": "playlist-003",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "url": (
                    "https://abc.svc.edge.scw.cloud/document/"
                    "301b5f4f-b9f1-4a5f-897d-f8f1bf22c396/foo.pdf"
                ),
            },
        )
        self.assertEqual(context.get("modelName"), "documents")
        self.assertIsNone(context.get("context_id"))
        self.assertIsNone(context.get("consumer_site"))

        # The second response is cached, the header should not have need changed
        # and should still contain the CSP frame-ancestors
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

    @override_settings(MEDIA_URL="https://abc.svc.edge.scw.cloud/")
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
            filename="document-001.pdf",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
            storage_location=AWS_S3,
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
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise

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
                "filename": "document-001.pdf",
                "playlist": {
                    "id": str(document.playlist.pk),
                    "title": "playlist-003",
                    "lti_id": None,
                },
                "url": (
                    f"https://abc.svc.edge.scw.cloud/aws/{document.pk}"
                    "/document/document-001.pdf"
                ),
            },
        )
        self.assertEqual(context.get("modelName"), "documents")
        self.assertIsNone(context.get("context_id"))
        self.assertIsNone(context.get("consumer_site"))

    def test_document_not_publicly_accessible(self):
        """Validate it is impossible to access to a non-public document."""
        document = DocumentFactory(
            id="301b5f4f-b9f1-4a5f-897d-f8f1bf22c396",
            playlist__title="playlist-003",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            is_public=False,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
            storage_location=AWS_S3,
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
        self.assertDictEqual(
            context.get("error"),
            {
                "message": "Document matching query does not exist.",
                "status_code": None,
            },
        )
        self.assertEqual(context.get("modelName"), "documents")

    def test_document_not_existing(self):
        """Accessing a non-existing document should return an error state."""
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
        self.assertDictEqual(
            context.get("error"),
            {
                "message": "Document matching query does not exist.",
                "status_code": None,
            },
        )
        self.assertEqual(context.get("modelName"), "documents")
