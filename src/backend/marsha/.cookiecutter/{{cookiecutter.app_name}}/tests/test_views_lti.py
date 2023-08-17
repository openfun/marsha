"""Test the file LTI view."""
import html
import json
import random
import re
from unittest import mock
import uuid

from django.test import TestCase, override_settings

from marsha.core.factories import (
    ConsumerSiteAccessFactory,
    ConsumerSiteLTIPassportFactory,
    OrganizationAccessFactory,
    PlaylistAccessFactory,
    PlaylistFactory,
    UserFactory,
)
from marsha.core.lti import LTI
from marsha.core.models import ADMINISTRATOR
from marsha.core.simple_jwt.tokens import PlaylistAccessToken
from marsha.core.tests.test_views_lti_base import BaseLTIViewForPortabilityTestCase

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
        jwt_token = PlaylistAccessToken(context.get("jwt"))
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
        jwt_token = PlaylistAccessToken(context.get("jwt"))
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


class {{cookiecutter.model}}LTIViewForPortabilityTestCase(BaseLTIViewForPortabilityTestCase):
    """Test the {{cookiecutter.model_lower}} LTI view for portability."""

    expected_context_model_name = "{{cookiecutter.model_plural_lower}}"  # resource.RESOURCE_NAME

    def _get_lti_view_url(self, resource):
        """Return the LTI view URL for the provided {{cookiecutter.model_lower}}."""
        return f"/lti/{{cookiecutter.model_plural_lower}}/{resource.pk}"

    def test_views_lti_{{cookiecutter.model_lower}}_portability_for_playlist_without_owner(
        self,
    ):
        """
        Assert the application data does not provide portability information
        when playlist has no known owner
        and the authenticated user is an administrator or a teacher or a student.
        """
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory()

        self.assertLTIViewReturnsNoResourceForStudent({{cookiecutter.model_lower}})
        self.assertLTIViewReturnsErrorForAdminOrInstructor({{cookiecutter.model_lower}})

    def test_views_lti_{{cookiecutter.model_lower}}_portability_for_playlist_with_owner(self):
        """
        Assert the application data provides portability information
        when playlist has a creator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_with_owner = PlaylistFactory(
            created_by=UserFactory(),
        )
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory(playlist=playlist_with_owner)

        self.assertLTIViewReturnsNoResourceForStudent({{cookiecutter.model_lower}})
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor({{cookiecutter.model_lower}})

    def test_views_lti_{{cookiecutter.model_lower}}_portability_for_playlist_with_admin(self):
        """
        Assert the application data provides portability information
        when playlist has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_access_admin = PlaylistAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_admin = playlist_access_admin.playlist
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory(playlist=playlist_with_admin)

        self.assertLTIViewReturnsNoResourceForStudent({{cookiecutter.model_lower}})
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor({{cookiecutter.model_lower}})

    def test_views_lti_{{cookiecutter.model_lower}}_portability_for_playlist_with_organization_admin(
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
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory(playlist=playlist_with_organization_admin)

        self.assertLTIViewReturnsNoResourceForStudent({{cookiecutter.model_lower}})
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor({{cookiecutter.model_lower}})

    def test_views_lti_{{cookiecutter.model_lower}}_portability_for_playlist_with_consumer_site_admin(
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
        {{cookiecutter.model_lower}} = {{cookiecutter.model}}Factory(playlist=playlist_with_consumer_site_admin)

        self.assertLTIViewReturnsNoResourceForStudent({{cookiecutter.model_lower}})
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor({{cookiecutter.model_lower}})
