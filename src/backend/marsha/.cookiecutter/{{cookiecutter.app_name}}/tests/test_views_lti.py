"""Test the file LTI view."""
import html
import json
import random
import re
from unittest import mock
import uuid

from django.test import TestCase, override_settings

from rest_framework_simplejwt.tokens import AccessToken

from marsha.core.factories import ConsumerSiteLTIPassportFactory
from marsha.core.lti import LTI

from ..factories import {{cookiecutter.model}}Factory


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


@override_settings({{cookiecutter.setting_name}}=True)
class {{cookiecutter.model}}LTIViewTestCase(TestCase):
    """Test case for the file LTI view."""

    maxDiff = None

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_{{cookiecutter.model_lower}}_student(self, mock_get_consumer_site, mock_verify):
        """Validate the response returned for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": {{cookiecutter.model_lower}}.lti_id,
            "context_id": {{cookiecutter.model_lower}}.playlist.lti_id,
            "roles": ["student"],
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "{{cookiecutter.model_plural_lower}}")
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "username": "jane_doe",
                "user_fullname": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
            },
        )
        self.assertTrue(context.get("flags").get("{{ cookiecutter.app_name }}"))

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_{{cookiecutter.model_lower}}_instructor_no_{{cookiecutter.model_lower}}(
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

        response = self.client.post(f"/lti/{{cookiecutter.model_url_part}}/{uuid.uuid4()}", data)
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
        self.assertEqual(context.get("modelName"), "{{cookiecutter.model_plural_lower}}")

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_{{cookiecutter.model_lower}}_instructor_same_playlist(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": {{cookiecutter.model_lower}}.lti_id,
            "context_id": {{cookiecutter.model_lower}}.playlist.lti_id,
            "roles": random.choice(["instructor", "administrator"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        response = self.client.post(f"/lti/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str({{cookiecutter.model_lower}}.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "username": "jane_doe",
                "user_fullname": None,
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
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(
            {
                "id": str({{cookiecutter.model_lower}}.id),
                "lti_id": str({{cookiecutter.model_lower}}.lti_id),
                "playlist": {
                    "id": str({{cookiecutter.model_lower}}.playlist_id),
                    "lti_id": str({{cookiecutter.model_lower}}.playlist.lti_id),
                    "title": {{cookiecutter.model_lower}}.playlist.title,
                },
                "title": {{cookiecutter.model_lower}}.title,
                "description": {{cookiecutter.model_lower}}.description,
            },
            context.get("resource"),
        )
        self.assertEqual(context.get("modelName"), "{{cookiecutter.model_plural_lower}}")
        self.assertEqual(context.get("appName"), "{{cookiecutter.app_name}}")
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    def test_views_lti_{{cookiecutter.model_lower}}_get_request(
        self,
    ):
        """LTI GET request should not be allowed."""
        passport = ConsumerSiteLTIPassportFactory()
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
        )

        response = self.client.get(f"/lti/{{cookiecutter.model_url_part}}/{ {{cookiecutter.model_lower}}.id}")

        self.assertEqual(response.status_code, 405)
