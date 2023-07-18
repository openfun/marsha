"""Test the file LTI view."""
import html
import json
import random
import re
from unittest import mock
import uuid

from django.test import TestCase, override_settings

import responses

from marsha.bbb.factories import ClassroomFactory
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
from marsha.core.simple_jwt.tokens import ResourceAccessToken
from marsha.core.tests.testing_utils import reload_urlconf
from marsha.core.tests.views.test_lti_base import BaseLTIViewForPortabilityTestCase


# We don't enforce arguments classroomation in tests
# pylint: disable=unused-argument,too-many-locals


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomLTIViewTestCase(TestCase):
    """Test case for the classroom LTI view."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    @responses.activate
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_classroom_student(self, mock_get_consumer_site, mock_verify):
        """Validate the response returned for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        classroom = ClassroomFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )
        data = {
            "resource_link_id": classroom.lti_id,
            "context_id": classroom.playlist.lti_id,
            "roles": ["student"],
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "checksum": "7f13332ec54e7df0a02d07904746cb5b8b330498",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <running>true</running>
            </response>
            """,
            status=200,
        )

        response = self.client.post(f"/lti/classrooms/{classroom.id}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = ResourceAccessToken(context.get("jwt"))
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "classrooms")
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "username": "jane_doe",
                "user_fullname": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
            },
        )
        self.assertTrue(context.get("flags").get("BBB"))
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
            },
        )

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @responses.activate
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_classroom_instructor_no_classroom(
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <running>true</running>
            </response>
            """,
            status=200,
        )

        response = self.client.post(f"/lti/classrooms/{uuid.uuid4()}", data)
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
        self.assertEqual(context.get("modelName"), "classrooms")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
            },
        )

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @responses.activate
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_classroom_instructor_same_playlist(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        classroom = ClassroomFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )
        data = {
            "resource_link_id": classroom.lti_id,
            "context_id": classroom.playlist.lti_id,
            "roles": random.choice(["instructor", "administrator"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "checksum": "7f13332ec54e7df0a02d07904746cb5b8b330498",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <running>true</running>
            </response>
            """,
            status=200,
        )

        response = self.client.post(f"/lti/classrooms/{classroom.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = ResourceAccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(classroom.playlist.id))
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

        resource_data = context.get("resource")
        self.assertEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "meeting_id": str(classroom.meeting_id),
                "playlist": {
                    "id": str(classroom.playlist_id),
                    "lti_id": str(classroom.playlist.lti_id),
                    "title": classroom.playlist.title,
                },
                "started": False,
                "ended": False,
                "title": classroom.title,
                "description": classroom.description,
                "welcome_text": classroom.welcome_text,
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
            },
            resource_data,
        )

        self.assertEqual(context.get("modelName"), "classrooms")
        self.assertEqual(context.get("appName"), "classroom")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
            },
        )
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @responses.activate
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_classroom_connection_error(
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
        # mock_create_request.side_effect = ConnectionError

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            body=ConnectionError(),
            status=200,
        )

        with self.assertRaises(ConnectionError):
            self.client.post(f"/lti/classrooms/{uuid.uuid4()}", data)
        self.assertEqual(mock_verify.call_count, 1)

    def test_views_lti_classroom_get_request(
        self,
    ):
        """LTI GET request should not be allowed."""
        passport = ConsumerSiteLTIPassportFactory()
        classroom = ClassroomFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )

        response = self.client.get(f"/lti/classrooms/{classroom.id}")

        self.assertEqual(response.status_code, 405)


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class MeetingLTIViewTestCase(TestCase):
    """Test case for the legacy classroom (meeting) LTI view."""

    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Force URLs reload to use BBB_ENABLED
        reload_urlconf()

    @responses.activate
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_classroom_student(self, mock_get_consumer_site, mock_verify):
        """Validate the response returned for a student request."""
        passport = ConsumerSiteLTIPassportFactory()
        classroom = ClassroomFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )
        data = {
            "resource_link_id": classroom.lti_id,
            "context_id": classroom.playlist.lti_id,
            "roles": ["student"],
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "checksum": "7f13332ec54e7df0a02d07904746cb5b8b330498",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <running>true</running>
            </response>
            """,
            status=200,
        )

        response = self.client.post(f"/lti/meetings/{classroom.id}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = ResourceAccessToken(context.get("jwt"))
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "classrooms")
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "username": "jane_doe",
                "user_fullname": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
            },
        )
        self.assertTrue(context.get("flags").get("BBB"))
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
            },
        )

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @responses.activate
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_classroom_instructor_no_classroom(
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

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <running>true</running>
            </response>
            """,
            status=200,
        )

        response = self.client.post(f"/lti/meetings/{uuid.uuid4()}", data)
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
        self.assertEqual(context.get("modelName"), "classrooms")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
            },
        )

        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @responses.activate
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_classroom_instructor_same_playlist(
        self, mock_get_consumer_site, mock_verify
    ):
        """Validate the format of the response returned by the view for an instructor request."""
        passport = ConsumerSiteLTIPassportFactory()
        classroom = ClassroomFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )
        data = {
            "resource_link_id": classroom.lti_id,
            "context_id": classroom.playlist.lti_id,
            "roles": random.choice(["instructor", "administrator"]),
            "oauth_consumer_key": passport.oauth_consumer_key,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }

        mock_get_consumer_site.return_value = passport.consumer_site

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            match=[
                responses.matchers.query_param_matcher(
                    {
                        "meetingID": "7a567d67-29d3-4547-96f3-035733a4dfaa",
                        "checksum": "7f13332ec54e7df0a02d07904746cb5b8b330498",
                    }
                )
            ],
            body="""
            <response>
                <returncode>SUCCESS</returncode>
                <running>true</running>
            </response>
            """,
            status=200,
        )

        response = self.client.post(f"/lti/meetings/{classroom.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(html.unescape(match.group(1)))
        jwt_token = ResourceAccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(classroom.playlist.id))
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

        resource_data = context.get("resource")
        self.assertEqual(
            {
                "id": str(classroom.id),
                "infos": {"returncode": "SUCCESS", "running": "true"},
                "lti_id": str(classroom.lti_id),
                "meeting_id": str(classroom.meeting_id),
                "playlist": {
                    "id": str(classroom.playlist_id),
                    "lti_id": str(classroom.playlist.lti_id),
                    "title": classroom.playlist.title,
                },
                "started": False,
                "ended": False,
                "title": classroom.title,
                "description": classroom.description,
                "welcome_text": classroom.welcome_text,
                "starting_at": None,
                "estimated_duration": None,
                "recordings": [],
                "retention_date": None,
                "enable_waiting_room": False,
                "enable_chat": True,
                "enable_presentation_supports": True,
                "enable_recordings": True,
                "recording_purpose": classroom.recording_purpose,
                "enable_shared_notes": True,
                "vod_conversion_enabled": True,
                "public_token": classroom.public_token,
                "instructor_token": classroom.instructor_token,
            },
            resource_data,
        )

        self.assertEqual(context.get("modelName"), "classrooms")
        self.assertEqual(context.get("appName"), "classroom")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
            },
        )
        # Make sure we only go through LTI verification once as it is costly (getting passport +
        # signature)
        self.assertEqual(mock_verify.call_count, 1)

    @responses.activate
    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_classroom_connection_error(
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
        # mock_create_request.side_effect = ConnectionError

        responses.add(
            responses.GET,
            "https://10.7.7.1/bigbluebutton/api/getMeetingInfo",
            body=ConnectionError(),
            status=200,
        )

        with self.assertRaises(ConnectionError):
            self.client.post(f"/lti/meetings/{uuid.uuid4()}", data)
        self.assertEqual(mock_verify.call_count, 1)

    def test_views_lti_classroom_get_request(
        self,
    ):
        """LTI GET request should not be allowed."""
        passport = ConsumerSiteLTIPassportFactory()
        classroom = ClassroomFactory(
            playlist__lti_id="course-v1:ufr+mathematics+00001",
            playlist__consumer_site=passport.consumer_site,
            meeting_id="7a567d67-29d3-4547-96f3-035733a4dfaa",
        )

        response = self.client.get(f"/lti/meetings/{classroom.id}")

        self.assertEqual(response.status_code, 405)


class ClassroomLTIViewForPortabilityTestCase(BaseLTIViewForPortabilityTestCase):
    """Test the classroom LTI view for portability."""

    expected_context_model_name = "classrooms"  # resource.RESOURCE_NAME

    def _get_lti_view_url(self, resource):
        """Return the LTI view URL for the provided document."""
        return f"/lti/classrooms/{resource.pk}"

    def assertContextContainsStatic(self, context):
        """
        Assert the context contains the static URLs.
        This is overridden because the classroom view does not return the same "static".
        """
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "errorMain": "/static/img/errorTelescope.png",
                    "liveBackground": "/static/img/liveBackground.jpg",
                    "liveErrorBackground": "/static/img/liveErrorBackground.jpg",
                    "marshaWhiteLogo": "/static/img/marshaWhiteLogo.png",
                    "videoWizardBackground": "/static/img/videoWizardBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
            },
        )

    def test_views_lti_classroom_portability_for_playlist_without_owner(
        self,
    ):
        """
        Assert the application data does not provide portability information
        when playlist has no known owner
        and the authenticated user is an administrator or a teacher or a student.
        """
        classroom = ClassroomFactory()

        self.assertLTIViewReturnsNoResourceForStudent(classroom)
        self.assertLTIViewReturnsErrorForAdminOrInstructor(classroom)

    def test_views_lti_classroom_portability_for_playlist_with_owner(self):
        """
        Assert the application data provides portability information
        when playlist has a creator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_with_owner = PlaylistFactory(
            created_by=UserFactory(),
        )
        classroom = ClassroomFactory(playlist=playlist_with_owner)

        self.assertLTIViewReturnsNoResourceForStudent(classroom)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(classroom)

    def test_views_lti_classroom_portability_for_playlist_with_admin(self):
        """
        Assert the application data provides portability information
        when playlist has an administrator
        and the authenticated user is an administrator or a teacher but not a student.
        """
        playlist_access_admin = PlaylistAccessFactory(
            role=ADMINISTRATOR,
        )
        playlist_with_admin = playlist_access_admin.playlist
        classroom = ClassroomFactory(playlist=playlist_with_admin)

        self.assertLTIViewReturnsNoResourceForStudent(classroom)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(classroom)

    def test_views_lti_classroom_portability_for_playlist_with_organization_admin(
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
        classroom = ClassroomFactory(playlist=playlist_with_organization_admin)

        self.assertLTIViewReturnsNoResourceForStudent(classroom)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(classroom)

    def test_views_lti_classroom_portability_for_playlist_with_consumer_site_admin(
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
        classroom = ClassroomFactory(playlist=playlist_with_consumer_site_admin)

        self.assertLTIViewReturnsNoResourceForStudent(classroom)
        self.assertLTIViewReturnsPortabilityContextForAdminOrInstructor(classroom)
