"""Test the LTI interconnection with Open edX."""
from unittest import mock

from django.test import RequestFactory, TestCase

import oauth2
from pylti.common import LTIException, LTIOAuthServer

from ..factories import (
    ConsumerSiteLTIPassportFactory,
    PlaylistLTIPassportFactory,
    VideoFactory,
)
from ..lti import LTI
from ..models import Playlist, Video


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
    """Test the LTI provider."""

    def setUp(self):
        """Override the setUp method to instanciate and serve a request factory."""
        super().setUp()
        self.factory = RequestFactory()

    def test_lti_video_instructor(self):
        """The instructor role should be identified even when a synonym is used."""
        for roles_string in [
            "instructor",
            "Teacher",  # upper case letters should be normalized
            "student,instructor",  # two roles separated by comma
            "student, Instructor",  # a space after the comma is allowed
            ", staff",  # a leading comma should be ignored
            "staff,",  # a trailing comma should be ignored
        ]:
            request = self.factory.post("/", {"roles": roles_string})
            lti = LTI(request)
            self.assertTrue(lti.is_instructor)

        for roles_string in ["", "instructori", "student", "administrator,student"]:
            request = self.factory.post("/", {"roles": roles_string})
            lti = LTI(request)
            self.assertFalse(lti.is_instructor)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_passport_unknown(self, mock_verify):
        """Launch request for an unknown passport.

        A launch request that does not refer to an existing passport should fail.
        """
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        with self.assertRaises(LTIException):
            lti.verify()
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
        lti = LTI(request)
        self.assertTrue(lti.verify())
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
        lti = LTI(request)
        self.assertTrue(lti.verify())
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", side_effect=oauth2.Error)
    def test_lti_verify_request_flush_on_error(self, mock_verify):
        """When an LTI launch request fails to verify."""
        # mock_verify is forced to raise an oauth2 Error upon verification
        PlaylistLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            playlist__consumer_site__name="example.com",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        with self.assertRaises(LTIException):
            lti.verify()
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video(self, mock_verify):
        """The video should be retrieved by the LTI object when available."""
        video = VideoFactory(
            lti_id="example.com-df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="example.com",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        self.assertEqual(lti.get_or_create_video(), video)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_wrong_playlist_student(self, mock_verify):
        """A student retrieving a video with the wrong playlist.

        The video should not be retrieved if a student tries to access a video that exists
        but for another playlist.
        """
        VideoFactory(
            lti_id="example.com-df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="example.com",
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        self.assertIsNone(lti.get_or_create_video())

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_wrong_playlist_instructor(self, mock_verify):
        """An instructor retrieving a video with the wrong playlist.

        A new playlist and a new video should be created if an instructor tries to access a
        video that exists but for another playlist.
        """
        video = VideoFactory(
            lti_id="example.com-df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="example.com",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_wrong_lti_id_student(self, mock_verify):
        """The video should not be retrieved if a student tries to access an unknown video."""
        VideoFactory(
            lti_id="example.com-wrong",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="example.com",
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        self.assertIsNone(lti.get_or_create_video())

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_wrong_lti_id_intructor(self, mock_verify):
        """An instructor retrieving an unknown video.

        A new video should be created and returned if an instructor tries to access an unknown
        video for in existing playlist.
        """
        video = VideoFactory(
            lti_id="example.com-wrong",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="example.com",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.playlist, video.playlist)
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)
