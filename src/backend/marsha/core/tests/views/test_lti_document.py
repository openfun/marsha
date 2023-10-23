"""Test the file LTI view."""
import html
import json
from logging import Logger
import random
import re
from unittest import mock
import uuid

from django.test import TestCase

from pylti.common import LTIException

from marsha.core.defaults import STATE_CHOICES
from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    ConsumerSiteLTIPassportFactory,
    DocumentFactory,
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    UploadedDocumentFactory,
    UserFactory,
)
from marsha.core.lti import LTI
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.tokens import PlaylistAccessToken, PlaylistRefreshToken
from marsha.core.tests.views.test_lti_base import BaseLTIViewForPortabilityTestCase


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class DocumentLTIViewTestCase(TestCase):
    """Test case for the file LTI view."""

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_document_instructor_same_playlist(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        document = DocumentFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
        )
        data = {
            "resource_link_id": document.lti_id,
            "context_id": document.playlist.lti_id,
            "roles": random.choice(["instructor", "administrator"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/documents/{document.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(document.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "documents")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_document_instructor_other_playlist(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the response returned by the view for an instructor from another playlist."""
        passport = ConsumerSiteLTIPassportFactory()
        document = DocumentFactory(
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=True,
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
        )
        other_playlist = PlaylistFactory(
            consumer_site=passport.consumer_site,
            lti_id="course-v1:amd+literature+00003",
        )
        data = {
            "resource_link_id": document.lti_id,
            "context_id": other_playlist.lti_id,
            "roles": random.choice(["instructor", "administrator"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/documents/{document.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(document.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": False},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "documents")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_document_student_with_video(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        document = DocumentFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
        )
        data = {
            "resource_link_id": document.lti_id,
            "context_id": document.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(f"/lti/documents/{document.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        PlaylistRefreshToken(context.get("refresh_token"))  # Must not raise
        self.assertEqual(jwt_token.payload["playlist_id"], str(document.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )

        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "documents")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_document_student_no_video(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the response returned for a student request when there is no file."""
        passport = ConsumerSiteLTIPassportFactory()
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/documents/{uuid.uuid4()}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        self.assertEqual(context.get("state"), "success")
        self.assertIsNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "documents")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_document_instructor_no_video(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the response returned for an instructor request when there is no file."""
        passport = ConsumerSiteLTIPassportFactory()
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/documents/{uuid.uuid4()}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        self.assertIsNotNone(context.get("jwt"))
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "documents")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(Logger, "warning")
    @mock.patch.object(LTI, "verify", side_effect=LTIException("lti error"))
    def test_views_lti_document_post_error(self, mock_verify, mock_logger):
        """Validate the response returned in case of an LTI exception."""
        role = random.choice(["instructor", "student"])
        data = {"resource_link_id": "123", "roles": role, "context_id": "abc"}
        response = self.client.post(f"/lti/documents/{uuid.uuid4()}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        mock_logger.assert_called_once_with("lti error")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        self.assertEqual(context.get("state"), "error")
        self.assertDictEqual(
            context.get("error"),
            {
                "message": "lti error",
                "status_code": None,
            },
        )
        self.assertIsNone(context.get("resource"))


class DocumentLTIViewForPortabilityTestCase(BaseLTIViewForPortabilityTestCase):
    """Test the document LTI view for portability."""

    expected_context_model_name = "documents"  # resource.RESOURCE_NAME

    def _get_lti_view_url(self, resource):
        """Return the LTI view URL for the provided document."""
        return f"/lti/documents/{resource.pk}"

    def test_views_lti_document_portability_for_playlist_without_owner(
        self,
    ):
        """
        Assert the application data does not provide portability information
        when playlist has no known owner
        and the authenticated user is an administrator or a teacher or a student.
        """
        document = UploadedDocumentFactory()

        self.assertLTIViewReturnsNoResourceForStudent(document)
        self.assertLTIViewReturnsErrorForAdminOrInstructor(document)

    def test_views_lti_document_portability_for_playlist_with_owner(self):
        """
        Assert the application data provides portability information
        when playlist has a creator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_with_owner = PlaylistFactory(
            created_by=UserFactory(),
        )
        document = UploadedDocumentFactory(playlist=playlist_with_owner)

        self.assertLTIViewReturnsNoResourceForStudent(document)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(document)

    def test_views_lti_document_portability_for_playlist_with_admin(self):
        """
        Assert the application data provides portability information
        when playlist has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_access_admin = PlaylistAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_admin = playlist_access_admin.playlist
        document = UploadedDocumentFactory(playlist=playlist_with_admin)

        self.assertLTIViewReturnsNoResourceForStudent(document)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(document)

    def test_views_lti_document_portability_for_playlist_with_organization_admin(
        self,
    ):
        """
        Assert the application data provides portability information
        when playlist's organization has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        organization_access_admin = OrganizationAccessFactory(role=ADMINISTRATOR)
        playlist_with_organization_admin = PlaylistFactory(
            organization=organization_access_admin.organization,
        )
        document = UploadedDocumentFactory(playlist=playlist_with_organization_admin)

        self.assertLTIViewReturnsNoResourceForStudent(document)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(document)

    def test_views_lti_document_portability_for_playlist_with_consumer_site_admin(
        self,
    ):
        """
        Assert the application data provides portability information
        when playlist's consumer site has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        consumer_site_access_admin = ConsumerSiteAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_consumer_site_admin = PlaylistFactory(
            consumer_site=consumer_site_access_admin.consumer_site,
        )
        document = UploadedDocumentFactory(playlist=playlist_with_consumer_site_admin)

        self.assertLTIViewReturnsNoResourceForStudent(document)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(document)
