"""Test the LTI interconnection with Open edX."""
import random
from unittest import mock
from urllib.parse import unquote

from django.test import RequestFactory, TestCase
from django.utils import timezone

import oauth2
from oauthlib import oauth1
from pylti.common import LTIException, LTIOAuthServer

from ..factories import (
    ConsumerSiteFactory,
    ConsumerSiteLTIPassportFactory,
    PlaylistLTIPassportFactory,
    VideoFactory,
)
from ..lti import LTI
from ..models import ConsumerSitePortability, Playlist, Video


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class VideoLTITestCase(TestCase):
    """Test the LTI provider."""

    def setUp(self):
        """Override the setUp method to instanciate and serve a request factory."""
        super().setUp()
        self.factory = RequestFactory()

    def test_lti_request_body(self):
        """Simulate an LTI launch request with oauth in the body.

        This test uses the oauthlib library to simulate an LTI launch request and make sure
        that our LTI verification works.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="testserver")
        lti_parameters = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
        }
        url = "http://testserver/lti-video/"
        client = oauth1.Client(
            client_key=passport.oauth_consumer_key, client_secret=passport.shared_secret
        )
        # Compute Authorization header which looks like:
        # Authorization: OAuth oauth_nonce="80966668944732164491378916897",
        # oauth_timestamp="1378916897", oauth_version="1.0", oauth_signature_method="HMAC-SHA1",
        # oauth_consumer_key="", oauth_signature="frVp4JuvT1mVXlxktiAUjQ7%2F1cw%3D"
        _uri, headers, _body = client.sign(
            url,
            http_method="POST",
            body=lti_parameters,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        # Parse headers to pass to template as part of context:
        oauth_dict = {
            k: v
            for k, v in [
                param.strip().replace('"', "").split("=")
                for param in headers["Authorization"].split(",")
            ]
        }
        signature = oauth_dict["oauth_signature"]
        oauth_dict["oauth_signature"] = unquote(signature)
        oauth_dict["oauth_nonce"] = oauth_dict.pop("OAuth oauth_nonce")

        lti_parameters.update(oauth_dict)
        request = self.factory.post(
            url, lti_parameters, HTTP_REFERER="https://testserver"
        )
        lti = LTI(request)
        self.assertEqual(lti.verify(), passport.consumer_site)

        # If we alter the signature (e.g. add "a" to it), the verification should fail
        oauth_dict["oauth_signature"] = "{:s}a".format(signature)

        lti_parameters.update(oauth_dict)
        request = self.factory.post(url, lti_parameters)
        lti = LTI(request)
        with self.assertRaises(LTIException):
            lti.verify()

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
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        with self.assertRaises(LTIException):
            lti.verify()
        self.assertFalse(mock_verify.called)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_passport_mismatched_referer(self, *_):
        """Launch request with a referer that differs from the consumer_site should fail."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            consumer_site__domain="example.com",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post(
            "/", data, HTTP_REFERER="https://not-example.com/route"
        )
        lti = LTI(request)
        with self.assertRaises(LTIException) as context:
            lti.verify()
        self.assertEqual(
            context.exception.args[0], "Host domain does not match registered passport."
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_passport_subdomain(self, *_):
        """Launch request with a referer that is a subdomain of consumer_site should succeed."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            consumer_site__domain="example.com",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post(
            "/", data, HTTP_REFERER="https://subdomain.example.com/route"
        )
        lti = LTI(request)
        # We just have to make sure verification does not raise an exception
        lti.verify()

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_passport_consumer_site(self, mock_verify):
        """Authenticating an LTI launch request with a passport related to a consumer site."""
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            consumer_site__domain="example.com",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertEqual(lti.verify(), passport.consumer_site)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_passport_playlist(self, mock_verify):
        """Authenticating an LTI launch request with a passport related to a playlist."""
        passport = PlaylistLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            playlist__consumer_site__domain="example.com",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertEqual(lti.verify(), passport.playlist.consumer_site)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", side_effect=oauth2.Error)
    def test_lti_verify_request_flush_on_error(self, mock_verify):
        """When an LTI launch request fails to verify."""
        # mock_verify is forced to raise an oauth2 Error upon verification
        PlaylistLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            playlist__consumer_site__domain="example.com",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data)
        lti = LTI(request)
        with self.assertRaises(LTIException):
            lti.verify()
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_behind_tls_termination_proxy(self, mock_verify):
        """Then url should be corrected when place behind a tls termination proxy."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="testserver"
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post(
            "/lti-video/",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        self.assertEqual(request.build_absolute_uri(), "http://testserver/lti-video/")
        lti = LTI(request)
        lti.verify()
        self.assertEqual(
            mock_verify.call_args[0][0].url, "https://testserver/lti-video/"
        )


class PortabilityVideoLTITestCase(TestCase):
    """Test the portability of videos beween playlists and consumer sites.

    We need to test the portability behavior of videos in all the following cases:

        1) video with same lti_id exists
            **1-1) video exists in same playlist, same site**
            1-2) video exists in same playlist, other site
                1-2-1) video playlist is portable to consumer site
                    **1-2-1-1) video is ready**
                    1-2-1-2) video is not ready
                        **1-2-1-2-1) instructor**
                        **1-2-1-2-2) student**
                1-2-2) video is automatically portable to consumer site
                    **1-2-2-1) video is ready**
                    1-2-2-2) video is not ready
                        **1-2-2-2-1) instructor**
                        **1-2-2-2-2) student**
                1-2-3) video playlist is not portable to consumer site
                    **1-2-3-1) instructor**
                    **1-2-3-2) student**
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
                    1-4-1-1) video playlist is portable to consumer site
                        **1-4-1-1-1) video is ready**
                        1-4-1-1-2) video is not ready
                            **1-4-1-1-2-1) instructor**
                            **1-4-1-1-2-2) student**
                    1-4-1-2) video is automatically portable to consumer site
                        **1-4-1-2-1) video is ready**
                        1-4-1-2-2) video is not ready
                            **1-4-1-2-2-1) instructor**
                            **1-4-1-2-2-2) student**
                    1-4-1-3) video is not portable to consumer site
                        **1-4-1-3-1) instructor**
                        **1-4-1-3-2) student**
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

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_openedx_lms(self, mock_verify):
        """Above case 1-1 applied to Open edX.

        The video should be retrieved by the LTI object when available (launch request by
        Open edX LMS).
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertEqual(lti.get_or_create_video(), video)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_openedx_cms(self, mock_verify):
        """Above case 1-1 applied to Open edX.

        The video should be retrieved by the LTI object when available (launch request by
        Open edX CMS).
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": "-df7",  # the hostname is mistakenly left blank by Open edX CMS
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertEqual(lti.get_or_create_video(), video)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_moodle(self, mock_verify):
        """Above case 1-1 applied to Moodle.

        The video should be retrieved by the LTI object when available (launch request by Moodle).
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "tool_consumer_instance_guid": video.playlist.consumer_site.domain,
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertEqual(lti.get_or_create_video(), video)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_ready(self, mock_verify):
        """Above case 1-2-1-1.

        The existing video should be duplicated if a student or instructor tries to retrieve a
        video that is ready but on another consumer site if it is marked as portable to another
        consumer site. A new playlist should be created for the other consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )

        # Add a video with the same lti_id but linked to another playlist and uploaded after the
        # first one to make sure that the video from the same playlist still has precedence
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0002",  # Session 2 is another playlist
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")

        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.order_by("-created_on").first())
        self.assertEqual(new_video.duplicated_from, video)
        self.assertEqual(new_video.upload_state, "ready")
        self.assertEqual(new_video.uploaded_on, video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertEqual(new_video.resource_id, video.resource_id)
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.playlist.consumer_site, passport.consumer_site)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_several_get_latest(self, mock_verify):
        """Above case 1-2-1-1 in case of several videos.

        In case several videos exist with the same lti_id, it should duplicate the latest.
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        # Create a random number of duplicate videos on this consumer site
        nb_videos = random.randint(1, 4)
        videos = VideoFactory.create_batch(
            nb_videos,
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(Video.objects.count(), nb_videos + 1)
        self.assertEqual(new_video.uploaded_on, videos[-1].uploaded_on)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-2-1-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing for another consumer site but not ready, even if it is portable to another
        consumer site. A new playlist should be created for the other consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(["pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertIsNone(new_video.duplicated_from)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertNotEqual(new_video.resource_id, video.resource_id)
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.playlist.consumer_site, passport.consumer_site)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-2-1-2-2.

        No video is returned to a student trying to access a video that is existing for another
        consumer site but not ready, even if it is portable to another consumer site.
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(["pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertIsNone(lti.get_or_create_video())
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_ready(self, mock_verify):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site=consumer_site
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__is_portable_to_consumer_site=False,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )

        # Add a video with the same lti_id but linked to another playlist and uploaded after the
        # first one to make sure that the video from the same playlist still has precedence
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0002",  # Session 2 is another playlist
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )

        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)

        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.order_by("-created_on").first())
        self.assertEqual(new_video.duplicated_from, video)
        self.assertEqual(new_video.upload_state, "ready")
        self.assertEqual(new_video.uploaded_on, video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertEqual(new_video.resource_id, video.resource_id)
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.playlist.consumer_site, passport.consumer_site)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-2-2-2-1.

        Same as 1-2-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site=consumer_site
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(["pending", "error"]),
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)

        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertIsNone(new_video.duplicated_from)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertNotEqual(new_video.resource_id, video.resource_id)
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.playlist.consumer_site, passport.consumer_site)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-2-2-2-2.

        Same as 1-2-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site=consumer_site
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(["pending", "error"]),
        )

        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)

        self.assertIsNone(lti.get_or_create_video())
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_not_portable_instructor(self, mock_verify):
        """Above case 1-2-3-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing for another consumer site but not portable to another consumer site, even if it
        is ready. A new playlist should be created for the other consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(["ready", "pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertNotEqual(new_video.resource_id, video.resource_id)
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.playlist.consumer_site, passport.consumer_site)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_not_portable_student(self, mock_verify):
        """Above case 1-2-3-2.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            upload_state=random.choice(["ready", "pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertIsNone(lti.get_or_create_video())
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_portable_ready(self, mock_verify):
        """Above case 1-3-1-1.

        The existing video should be duplicated if a student or instructor tries to retrieve a
        video that is ready but linked to another playlist if it is marked as portable to another
        playlist. A new playlist should be created if it does not exist.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site=passport.consumer_site,
            upload_state="ready",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.duplicated_from, video)
        self.assertEqual(new_video.upload_state, "ready")
        self.assertEqual(new_video.uploaded_on, video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertEqual(new_video.resource_id, video.resource_id)
        self.assertNotEqual(new_video.playlist, video.playlist)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_several_get_latest(self, mock_verify):
        """Above case 1-3-1-1 in case of several videos.

        In case several videos exist with the same lti_id, it should duplicate the latest.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        # Create a random number of duplicate videos on this consumer site
        nb_videos = random.randint(1, 4)
        videos = VideoFactory.create_batch(
            nb_videos,
            lti_id="df7",
            playlist__consumer_site=passport.consumer_site,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(Video.objects.count(), nb_videos + 1)
        self.assertEqual(new_video.uploaded_on, videos[-1].uploaded_on)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_portable_not_ready_instructor(self, mock_verify):
        """Above case 1-3-1-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing in another playlist but not ready, even if it is portable to another
        playlist. A new playlist should be created if it does not exist.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=True,
            upload_state=random.choice(["pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertNotEqual(new_video.resource_id, video.resource_id)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_portable_not_ready_student(self, mock_verify):
        """Above case 1-3-1-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not ready, even if it is portable to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=True,
            upload_state=random.choice(["pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertIsNone(lti.get_or_create_video())
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_instructor(self, mock_verify):
        """Above case 1-3-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing in another playlist but not portable to another playlist, even if it
        is ready. A new playlist should be created if it does not exist.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            upload_state=random.choice(["ready", "pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertNotEqual(new_video.resource_id, video.resource_id)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_student(self, mock_verify):
        """Above case 1-3-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not portable to another playlist, even if it is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            upload_state=random.choice(["ready", "pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertIsNone(lti.get_or_create_video())
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_ready(self, mock_verify):
        """Above case 1-4-1-1-1.

        The existing video should be duplicated if a student or instructor tries to retrieve a
        video that is ready but in another playlist on another consumer site if it is marked as
        portable to another playlist AND to another consumer site. A new playlist should be
        created for the other consumer site.
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state="ready",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.duplicated_from, video)
        self.assertEqual(new_video.upload_state, "ready")
        self.assertEqual(new_video.uploaded_on, video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertEqual(new_video.resource_id, video.resource_id)
        self.assertNotEqual(new_video.playlist, video.playlist)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_several_get_latest(self, mock_verify):
        """Above case 1-4-1-1-1 in case of several videos.

        In case several videos exist with the same lti_id, it should duplicate the latest.
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        # Create a random number of duplicate videos on this consumer site
        nb_videos = random.randint(1, 4)
        videos = VideoFactory.create_batch(
            nb_videos,
            lti_id="df7",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(Video.objects.count(), nb_videos + 1)
        self.assertEqual(new_video.uploaded_on, videos[-1].uploaded_on)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing in another playlist on another consumer site but not ready, even if it is
        portable to another playlist AND to another consumer site. A new playlist should be
        created for the other consumer site.
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(["pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertNotEqual(new_video.resource_id, video.resource_id)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_student(self, mock_verify):
        """Above case 1-4-1-1-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist for another consumer site but not ready, even if it is portable to another
        playlist AND to another consumer site.
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        VideoFactory(
            lti_id="df7",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(["pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertIsNone(lti.get_or_create_video())
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_ready(self, mock_verify):
        """Above case 1-4-1-2-1.

        Same as 1-4-1-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site=consumer_site
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__lti_id="wrong",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            upload_state="ready",
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)

        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.duplicated_from, video)
        self.assertEqual(new_video.upload_state, "ready")
        self.assertEqual(new_video.uploaded_on, video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertEqual(new_video.resource_id, video.resource_id)
        self.assertNotEqual(new_video.playlist, video.playlist)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-1.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site=consumer_site
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(["pending", "error"]),
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)

        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertNotEqual(new_video.resource_id, video.resource_id)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-2.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site=consumer_site
        )
        video = VideoFactory(
            lti_id="df7",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(["pending", "error"]),
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)

        self.assertIsNone(lti.get_or_create_video())
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_instructor(self, mock_verify):
        """Above cases 1-4-1-3-1 and 1-4-2-1.

        A new video should be created if an instructor tries to retrieve a video that is
        existing in another playlist on another consumer site but not portable either to another
        playlist or to another consumer site, even if it is ready. A new playlist should be
        created for the other consumer site.
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        one_not_portable = random.choice([True, False])
        video = VideoFactory(
            lti_id="df7",
            playlist__is_portable_to_playlist=one_not_portable,
            playlist__is_portable_to_consumer_site=not one_not_portable,
            upload_state=random.choice(["ready", "pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertNotEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, video.lti_id)
        self.assertNotEqual(new_video.resource_id, video.resource_id)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_student(self, mock_verify):
        """Above case 1-4-1-3-2 and 1-4-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is ready.
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        one_not_portable = random.choice([True, False])
        VideoFactory(
            lti_id="df7",
            playlist__is_portable_to_playlist=one_not_portable,
            playlist__is_portable_to_consumer_site=not one_not_portable,
            upload_state=random.choice(["ready", "pending", "error"]),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertIsNone(lti.get_or_create_video())
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1.

        A new video should be created and returned if an instructor tries to access an unknown
        video for an existing playlist.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        video = VideoFactory(
            lti_id="wrong",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site=passport.consumer_site,
            uploaded_on=timezone.now(),
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        new_video = lti.get_or_create_video()
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, "df7")
        self.assertNotEqual(new_video.resource_id, video.resource_id)
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_wrong_lti_id_student(self, mock_verify):
        """Above case 2-2.

        The video should not be retrieved if a student tries to access an unknown video.
        """
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="example.com"
        )
        VideoFactory(
            lti_id="wrong",
            playlist__lti_id="course-v1:ufr+mathematics+0001",
            playlist__consumer_site=passport.consumer_site,
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request)
        self.assertIsNone(lti.get_or_create_video())
        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)
