"""Test the file LTI view."""
from logging import Logger
import random
import re
from unittest import mock
import uuid

from django.test import TestCase

from pylti.common import LTIException
from rest_framework_simplejwt.tokens import AccessToken

from ..factories import ConsumerSiteLTIPassportFactory, FileFactory
from ..lti import LTI


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class FileViewTestCase(TestCase):
    """Test case for the file LTI view."""

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_file_view_instructor(self, mock_get_consumer_site, mock_verify):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        file_to_test = FileFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": file_to_test.lti_id,
            "context_id": file_to_test.playlist.lti_id,
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/files/{!s}".format(file_to_test.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        # Extract the JWT Token and state
        match = re.search(
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )
        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertEqual(jwt_token.payload["resource_id"], str(file_to_test.id))

        data_state = match.group(2)
        self.assertEqual(data_state, "instructor")

        # Extract the file data
        data_file = re.search(
            '<div class="marsha-frontend-data" id="file" data-file="(.*)">', content
        ).group(1)

        self.assertIsNotNone(data_file)
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_file_view_student(self, mock_get_consumer_site, mock_verify):
        """Validate the format of the response returned by the view for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        file_to_test = FileFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            upload_state="ready",
        )
        data = {
            "resource_link_id": file_to_test.lti_id,
            "context_id": file_to_test.playlist.lti_id,
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post("/lti/files/{!s}".format(file_to_test.pk), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        # Extract the JWT Token and state
        match = re.search(
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )
        data_jwt = match.group(1)
        jwt_token = AccessToken(data_jwt)
        self.assertEqual(jwt_token.payload["resource_id"], str(file_to_test.id))

        data_state = match.group(2)
        self.assertEqual(data_state, "student")

        # Extract the file data
        data_file = re.search(
            '<div class="marsha-frontend-data" id="file" data-file="(.*)">', content
        ).group(1)

        self.assertIsNotNone(data_file)
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_file_view_student_no_video(self, mock_get_consumer_site, mock_verify):
        """Validate the response returned for a student request when there is no file."""
        passport = ConsumerSiteLTIPassportFactory()
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "student",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post("/lti/files/{!s}".format(uuid.uuid4()), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        data_state = re.search(
            '<div class="marsha-frontend-data" data-state="(.*)">', content
        ).group(1)
        self.assertEqual(data_state, "student")

        data_file = re.search(
            '<div class="marsha-frontend-data" id="file" data-file="(.*)">', content
        ).group(1)
        self.assertEqual(data_file, "null")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_file_view_instructor_no_video(self, mock_get_consumer_site, mock_verify):
        """Validate the response returned for an instructor request when there is no file."""
        passport = ConsumerSiteLTIPassportFactory()
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post("/lti/files/{!s}".format(uuid.uuid4()), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        print(content)

        data_state = re.search(
            '<div class="marsha-frontend-data" data-jwt="(.*)" data-state="(.*)">',
            content,
        )
        self.assertIsNotNone(data_state.group(1))
        self.assertEqual(data_state.group(2), "instructor")

        data_file = re.search(
            '<div class="marsha-frontend-data" id="file" data-file="(.*)">', content
        ).group(1)
        self.assertNotEqual(data_file, "null")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(Logger, "warning")
    @mock.patch.object(LTI, "verify", side_effect=LTIException("lti error"))
    def test_file_view_lti_post_error(self, mock_verify, mock_logger):
        """Validate the response returned in case of an LTI exception."""
        role = random.choice(["instructor", "student"])
        data = {"resource_link_id": "123", "roles": role, "context_id": "abc"}
        response = self.client.post("/lti/files/{!s}".format(uuid.uuid4()), data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        mock_logger.assert_called_once_with("LTI Exception: %s", "lti error")

        data_state = re.search(
            '<div class="marsha-frontend-data" data-state="(.*)">', content
        ).group(1)
        self.assertEqual(data_state, "error")

        data_file = re.search(
            '<div class="marsha-frontend-data" id="file" data-file="(.*)">', content
        ).group(1)
        self.assertEqual(data_file, "null")
