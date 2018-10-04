"""Test the LTI interconnection with Open edX."""
import random
from unittest import mock

from django.test import RequestFactory, TestCase
from django.utils import timezone

import oauth2
from pylti.common import LTIException, LTIOAuthServer

from ..factories import (
    ConsumerSiteFactory,
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


class PortabilityVideoLTITestCase(TestCase):
    """Test the portability of videos beween playlists and consumer sites.

    We need to test the portability behavior of videos in all the following cases:

        1) video with same lti_id exists
            **1-1) video exists in same playlist, same site**
            1-2) video exists in same playlist, other site
                1-2-1) video is portable to consumer site
                    **1-2-1-1) video is ready**
                    1-2-1-2) video is not ready
                        **1-2-1-2-1) instructor**
                        **1-2-1-2-2) student**
                1-2-2) video is not portable to consumer site
                    **1-2-2-1) instructor**
                    **1-2-2-2) student**
            1-3) video exists in other playlist, same site
                1-3-1) video is portable to playlist
                    **1-3-1-1) video is ready**
                    1-3-1-2) video is not ready
                        **1-3-1-2-1) instructor**
                        **1-3-1-2-2) student**
                1-3-2) video is not portable to playlist
                    **1-3-2-1) instructor**
                    **1-3-2-2) student**
            1-4) video exists in other playlist, other site
                1-4-1) video is portable to playlist
                    1-4-1-1) portable to consumer site
                        **1-4-1-1-1) video is ready**
                        1-4-1-1-2) video is not ready
                            **1-4-1-1-2-1) instructor**
                            **1-4-1-1-2-2) student**
                    1-4-1-2) video is not portable to consumer site
                        **1-4-1-2-1) instructor**
                        **1-4-1-2-2) student**
                1-4-2) video is not portable to playlist
                    **1-4-2-1) instructor**
                    **1-4-2-2) student**
        2) video with same lti_id does not exist
            **2-1) instructor**
            **2-2) student**

    We only write tests for leaf cases marked in bold above. This other cases are coverd by
    varying the parameters randomly in the tests to limit the number of tests and time to run
    them while still providing a good coverage.

    """

    def setUp(self):
        """Override the setUp method to instanciate and serve a request factory."""
        super().setUp()
        self.factory = RequestFactory()

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_same_playlist_same_site(self, mock_verify):
        """Above case 1-1 applied to Open edX.

        The video should be retrieved by the LTI object when available (launch request by
        Open edX).
        """
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="example.com",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        self.assertEqual(lti.get_or_create_video(), video)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_same_playlist_same_site_moodle(self, mock_verify):
        """Above case 1-1 applied to Moodle.

        The video should be retrieved by the LTI object when available (launch request by Moodle).
        """
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="example.com",
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "tool_consumer_instance_guid": video.playlist.consumer_site.name,
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        self.assertEqual(lti.get_or_create_video(), video)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_site_portable_ready(self, mock_verify):
        """Above case 1-2-1-1.

        The existing video should be duplicated if a student or instructor tries to retrieve a
        video that is ready but on another consumer site if it is marked as portable to another
        consumer site. A new playlist should be created for the other consumer site.
        """
        other_site = ConsumerSiteFactory(name="example.com")
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_consumer_site=True,
            state="ready",
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.duplicated_from, video)
        self.assertEqual(new_video.state, "ready")
        self.assertEqual(new_video.uploaded_on, video.uploaded_on)
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.playlist.consumer_site, other_site)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_site_several_get_latest(self, mock_verify):
        """In case several videos exist with the same lti_id, it should duplicate the latest."""
        ConsumerSiteFactory(name="example.com")
        first_video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            state="ready",
        )
        latest_video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site=first_video.playlist.consumer_site,
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            state="ready",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video.uploaded_on, latest_video.uploaded_on)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_site_portable_not_ready_instructor(self, mock_verify):
        """Above case 1-2-1-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing for another consumer site but not ready, even if it is portable to another
        consumer site. A new playlist should be created for the other consumer site.
        """
        other_site = ConsumerSiteFactory(name="example.com")
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_consumer_site=True,
            state=random.choice(["pending", "error"]),
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertIsNone(new_video.duplicated_from)
        self.assertEqual(new_video.state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.playlist.consumer_site, other_site)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_site_portable_not_ready_student(self, mock_verify):
        """Above case 1-2-1-2-2.

        No video is returned to a student trying to access a video that is existing for another
        consumer site but not ready, even if it is portable to another consumer site.
        """
        ConsumerSiteFactory(name="example.com")
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_consumer_site=True,
            state=random.choice(["pending", "error"]),
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
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_site_not_portable_instructor(self, mock_verify):
        """Above case 1-2-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing for another consumer site but not portable to another consumer site, even if it
        is ready. A new playlist should be created for the other consumer site.
        """
        other_site = ConsumerSiteFactory(name="example.com")
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_consumer_site=False,
            state=random.choice(["ready", "pending", "error"]),
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.playlist.consumer_site, other_site)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_site_not_portable_student(self, mock_verify):
        """Above case 1-2-2-2.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        ConsumerSiteFactory(name="example.com")
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="wrong.com",
            state=random.choice(["ready", "pending", "error"]),
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
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_playlist_portable_ready(self, mock_verify):
        """Above case 1-3-1-1.

        The existing video should be duplicated if a student or instructor tries to retrieve a
        video that is ready but linked to another playlist if it is marked as portable to another
        playlist. A new playlist should be created if it does not exist.
        """
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="example.com",
            state="ready",
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.duplicated_from, video)
        self.assertEqual(new_video.state, "ready")
        self.assertEqual(new_video.uploaded_on, video.uploaded_on)
        self.assertNotEqual(new_video.playlist, video.playlist)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_pl_several_get_latest(self, mock_verify):
        """In case several videos exist with the same lti_id, it should duplicate the latest."""
        first_video = VideoFactory(
            lti_id="df7",
            playlist__consumer_site__name="example.com",
            uploaded_on=timezone.now(),
            state="ready",
        )
        latest_video = VideoFactory(
            lti_id="df7",
            playlist__consumer_site=first_video.playlist.consumer_site,
            uploaded_on=timezone.now(),
            state="ready",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video.uploaded_on, latest_video.uploaded_on)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_pl_portable_not_ready_instructor(self, mock_verify):
        """Above case 1-3-1-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing in another playlist but not ready, even if it is portable to another
        playlist. A new playlist should be created if it does not exist.
        """
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="example.com",
            state=random.choice(["pending", "error"]),
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.state, "pending")
        self.assertIsNone(new_video.uploaded_on)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_playlist_portable_not_ready_student(self, mock_verify):
        """Above case 1-3-1-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not ready, even if it is portable to another consumer site.
        """
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="example.com",
            state=random.choice(["pending", "error"]),
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
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_instructor(self, mock_verify):
        """Above case 1-3-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing in another playlist but not portable to another playlist, even if it
        is ready. A new playlist should be created if it does not exist.
        """
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="example.com",
            playlist__is_portable_to_playlist=False,
            state=random.choice(["ready", "pending", "error"]),
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.state, "pending")
        self.assertIsNone(new_video.uploaded_on)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_student(self, mock_verify):
        """Above case 1-3-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not portable to another playlist, even if it is ready.
        """
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="example.com",
            playlist__is_portable_to_playlist=False,
            state=random.choice(["ready", "pending", "error"]),
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
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_pl_site_portable_ready(self, mock_verify):
        """Above case 1-4-1-1-1.

        The existing video should be duplicated if a student or instructor tries to retrieve a
        video that is ready but in another playlist on another consumer site if it is marked as
        portable to another playlist AND to another consumer site. A new playlist should be
        created for the other consumer site.
        """
        ConsumerSiteFactory(name="example.com")
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            state="ready",
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.duplicated_from, video)
        self.assertEqual(new_video.state, "ready")
        self.assertEqual(new_video.uploaded_on, video.uploaded_on)
        self.assertNotEqual(new_video.playlist, video.playlist)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing in another playlist on another consumer site but not ready, even if it is
        portable to another playlist AND to another consumer site. A new playlist should be
        created for the other consumer site.
        """
        ConsumerSiteFactory(name="example.com")
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            state=random.choice(["pending", "error"]),
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.state, "pending")
        self.assertIsNone(new_video.uploaded_on)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_student(self, mock_verify):
        """Above case 1-4-1-1-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist for another consumer site but not ready, even if it is portable to another
        playlist AND to another consumer site.
        """
        ConsumerSiteFactory(name="example.com")
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            state=random.choice(["pending", "error"]),
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
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_pl_site_several_get_latest(self, mock_verify):
        """In case several videos exist with the same lti_id, it should duplicate the latest."""
        ConsumerSiteFactory(name="example.com")
        first_video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            state="ready",
        )
        latest_video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site=first_video.playlist.consumer_site,
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            state="ready",
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video.uploaded_on, latest_video.uploaded_on)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_instructor(self, mock_verify):
        """Above cases 1-4-1-2-1 and 1-4-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing in another playlist on another consumer site but not portable either to another
        playlist or to another consumer site, even if it is ready. A new playlist should be
        created for the other consumer site.
        """
        ConsumerSiteFactory(name="example.com")
        one_not_portable = random.choice([True, False])
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_playlist=one_not_portable,
            playlist__is_portable_to_consumer_site=not one_not_portable,
            state=random.choice(["ready", "pending", "error"]),
        )
        data = {
            "resource_link_id": "example.com-df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.state, "pending")
        self.assertIsNone(new_video.uploaded_on)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_student(self, mock_verify):
        """Above case 1-4-1-2-2 and 1-4-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is ready.
        """
        ConsumerSiteFactory(name="example.com")
        one_not_portable = random.choice([True, False])
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site__name="wrong.com",
            playlist__is_portable_to_playlist=one_not_portable,
            playlist__is_portable_to_consumer_site=not one_not_portable,
            state=random.choice(["ready", "pending", "error"]),
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
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1.

        A new video should be created and returned if an instructor tries to access an unknown
        video for an existing playlist.
        """
        video = VideoFactory(
            lti_id="example.com-wrong",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site__name="example.com",
            uploaded_on=timezone.now(),
        )
        request = self.factory.post("/", OPENEDX_LAUNCH_REQUEST_DATA)
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTI, "verify", return_value=True)
    def test_lti_get_video_wrong_lti_id_student(self, mock_verify):
        """Above case 2-2.

        The video should not be retrieved if a student tries to access an unknown video.
        """
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
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)
