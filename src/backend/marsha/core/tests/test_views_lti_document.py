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
from rest_framework_simplejwt.tokens import AccessToken

from ..defaults import STATE_CHOICES
from ..factories import ConsumerSiteLTIPassportFactory, DocumentFactory, PlaylistFactory
from ..lti import LTI


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
        response = self.client.post("/lti/documents/{!s}".format(document.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(document.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "username": "jane_doe",
                "id": "56255f3807599c377bf0e5bf072359fd",
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
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
            lti_id="course-v1:amd+litterature+00003",
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
        response = self.client.post("/lti/documents/{!s}".format(document.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(document.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "username": "jane_doe",
                "id": "56255f3807599c377bf0e5bf072359fd",
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": False},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "amd", "course_name": "litterature", "course_run": "00003"},
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
        response = self.client.post("/lti/documents/{!s}".format(document.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(document.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "username": "jane_doe",
                "id": "56255f3807599c377bf0e5bf072359fd",
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertDictEqual(
            jwt_token.payload["course"],
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
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

        response = self.client.post("/lti/documents/{!s}".format(uuid.uuid4()), data)
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

        response = self.client.post("/lti/documents/{!s}".format(uuid.uuid4()), data)
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
        response = self.client.post("/lti/documents/{!s}".format(uuid.uuid4()), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        mock_logger.assert_called_once_with("lti error")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        self.assertEqual(context.get("state"), "error")
        self.assertIsNone(context.get("resource"))
