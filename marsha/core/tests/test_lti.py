"""Test the LTI interconnection with Open edX."""
from importlib import import_module
from unittest import mock

from django.shortcuts import render
from django.test import RequestFactory, TestCase

import oauth2
from pylti.common import LTIException, LTIOAuthServer

from ..factories import ConsumerSiteLTIPassportFactory, PlaylistLTIPassportFactory
from ..lti import LTI


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument

OPENEDX_LAUNCH_REQUEST_DATA = {
    "custom_component_display_name": "LTI Consumer",
    "lti_version": "LTI-1p0",
    "oauth_nonce": "55763888688528959391532682559",
    "resource_link_id": "example.com-df7",
    "context_id": "course-v1:ufr+mathematics+0001",
    "oauth_signature_method": "HMAC-SHA1",
    "oauth_version": "1.0",
    "oauth_signature": "wRAp5yHp4tS+2lhkET+D0wo7d2o=",
    "lis_person_sourcedid": "johnny",
    "lti_message_type": "basic-lti-launch-request",
    "launch_presentation_return_url": "",
    "lis_person_contact_email_primary": "johnny@example.com",
    "user_id": "562",
    "roles": "Instructor",
    "oauth_consumer_key": "ABC123",
    "lis_result_sourcedid": "course-v1%3Aufr%2Bmathematics%2B0001:example.com-df7:562",
    "launch_presentation_locale": "en",
    "oauth_timestamp": "1532682559",
    "oauth_callback": "about:blank",
}

OPENEDX_SESSION = {
    "context_id": "course-v1:ufr+mathematics+0001",
    "lis_person_contact_email_primary": "johnny@example.com",
    "lis_person_sourcedid": "johnny",
    "lis_result_sourcedid": "course-v1%3Aufr%2Bmathematics%2B0001:example.com-df7:562",
    "lti_authenticated": True,
    "scope": None,
    "lti_version": "LTI-1p0",
    "oauth_consumer_key": "ABC123",
    "oauth_nonce": "55763888688528959391532682559",
    "resource_link_id": "example.com-df7",
    "roles": "Instructor",
    "user_id": "562",
}


class VideoLTITestCase(TestCase):
    """Test the LTI provider endpoint to upload and view videos."""

    def setUp(self):
        """Override the setUp method to instanciate and serve a request factory."""
        super().setUp()
        self.factory = RequestFactory()

    def test_lti_video_launch_request_render_context(self):
        """The context should be rendered to html on the launch request page."""
        policy = {"a": 1, "b": 2}
        request = self.factory.get("/")
        response = render(
            request, "core/lti_video.html", {"policy": policy, "state": "s"}
        )
        self.assertContains(
            response, '<div data-state="s" data-a="1" data-b="2"></div>', html=True
        )

    def test_lti_video_instructor(self):
        """The instructor role should be identified even when a synonym is used."""
        request = self.factory.get("/")
        for roles_string in [
            "instructor",
            "Teacher",  # upper case letters should be normalized
            "student,instructor",  # two roles separated by comma
            "student, Instructor",  # a space after the comma is allowed
            ", staff",  # a leading comma should be ignored
            "staff,",  # a trailing comma should be ignored
        ]:
            request.session = {"roles": roles_string}
            lti = LTI(request)
            self.assertTrue(lti.is_instructor)

        for roles_string in ["", "instructori", "student", "administrator,student"]:
            request.session = {"roles": roles_string}
            lti = LTI(request)
            self.assertFalse(lti.is_instructor)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_passport_unknown(self, mock_verify):
        """Launch request for an unknown passport.

        A launch request that does not refer to an existing passport should fail and the current
        session should be flushed.
        """
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        engine = import_module("django.contrib.sessions.backends.file")
        store = engine.SessionStore()
        store.save()
        request.session = store
        request.session["key"] = "value"
        lti = LTI(request)
        self.assertEqual(request.session.get("key"), "value")
        with self.assertRaises(LTIException):
            lti.initialize_session()
        self.assertEqual(request.session.get("key"), None)
        self.assertFalse(mock_verify.called)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_passport_consumer_site(self, mock_verify):
        """Authenticating an LTI launch request with a passport related to a consumer site."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            consumer_site__name="example.com",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        request.session = {}
        lti = LTI(request)
        self.assertTrue(lti.initialize_session())
        OPENEDX_SESSION["scope"] = "consumer_site"
        self.assertEqual(request.session, OPENEDX_SESSION)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_passport_playlist(self, mock_verify):
        """Authenticating an LTI launch request with a passport related to a playlist."""
        PlaylistLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            playlist__consumer_site__name="example.com",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        request.session = {}
        lti = LTI(request)
        self.assertTrue(lti.initialize_session())
        OPENEDX_SESSION["scope"] = "playlist"
        self.assertEqual(request.session, OPENEDX_SESSION)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", side_effect=oauth2.Error)
    def test_lti_verify_request_flush_on_error(self, mock_verify):
        """When an LTI launch request fails to verify, the current session should be flushed."""
        PlaylistLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            playlist__consumer_site__name="example.com",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        engine = import_module("django.contrib.sessions.backends.file")
        store = engine.SessionStore()
        store.save()
        request.session = store
        request.session["key"] = "value"
        lti = LTI(request)
        self.assertEqual(request.session.get("key"), "value")
        with self.assertRaises(LTIException):
            lti.initialize_session()
        self.assertEqual(request.session.get("key"), None)
        self.assertEqual(mock_verify.call_count, 1)
