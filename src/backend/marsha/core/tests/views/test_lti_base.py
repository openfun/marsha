"""Module providing base classes for LTI views tests."""
from html import unescape
import json
import random
import re
from unittest import mock
from urllib.parse import parse_qs, urlparse

from django.test import TestCase, override_settings

from waffle.testutils import override_switch

from marsha.core.defaults import SENTRY
from marsha.core.factories import (
    ConsumerSiteLTIPassportFactory,
    LtiUserAssociationFactory,
    PortabilityRequestFactory,
)
from marsha.core.lti import LTI
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT, Playlist
from marsha.core.simple_jwt.tokens import LTIUserToken, PlaylistAccessToken


@override_settings(SENTRY_DSN="https://sentry.dsn")
@override_settings(RELEASE="1.2.3")
@override_settings(VIDEO_PLAYER="videojs")
@override_settings(ATTENDANCE_PUSH_DELAY=10)
@override_switch(SENTRY, active=True)
class BaseLTIViewForPortabilityTestCase(TestCase):
    """Base test case for the LTI view for portability."""

    lti_user_id = "56255f3807599c377bf0e5bf072359fd"
    lti_username = "jane_doe"
    lti_user_email = "jane@test-mooc.fr"

    expected_context_model_name = None  # To be overridden in subclass

    @classmethod
    def setUpClass(cls):
        """Set up the test suite: create an LTI passport once for all tests."""
        super().setUpClass()
        cls.passport = ConsumerSiteLTIPassportFactory()

    def assertContextCommonValuesAreWellDefined(self, context):
        """
        Assert common values in the context are properly defined.
        This is not related to the portability feature.
        """
        self.assertEqual(context.get("sentry_dsn"), "https://sentry.dsn")
        self.assertEqual(context.get("environment"), "test")
        self.assertEqual(context.get("release"), "1.2.3")
        self.assertEqual(context.get("player"), "videojs")
        self.assertEqual(context.get("attendanceDelay"), 10 * 1000)
        self.assertFalse(context.get("flags").get("live_raw"))
        self.assertTrue(context.get("flags").get("sentry"))
        self.assertContextContainsStatic(context)

    def assertContextContainsStatic(self, context):
        """Assert the context contains the static URLs."""
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                },
            },
        )

    def assertPlaylistJWTCommonValuesAreWellDefined(self, jwt_token, lti_role):
        """Assert common values in the JWT token are properly defined."""
        self.assertEqual(jwt_token.payload["context_id"], "other:lti:context")
        self.assertEqual(
            jwt_token.payload["consumer_site"], str(self.passport.consumer_site.id)
        )
        self.assertEqual(jwt_token.payload["roles"], [lti_role])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},  # important
        )
        self.assertDictEqual(
            jwt_token.payload["user"],
            {
                "email": self.lti_user_email,
                "id": self.lti_user_id,
                "username": self.lti_username,
                "user_fullname": None,
            },
        )

    def assertUserAssociationTokenIsValid(self, association_token_str):
        """Assert the LTI user/Site user association token is valid."""
        association_token = LTIUserToken(association_token_str)
        self.assertEqual(
            association_token["lti_consumer_site_id"],
            str(self.passport.consumer_site.id),
        )
        self.assertEqual(
            association_token["lti_user_id"],
            self.lti_user_id,
        )

    def assertLTIViewReturnsPortabilityContextForAdminOrInstructor(
        self, resource, frontend_home_url="http://localhost:3000"
    ):
        """Assert the LTI view returns the portability context for an admin or an instructor."""
        lti_role = random.choice((INSTRUCTOR, ADMINISTRATOR))

        lti_data = self._get_lti_data(resource, lti_role)
        response = self._client_post_on_resource_lti_view(resource, lti_data)
        context = self._get_context_from_response(response)

        self.assertEqual(context["state"], "portability")
        self.assertNotIn("resource", context)
        self.assertEqual(context["modelName"], self.expected_context_model_name)
        self.assertFalse(context["portability"]["portability_request_exists"])
        self.assertEqual(
            context["portability"]["for_playlist_id"], str(resource.playlist.id)
        )
        self.assertEqual(context["frontend_home_url"], frontend_home_url)

        # Test user association token
        parsed_redirect_to_url = urlparse(context["portability"]["redirect_to"])
        self.assertEqual(
            parsed_redirect_to_url.netloc, urlparse(frontend_home_url).netloc
        )
        self.assertEqual(parsed_redirect_to_url.path, "/portability-requests/pending/")

        association_token_str = parse_qs(parsed_redirect_to_url.query)[
            "association_jwt"
        ][0]
        self.assertUserAssociationTokenIsValid(association_token_str)

        # Test common context
        self.assertContextCommonValuesAreWellDefined(context)

        newly_create_playlist = Playlist.objects.get(lti_id="other:lti:context")

        jwt_token = PlaylistAccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["playlist_id"], "")  # important
        self.assertEqual(
            jwt_token.payload["port_to_playlist_id"], str(newly_create_playlist.id)
        )

        # Test common JWT attributes
        self.assertPlaylistJWTCommonValuesAreWellDefined(jwt_token, lti_role)

        # Test context when portability already exists and user is already associated
        PortabilityRequestFactory(
            for_playlist=resource.playlist,
            from_playlist=newly_create_playlist,
        )
        LtiUserAssociationFactory(
            consumer_site=self.passport.consumer_site,
            lti_user_id=self.lti_user_id.upper(),
        )

        response = self._client_post_on_resource_lti_view(resource, lti_data)
        context = self._get_context_from_response(response)

        self.assertEqual(context["state"], "portability")
        self.assertNotIn("resource", context)
        self.assertEqual(context["modelName"], self.expected_context_model_name)
        self.assertTrue(
            context["portability"]["portability_request_exists"]
        )  # important
        self.assertEqual(
            context["portability"]["for_playlist_id"], str(resource.playlist.id)
        )

        # Test user association token is not present
        parsed_redirect_to_url = urlparse(context["portability"]["redirect_to"])
        self.assertEqual(
            parsed_redirect_to_url.netloc, urlparse(frontend_home_url).netloc
        )
        self.assertEqual(parsed_redirect_to_url.path, "/portability-requests/pending/")

        self.assertFalse("association_jwt" in parse_qs(parsed_redirect_to_url.query))

        # Test common context
        self.assertContextCommonValuesAreWellDefined(context)

        newly_create_playlist = Playlist.objects.get(lti_id="other:lti:context")

        jwt_token = PlaylistAccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["playlist_id"], "")  # important
        self.assertEqual(
            jwt_token.payload["port_to_playlist_id"], str(newly_create_playlist.id)
        )

        # Test common JWT attributes
        self.assertPlaylistJWTCommonValuesAreWellDefined(jwt_token, lti_role)

    def assertLTIViewReturnsNoResourceForStudent(self, resource):
        """Assert the LTI view will never return a resource for a student."""
        lti_role = STUDENT

        initial_playlist_count = Playlist.objects.all().count()
        lti_data = self._get_lti_data(resource, lti_role)
        response = self._client_post_on_resource_lti_view(resource, lti_data)
        context = self._get_context_from_response(response)

        self.assertEqual(context["state"], "success")
        self.assertIsNone(context["resource"])  # important
        self.assertEqual(context["modelName"], self.expected_context_model_name)
        self.assertNotIn("portability", context)
        self.assertNotIn("jwt", context)

        # Test common context
        self.assertContextCommonValuesAreWellDefined(context)

        # Test no playlist created
        self.assertEqual(Playlist.objects.all().count(), initial_playlist_count)

    def assertLTIViewReturnsErrorForAdminOrInstructor(self, resource):
        """Assert the LTI view returns an error for an admin or an instructor."""
        lti_role = random.choice((INSTRUCTOR, ADMINISTRATOR))

        initial_playlist_count = Playlist.objects.all().count()
        lti_data = self._get_lti_data(resource, lti_role)
        response = self._client_post_on_resource_lti_view(resource, lti_data)
        context = self._get_context_from_response(response)

        self.assertEqual(context["state"], "error")
        self.assertIsNone(context["resource"])  # important
        self.assertEqual(context["modelName"], self.expected_context_model_name)
        self.assertNotIn("portability", context)
        self.assertNotIn("jwt", context)

        # Test common context
        self.assertContextCommonValuesAreWellDefined(context)

        # Test no playlist created
        self.assertEqual(Playlist.objects.all().count(), initial_playlist_count)

    def _get_lti_data(self, resource, lti_role):
        """Build a dict of LTI data for the given resource and role."""
        return {
            "resource_link_id": resource.lti_id,
            "context_id": "other:lti:context",  # different context
            "roles": lti_role,
            "oauth_consumer_key": self.passport.oauth_consumer_key,
            "user_id": self.lti_user_id,
            "launch_presentation_locale": "fr",
            "lis_person_sourcedid": self.lti_username,
            "lis_person_contact_email_primary": self.lti_user_email,
        }

    def _get_context_from_response(self, response):
        """Extract the application data provided to the frontend from the response."""
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        return json.loads(unescape(match.group(1)))

    def _get_lti_view_url(self, resource):
        """Return the LTI view URL for the given resource. Must be overridden in subclasses."""
        raise NotImplementedError()

    def _client_post_on_resource_lti_view(self, resource, lti_data):
        """Do the POST on the LTI view for the given resource and LTI data."""
        with mock.patch.object(LTI, "verify") as mock_verify:
            with mock.patch.object(LTI, "get_consumer_site") as mock_get_consumer_site:
                mock_get_consumer_site.return_value = self.passport.consumer_site
                response = self.client.post(
                    self._get_lti_view_url(resource),
                    lti_data,
                )
                self.assertEqual(mock_verify.call_count, 1)

        return response
