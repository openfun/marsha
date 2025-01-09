"""Test the LTI interconnection with Open edX."""

from unittest import mock
import uuid

from django.test import RequestFactory, TestCase, override_settings

from marsha.core import lti as lti_module
from marsha.core.factories import (
    ConsumerSiteLTIPassportFactory,
    PlaylistLTIPassportFactory,
)
from marsha.core.lti import LTI, LTIException
from marsha.core.lti.utils import get_or_create_resource
from marsha.core.models import Video
from marsha.core.tests.testing_utils import generate_passport_and_signed_lti_parameters


# We don't enforce arguments documentation in tests
# pylint: disable=too-many-lines,too-many-public-methods,unused-argument


class LTITestCase(TestCase):
    """Test the LTI provider."""

    def setUp(self):
        """Override the setUp method to instantiate and serve a request factory."""
        super().setUp()
        self.factory = RequestFactory()

    def test_lti_request_body(self):
        """Simulate an LTI launch request with oauth in the body.

        This test uses the oauthlib library to simulate an LTI launch request and make sure
        that our LTI verification works.
        """
        resource_id = uuid.uuid4()
        url = f"http://testserver/lti/videos/{resource_id}"
        lti_parameters, passport = generate_passport_and_signed_lti_parameters(
            url=url,
            lti_parameters={
                "resource_link_id": "df7",
                "context_id": "course-v1:ufr+mathematics+0001",
                "roles": "Instructor",
            },
        )

        request = self.factory.post(
            url, lti_parameters, HTTP_REFERER="https://testserver"
        )
        lti = LTI(request, uuid.uuid4())
        self.assertTrue(lti.verify())
        self.assertEqual(lti.get_consumer_site(), passport.consumer_site)

        # If we alter the signature (e.g. add "a" to it), the verification should fail
        lti_parameters["oauth_signature"] = f"{lti_parameters['oauth_signature']}a"
        request = self.factory.post(url, lti_parameters)
        lti = LTI(request, resource_id)
        with self.assertRaises(LTIException):
            lti.verify()

    def test_lti_request_body_without_referer(self):
        """Simulate an LTI launch request with oauth in the body.

        When the http referer is missing the request should still be authorized.
        """
        resource_id = uuid.uuid4()
        url = f"http://testserver/lti/videos/{resource_id}"
        lti_parameters, passport = generate_passport_and_signed_lti_parameters(
            url=url,
            lti_parameters={
                "resource_link_id": "df7",
                "context_id": "course-v1:ufr+mathematics+0001",
                "roles": "Instructor",
            },
        )

        request = self.factory.post(url, lti_parameters)
        lti = LTI(request, uuid.uuid4())
        self.assertTrue(lti.verify())
        self.assertEqual(lti.get_consumer_site(), passport.consumer_site)

        # If we alter the signature (e.g. add "a" to it), the verification should fail
        lti_parameters["oauth_signature"] = f"{lti_parameters['oauth_signature']}a"
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
            "urn:lti:instrole:ims/lis/Instructor",  # the LIS role identifier should be recognized
            "urn:lti:role:ims/lis/Instructor,urn:lti:instrole:ims/lis/Faculty",
        ]:
            request = self.factory.post("/", {"roles": roles_string})
            lti = LTI(request, uuid.uuid4())
            self.assertTrue(lti.is_instructor, roles_string)

        for roles_string in ["", "instructori", "student", "administrator,student"]:
            request = self.factory.post("/", {"roles": roles_string})
            lti = LTI(request, uuid.uuid4())
            self.assertFalse(lti.is_instructor, roles_string)

    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
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

    @override_settings(ALLOWED_HOSTS=["testserver"])
    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
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

    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
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

    @override_settings(ALLOWED_HOSTS=[".example.com", "testserver"])
    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
    def test_lti_passport_allowed_host(self, *_):
        """Launch request with a referer matching ALLOWED_HOSTS should succeed.

        This may happen with some browser that replace the referer header value by the referred-to
        and not the referred-from value (see https://bit.ly/35CvPXa).
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            consumer_site__domain="other.com",
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

    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
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
        self.assertTrue(lti.verify())
        self.assertEqual(lti.get_consumer_site(), passport.consumer_site)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
    def test_lti_passport_consumer_site_video_show_download_default_False(
        self, mock_verify
    ):
        """
        Authenticating an LTI launch request with a passport related to a consumer site.

        The consumer site used has video_show_download_default set to False and the video
        created should also have its show_download value set to False
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            consumer_site__domain="example.com",
            consumer_site__video_show_download_default=False,
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, uuid.uuid4())
        lti.verify()
        video = get_or_create_resource(Video, lti)
        self.assertFalse(video.show_download)

    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
    def test_lti_passport_consumer_site_video_show_download_default_True(
        self, mock_verify
    ):
        """
        Authenticating an LTI launch request with a passport related to a consumer site.

        The consumer site used has video_show_download_default set to True and the video
        created should also have its show_download value set to True
        """
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123",
            shared_secret="#Y5$",
            consumer_site__domain="example.com",
            consumer_site__video_show_download_default=True,
        )
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Instructor",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, uuid.uuid4())
        lti.verify()
        video = get_or_create_resource(Video, lti)
        self.assertTrue(video.show_download)

    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
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
        self.assertTrue(lti.verify())
        self.assertEqual(lti.get_consumer_site(), passport.playlist.consumer_site)
        self.assertEqual(mock_verify.call_count, 1)

    @mock.patch.object(lti_module, "verify_request_common", return_value=False)
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

    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
    @override_settings(SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"))
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
            HTTP_HOST="testserver",
        )
        self.assertEqual(request.build_absolute_uri(), "https://testserver/lti/videos/")
        lti = LTI(request, uuid.uuid4())
        lti.verify()
        self.assertEqual(mock_verify.call_args[0][0], "https://testserver/lti/videos/")

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
            f"/lti/videos/{resource_id}",
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
            f"/lti/videos/{resource_id}",
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
            f"/lti/videos/{resource_id}",
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
            f"/lti/videos/{resource_id}",
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
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertDictEqual(
            lti.get_course_info(),
            {"school_name": "ufr", "course_name": "mathematics", "course_run": None},
        )

    def test_lti_launch_presentation_locale_fallback(self):
        """Fallback on "en" locale if property is missing."""
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
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(lti.launch_presentation_locale, "en")

    @override_settings(DEFAULT_LTI_LAUNCH_PRESENTATION_LOCALE="fr")
    def test_lti_launch_presentation_locale_fallback_settings(self):
        """Fallback on defined DEFAULT_LTI_LAUNCH_PRESENTATION_LOCALE setting
        if property is missing."""
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
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(lti.launch_presentation_locale, "fr")

    def test_lti_launch_presentation_locale(self):
        """Return value from launch_presentation_locale property when present."""
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
            "launch_presentation_locale": "fr",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(lti.launch_presentation_locale, "fr")

    def test_lti_get_consumer_site_not_verified(self):
        """Calling get_consumer_site without calling verify first should throw an exception."""
        data = {
            "resource_link_id": "df7",
            "context_id": "course-v1:ufr+mathematics+0001",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        request = self.factory.post("/", data, HTTP_REFERER="https://example.com/route")
        lti = LTI(request, uuid.uuid4())

        with self.assertRaises(RuntimeError):
            lti.get_consumer_site()

    @mock.patch.object(lti_module, "verify_request_common", return_value=True)
    def test_get_consumer_site_verified(self, mock_verify):
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
        self.assertTrue(lti.verify())
        self.assertEqual(lti.get_consumer_site(), passport.consumer_site)

    def test_lti_username_edx_format(self):
        """Return username for edx request."""
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
            "lis_person_sourcedid": "jane_doe",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(lti.username, "jane_doe")

    def test_lti_username_moodle_format(self):
        """Return username for moodle request."""
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
            "lis_person_name_given": "Jane",
            "lis_person_name_family": "Doe",
            "lis_person_name_full": "Jane+Doe",
            "ext_user_username": "jane_doe",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(lti.username, "jane_doe")

    def test_lti_username_no_username(self):
        """When there is no username None should be returned."""
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
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertIsNone(lti.username)

    def test_lti_user_fullname_undefined(self):
        """Return None if lis_person_name_full is undefined."""
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
            "lis_person_name_given": "Jane",
            "lis_person_name_family": "Doe",
            "ext_user_username": "jane_doe",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(lti.user_fullname, None)

    def test_lti_user_fullname_moodle_format(self):
        """Return fullname for moodle request."""
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
            "lis_person_name_given": "Jane",
            "lis_person_name_family": "Doe",
            "lis_person_name_full": "Jane+Doe",
            "ext_user_username": "jane_doe",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(lti.user_fullname, "Jane Doe")

    def test_lti_email(self):
        """Email value is returned when present."""
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
            "lis_person_contact_email_primary": "jane@doe.me",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(lti.email, "jane@doe.me")

    def test_lti_email_no_email(self):
        """When email is missing None is returned."""
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
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver/lti-video/",
        )
        lti = LTI(request, resource_id)
        self.assertIsNone(lti.email)

    def test_lti_origin_url_edx(self):
        """Build origin_url for an edx request."""
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
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="http://testserver",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(
            lti.origin_url, "http://testserver/course/course-v1:ufr+mathematics+0001"
        )

    def test_lti_origin_url_moodle(self):
        """Build origin_url for an edx request."""
        ConsumerSiteLTIPassportFactory(
            oauth_consumer_key="ABC123", consumer_site__domain="testserver"
        )
        data = {
            "ext_lms": "moodle-2",
            "resource_link_id": "df7",
            "context_id": "1",
            "roles": "Student",
            "oauth_consumer_key": "ABC123",
        }
        resource_id = uuid.uuid4()
        request = self.factory.post(
            f"/lti/videos/{resource_id}",
            data,
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_REFERER="https://testserver/",
        )
        lti = LTI(request, resource_id)
        self.assertEqual(lti.origin_url, "https://testserver/course/view.php?id=1")
