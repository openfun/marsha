"""Test the LTI interconnection with Open edX."""
import random
from unittest import mock
from urllib.parse import unquote
import uuid

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
from ..models import STATE_CHOICES, ConsumerSitePortability, Playlist, Video


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
        resource_id = uuid.uuid4()
        url = "http://testserver/lti/videos/{!s}".format(resource_id)
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
        lti = LTI(request, uuid.uuid4())
        self.assertEqual(lti.verify(), passport.consumer_site)

        # If we alter the signature (e.g. add "a" to it), the verification should fail
        oauth_dict["oauth_signature"] = "{:s}a".format(signature)

        lti_parameters.update(oauth_dict)
        request = self.factory.post(url, lti_parameters)
        lti = LTI(request, resource_id)
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
            lti = LTI(request, uuid.uuid4())
            self.assertTrue(lti.is_instructor)

        for roles_string in ["", "instructori", "student", "administrator,student"]:
            request = self.factory.post("/", {"roles": roles_string})
            lti = LTI(request, uuid.uuid4())
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
        lti = LTI(request, uuid.uuid4())
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
        lti = LTI(request, uuid.uuid4())
        with self.assertRaises(LTIException) as context:
            lti.verify()
        self.assertEqual(
            context.exception.args[0],
            "Host domain (not-example.com) does not match registered passport (example.com).",
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
        lti = LTI(request, uuid.uuid4())
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
        lti = LTI(request, uuid.uuid4())
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
        lti = LTI(request, uuid.uuid4())
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
        lti = LTI(request, uuid.uuid4())
        with self.assertRaises(LTIException):
            lti.verify()
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_behind_tls_termination_proxy(self, mock_verify):
        """The launch url should be corrected when placed behind a tls termination proxy."""
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
            "/lti/videos/",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti/videos/",
        )
        self.assertEqual(request.build_absolute_uri(), "http://testserver/lti/videos/")
        lti = LTI(request, uuid.uuid4())
        lti.verify()
        self.assertEqual(
            mock_verify.call_args[0][0].url, "https://testserver/lti/videos/"
        )

    def test_lti_is_edx_format(self):
        """Check if the LTI request comes from an edx instance."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="testserver"
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            "/lti/videos/{!s}".format(resource_id),
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertTrue(lti.is_edx_format)

    def test_lti_is_not_edx_format(self):
        """Check if the LTI request doesn't come from an edx instance."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="testserver"
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "115",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            "/lti/videos/{!s}".format(resource_id),
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertFalse(lti.is_edx_format)

    def test_lti_get_edx_course_info(self):
        """Retrieve course info in a edx lti request."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="testserver"
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            "/lti/videos/{!s}".format(resource_id),
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertDictEqual(
            lti.get_course_info(),
            {"school_name": "ufr", "course_name": "mathematics", "course_run": "00001"},
        )

    def test_lti_get_partial_edx_course_info(self):
        """Retrieve course info in a edx lti request partially set."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="testserver"
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            "/lti/videos/{!s}".format(resource_id),
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertDictEqual(
            lti.get_course_info(),
            {"school_name": "ufr", "course_name": "mathematics", "course_run": None},
        )

    def test_lti_get_course_info(self):
        """Retrieve course info in other consumer than edx."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="testserver"
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "13245",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
            "tool_consumer_instance_name": "ufr",
            "context_title": "mathematics",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            "/lti/videos/{!s}".format(resource_id),
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertDictEqual(
            lti.get_course_info(),
            {"school_name": "ufr", "course_name": "mathematics", "course_run": None},
        )


class PortabilityVideoLTITestCase(TestCase):
    """Test the portability of videos beween playlists and consumer sites.

    We need to test the portability behavior of videos in all the following cases:

        1) video with same lti_id exists
            1-1) video exists in same playlist, same site**
                **1-1-1) instructor**
                **1-1-2) student**
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
    def test_lti_get_video_same_playlist_same_site_instructor(self, mock_verify):
        """Above case 1-1-1.

        A video that exists for the requested playlist and consumer site should be returned
        to an instructor whatever its upload state.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "tool_consumer_instance_guid": video.playlist.consumer_site.domain,
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertEqual(lti.get_or_create_video(), video)

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_student_ready(self, mock_verify):
        """Above case 1-1-2 upload state ready.

        A video that exists for the requested playlist and consumer site should be returned
        to a student if it is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site, upload_state="ready"
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Student",
            "tool_consumer_instance_guid": video.playlist.consumer_site.domain,
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertEqual(lti.get_or_create_video(), video)

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_same_playlist_same_site_student_not_ready(self, mock_verify):
        """Above case 1-1-2 upload state not ready.

        A video that exists for the requested playlist and consumer site should not be returned
        to a student if it is not ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Student",
            "tool_consumer_instance_guid": video.playlist.consumer_site.domain,
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_ready(self, mock_verify):
        """Above case 1-2-1-1.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is ready but on another consumer site if it is marked as portable to another
        consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__is_portable_to_consumer_site=True,
            uploaded_on=timezone.now(),
            upload_state="ready",
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")

        lti = LTI(request, video.pk)
        self.assertEqual(lti.get_or_create_video(), video)

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-2-1-2-1.

        An LTI Exception should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not ready, even if it is portable to another
        consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        with self.assertRaises(LTIException) as context:
            lti.get_or_create_video()
        self.assertEqual(
            context.exception.args[0],
            (
                "The video ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (a-playlist) and/or consumer site (example.com)."
            ),
        )
        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_playlist_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-2-1-2-2.

        No video is returned to a student trying to access a video that is existing for another
        consumer site but not ready, even if it is portable to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_ready(self, mock_verify):
        """Above case 1-2-2-1.

        Same as 1-2-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        video = VideoFactory(
            playlist__is_portable_to_consumer_site=False,
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
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertEqual(lti.get_or_create_video(), video)

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-2-2-2-1.

        Same as 1-2-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        video = VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        with self.assertRaises(LTIException) as context:
            lti.get_or_create_video()
        self.assertEqual(
            context.exception.args[0],
            (
                "The video ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (a-playlist) and/or consumer site (example.com)."
            ),
        )
        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_auto_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-2-2-2-2.

        Same as 1-2-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        video = VideoFactory(
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )

        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)

        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_not_portable_instructor(self, mock_verify):
        """Above case 1-2-3-1.

        An LTIException should be raised if an instructor tries to retrieve a video that is
        already existing for a consumer site but not portable to another consumer site, even if it
        is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = video = VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        with self.assertRaises(LTIException) as context:
            lti.get_or_create_video()
        self.assertEqual(
            context.exception.args[0],
            (
                "The video ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (a-playlist) and/or consumer site (example.com)."
            ),
        )
        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_site_not_portable_student(self, mock_verify):
        """Above case 1-2-3-2.

        No video is returned to a student trying to access a video that is existing for a
        consumer site but not portable to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(upload_state=random.choice([s[0] for s in STATE_CHOICES]))
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_portable_ready(self, mock_verify):
        """Above case 1-3-1-1.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is ready but linked to another playlist if it is marked as portable to another
        playlist.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site, upload_state="ready"
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertEqual(lti.get_or_create_video(), video)

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_portable_not_ready_instructor(self, mock_verify):
        """Above case 1-3-1-2-1.

        An LTIException should be raised if an instructor tries to retrieve a video that is
        already existing in a playlist but not ready, even if it is portable to another
        playlist.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        with self.assertRaises(LTIException) as context:
            lti.get_or_create_video()
        self.assertEqual(
            context.exception.args[0],
            (
                "The video ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site (example.com)."
            ),
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_portable_not_ready_student(self, mock_verify):
        """Above case 1-3-1-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not ready, even if it is portable to another playlist.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_instructor(self, mock_verify):
        """Above case 1-3-2-1.

        An LTIException should be raised if an instructor tries to retrieve a video that is
        existing in a playlist but not portable to another playlist, even if it
        is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        with self.assertRaises(LTIException) as context:
            lti.get_or_create_video()
        self.assertEqual(
            context.exception.args[0],
            (
                "The video ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site (example.com)."
            ),
        )

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_playlist_not_portable_student(self, mock_verify):
        """Above case 1-3-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist but not portable to another playlist, even if it is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site,
            playlist__is_portable_to_playlist=False,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_ready(self, mock_verify):
        """Above case 1-4-1-1-1.

        The existing video should be returned if a student or instructor tries to retrieve a
        video that is ready but in another playlist on another consumer site if it is marked as
        portable to another playlist AND to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state="ready",
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertEqual(lti.get_or_create_video(), video)

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-1-2-1.

        An LTIException should be raised if an instructor tries to retrieve a video that is
        already existing in a playlist on another consumer site but not ready, even if it is
        portable to another playlist AND to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        with self.assertRaises(LTIException) as context:
            lti.get_or_create_video()
        self.assertEqual(
            context.exception.args[0],
            (
                "The video ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site (example.com)."
            ),
        )
        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_portable_not_ready_student(self, mock_verify):
        """Above case 1-4-1-1-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist for another consumer site but not ready, even if it is portable to another
        playlist AND to another consumer site.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=True,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_ready(self, mock_verify):
        """Above case 1-4-1-2-1.

        Same as 1-4-1-1-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        video = VideoFactory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            upload_state="ready",
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )

        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": random.choice(["Student", "Instructor"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertEqual(lti.get_or_create_video(), video)

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_not_ready_instructor(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-1.

        Same as 1-4-1-1-2-1 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site=consumer_site
        )
        video = VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            lti_id="df7",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        with self.assertRaises(LTIException) as context:
            lti.get_or_create_video()
        self.assertEqual(
            context.exception.args[0],
            (
                "The video ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site (example.com)."
            ),
        )
        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_auto_portable_not_ready_student(
        self, mock_verify
    ):
        """Above case 1-4-1-2-2-2.

        Same as 1-4-1-1-2-2 but portability is automatic from the site of the video to the site
        of the passport.
        """
        consumer_site = ConsumerSiteFactory(domain="example.com")
        passport = ConsumerSiteLTIPassportFactory(consumer_site=consumer_site)
        video = VideoFactory(
            playlist__is_portable_to_playlist=True,
            playlist__is_portable_to_consumer_site=False,
            upload_state=random.choice(
                [s[0] for s in STATE_CHOICES if s[0] != "ready"]
            ),
        )
        # Add automatic portability from the site of the video to the site of the passport
        ConsumerSitePortability.objects.create(
            source_site=video.playlist.consumer_site, target_site=consumer_site
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_instructor(self, mock_verify):
        """Above cases 1-4-1-3-1 and 1-4-2-1.

        An LTIException should be raised if an instructor tries to retrieve a video already
        existing in a playlist and another consumer site but not portable either to another
        playlist or to another consumer site, even if it is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        one_not_portable = random.choice([True, False])
        video = VideoFactory(
            id="77fbf317-3e99-41bd-819c-130531313139",
            playlist__lti_id="a-playlist",
            playlist__is_portable_to_playlist=one_not_portable,
            playlist__is_portable_to_consumer_site=not one_not_portable,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        with self.assertRaises(LTIException) as context:
            lti.get_or_create_video()
        self.assertEqual(
            context.exception.args[0],
            (
                "The video ID 77fbf317-3e99-41bd-819c-130531313139 already exists but is not "
                "portable to your playlist (another-playlist) and/or consumer site (example.com)."
            ),
        )
        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_other_pl_site_not_portable_student(self, mock_verify):
        """Above case 1-4-1-3-2 and 1-4-2-2.

        No video is returned to a student trying to access a video that is existing in another
        playlist on another consumer site but not portable either to another playlist or to
        another consumer site, even if it is ready.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        one_not_portable = random.choice([True, False])
        video = VideoFactory(
            playlist__is_portable_to_playlist=one_not_portable,
            playlist__is_portable_to_consumer_site=not one_not_portable,
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": "another-playlist",
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, video.pk)
        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_wrong_lti_id_intructor(self, mock_verify):
        """Above case 2-1.

        A new video should be created and returned if an instructor tries to access an unknown
        video for an existing playlist.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(
            playlist__consumer_site=passport.consumer_site, uploaded_on=timezone.now()
        )
        data = {
            "resource_link_id": "new_lti_id",
            "context_id": video.playlist.lti_id,
            "roles": "Instructor",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, uuid.uuid4())
        new_video = lti.get_or_create_video()

        # A new video is created
        self.assertEqual(Video.objects.count(), 2)
        self.assertEqual(new_video, Video.objects.exclude(id=video.id).get())
        self.assertEqual(new_video.playlist, video.playlist)
        self.assertEqual(new_video.upload_state, "pending")
        self.assertIsNone(new_video.uploaded_on)
        self.assertEqual(new_video.lti_id, "new_lti_id")

        # No new playlist is created
        self.assertEqual(Playlist.objects.count(), 1)

    @mock.patch.object(LTIOAuthServer, "verify_request", return_value=True)
    def test_lti_get_video_wrong_lti_id_student(self, mock_verify):
        """Above case 2-2.

        The video should not be retrieved if a student tries to access an unknown video.
        """
        passport = ConsumerSiteLTIPassportFactory(consumer_site__domain="example.com")
        video = VideoFactory(playlist__consumer_site=passport.consumer_site)
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "Student",
            "oauth_consumer_key": passport.oauth_consumer_key,
        }

        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, uuid.uuid4())
        self.assertIsNone(lti.get_or_create_video())

        # No new playlist or video are created
        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(Video.objects.count(), 1)
