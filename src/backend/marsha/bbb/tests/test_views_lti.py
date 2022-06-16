"""Test the file LTI view."""
import html
import json
import random
import re
from unittest import mock
import uuid

from django.test import TestCase, override_settings

import responses
from rest_framework_simplejwt.tokens import AccessToken

from marsha.core.factories import ConsumerSiteLTIPassportFactory
from marsha.core.lti import LTI

from ..factories import ClassroomFactory


# We don't enforce arguments classroomation in tests
# pylint: disable=unused-argument


@override_settings(BBB_API_ENDPOINT="https://10.7.7.1/bigbluebutton/api")
@override_settings(BBB_API_SECRET="SuperSecret")
@override_settings(BBB_ENABLED=True)
class ClassroomLTIViewTestCase(TestCase):
    """Test case for the classroom LTI view."""

    maxDiff = None

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
        jwt_token = AccessToken(context.get("jwt"))
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
        self.assertEqual(
            context.get("flags"),
            {"BBB": True, "live_raw": False, "markdown": True, "sentry": False},
        )
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "liveBackground": "/static/img/liveBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
                "svg": {
                    "icons": "/static/svg/icons.svg",
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
                    "liveBackground": "/static/img/liveBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
                "svg": {
                    "icons": "/static/svg/icons.svg",
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
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(classroom.id))
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
            },
            context.get("resource"),
        )
        self.assertEqual(context.get("modelName"), "classrooms")
        self.assertEqual(context.get("appName"), "bbb")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "liveBackground": "/static/img/liveBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
                "svg": {
                    "icons": "/static/svg/icons.svg",
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
        jwt_token = AccessToken(context.get("jwt"))
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
        self.assertEqual(
            context.get("flags"),
            {"BBB": True, "live_raw": False, "markdown": True, "sentry": False},
        )
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "liveBackground": "/static/img/liveBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
                "svg": {
                    "icons": "/static/svg/icons.svg",
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
                    "liveBackground": "/static/img/liveBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
                "svg": {
                    "icons": "/static/svg/icons.svg",
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
        jwt_token = AccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["resource_id"], str(classroom.id))
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
            },
            context.get("resource"),
        )
        self.assertEqual(context.get("modelName"), "classrooms")
        self.assertEqual(context.get("appName"), "bbb")
        self.assertEqual(
            context.get("static"),
            {
                "img": {
                    "liveBackground": "/static/img/liveBackground.png",
                    "bbbBackground": "/static/img/bbbBackground.png",
                    "bbbLogo": "/static/img/bbbLogo.png",
                },
                "svg": {
                    "icons": "/static/svg/icons.svg",
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
