"""Test the LTI select view."""
from html import unescape
import json
from logging import Logger
import random
import re
from unittest import mock

from django.conf import settings
from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.core.defaults import ENDED, IDLE, JITSI
from marsha.core.factories import DocumentFactory, PlaylistFactory, VideoFactory
from marsha.core.models import Playlist
from marsha.core.simple_jwt.tokens import LTISelectFormAccessToken, ResourceAccessToken
from marsha.core.tests.testing_utils import generate_passport_and_signed_lti_parameters


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines,too-many-locals


class SelectLTIViewTestCase(TestCase):
    """Test the select LTI view in the ``core`` app of the Marsha project."""

    maxDiff = None

    def test_views_lti_select_student(self):
        """Error 403 raised if a student initiates the request."""
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/",
            lti_parameters={
                "roles": "student",
                "content_item_return_url": "https://lti-consumer.site/lti",
                "context_id": "sent_lti_context_id",
            },
        )

        response = self.client.post(
            "/lti/select/", lti_parameters, HTTP_REFERER="https://testserver"
        )
        self.assertEqual(response.status_code, 403)

    def test_views_lti_select(self):
        """Validate the context passed to the frontend app for a LTI Content selection."""
        lti_consumer_parameters = {
            "roles": random.choice(["instructor", "administrator"]),
            "content_item_return_url": "https://lti-consumer.site/lti",
            "context_id": "sent_lti_context_id",
            "title": "Sent LMS activity title",
            "text": "Sent LMS activity text",
        }
        lti_parameters, passport = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/",
            lti_parameters=lti_consumer_parameters,
        )

        resolutions = [144]
        playlist = PlaylistFactory(
            lti_id=lti_parameters.get("context_id"),
            consumer_site=passport.consumer_site,
        )
        video = VideoFactory(
            playlist=playlist,
            uploaded_on=timezone.now(),
            resolutions=resolutions,
            position=1,
        )
        document = DocumentFactory(
            playlist=playlist,
            uploaded_on=timezone.now(),
        )
        webinar = VideoFactory(
            playlist=playlist,
            live_state=IDLE,
            live_type=JITSI,
            position=2,
        )
        vod_webinar = VideoFactory(
            playlist=playlist,
            live_state=ENDED,
            live_type=JITSI,
            position=3,
        )

        response = self.client.post(
            "/lti/select/",
            lti_parameters,
            HTTP_REFERER="http://testserver",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">',
            response.content.decode("utf-8"),
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(
            context.get("videos")[0].get("lti_url"),
            f"http://testserver/lti/videos/{video.id}",
        )
        self.assertFalse(context.get("videos")[0].get("is_live"))
        self.assertEqual(
            context.get("videos")[1].get("lti_url"),
            f"http://testserver/lti/videos/{vod_webinar.id}",
        )
        self.assertFalse(context.get("videos")[1].get("is_live"))
        self.assertEqual(len(context.get("videos")), 2)

        self.assertEqual(
            context.get("documents")[0].get("lti_url"),
            f"http://testserver/lti/documents/{document.id}",
        )
        self.assertEqual(len(context.get("documents")), 1)

        self.assertEqual(
            context.get("webinars")[0].get("lti_url"),
            f"http://testserver/lti/videos/{webinar.id}",
        )
        self.assertTrue(context.get("webinars")[0].get("is_live"))
        self.assertEqual(len(context.get("webinars")), 1)

        self.assertEqual(
            context.get("new_document_url"), "http://testserver/lti/documents/"
        )
        self.assertEqual(context.get("new_video_url"), "http://testserver/lti/videos/")
        self.assertEqual(
            context.get("lti_select_form_data").get("activity_title"),
            "Sent LMS activity title",
        )
        self.assertEqual(
            context.get("lti_select_form_data").get("activity_description"),
            "Sent LMS activity text",
        )
        self.assertIsNone(context.get("targeted_resource"))

        form_data = context.get("lti_select_form_data")
        initial_jwt_token = LTISelectFormAccessToken(form_data.get("jwt"))
        lti_parameters.update({"lti_message_type": "ContentItemSelection"})
        self.assertEqual(initial_jwt_token.get("lti_select_form_data"), lti_parameters)

        jwt_token = ResourceAccessToken(context.get("jwt"))
        self.assertEqual(
            jwt_token.get("permissions"),
            {"can_access_dashboard": False, "can_update": True},
        )

    def test_views_lti_select_video(self):
        """
        Validate the context passed to the frontend app for a LTI Content selection targeting
        video resources."""
        lti_consumer_parameters = {
            "roles": random.choice(["instructor", "administrator"]),
            "content_item_return_url": "https://lti-consumer.site/lti",
            "context_id": "sent_lti_context_id",
            "title": "Sent LMS activity title",
            "text": "Sent LMS activity text",
        }
        lti_parameters, passport = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/video/",
            lti_parameters=lti_consumer_parameters,
        )

        resolutions = [144]
        playlist = PlaylistFactory(
            lti_id=lti_parameters.get("context_id"),
            consumer_site=passport.consumer_site,
        )
        video = VideoFactory(
            playlist=playlist,
            uploaded_on=timezone.now(),
            resolutions=resolutions,
            position=1,
        )
        DocumentFactory(
            playlist=playlist,
            uploaded_on=timezone.now(),
        )
        VideoFactory(
            playlist=playlist,
            live_state=IDLE,
            live_type=JITSI,
            position=2,
        )
        vod_webinar = VideoFactory(
            playlist=playlist,
            live_state=ENDED,
            live_type=JITSI,
            position=3,
        )

        response = self.client.post(
            "/lti/select/video/",
            lti_parameters,
            HTTP_REFERER="http://testserver",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">',
            response.content.decode("utf-8"),
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(
            context.get("videos")[0].get("lti_url"),
            f"http://testserver/lti/videos/{video.id}",
        )
        self.assertEqual(
            context.get("videos")[1].get("lti_url"),
            f"http://testserver/lti/videos/{vod_webinar.id}",
        )
        self.assertEqual(len(context.get("videos")), 2)

        self.assertIsNone(context.get("documents"))
        self.assertIsNone(context.get("webinars"))
        self.assertIsNone(context.get("new_document_url"))
        self.assertEqual(context.get("new_video_url"), "http://testserver/lti/videos/")
        self.assertEqual(
            context.get("lti_select_form_data").get("activity_title"),
            "Sent LMS activity title",
        )
        self.assertEqual(
            context.get("lti_select_form_data").get("activity_description"),
            "Sent LMS activity text",
        )
        self.assertEqual(context.get("targeted_resource"), "video")

        form_data = context.get("lti_select_form_data")
        initial_jwt_token = LTISelectFormAccessToken(form_data.get("jwt"))
        lti_parameters.update({"lti_message_type": "ContentItemSelection"})
        self.assertEqual(initial_jwt_token.get("lti_select_form_data"), lti_parameters)

        jwt_token = ResourceAccessToken(context.get("jwt"))
        self.assertEqual(
            jwt_token.get("permissions"),
            {"can_access_dashboard": False, "can_update": True},
        )

    @override_settings(LTI_CONFIG_TITLE="Marsha")
    def test_views_lti_select_default_title(self):
        """Validate the context passed to the frontend app for a LTI Content selection."""
        lti_consumer_parameters = {
            "roles": random.choice(["instructor", "administrator"]),
            "content_item_return_url": "https://lti-consumer.site/lti",
            "context_id": "sent_lti_context_id",
            "title": settings.LTI_CONFIG_TITLE,
            "text": "",
        }
        lti_parameters, passport = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/",
            lti_parameters=lti_consumer_parameters,
        )

        resolutions = [144]
        playlist = PlaylistFactory(
            lti_id=lti_parameters.get("context_id"),
            consumer_site=passport.consumer_site,
        )
        video = VideoFactory(
            playlist=playlist,
            uploaded_on=timezone.now(),
            resolutions=resolutions,
        )
        document = DocumentFactory(
            playlist=playlist,
            uploaded_on=timezone.now(),
        )

        response = self.client.post(
            "/lti/select/",
            lti_parameters,
            HTTP_REFERER="http://testserver",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">',
            response.content.decode("utf-8"),
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(
            context.get("videos")[0].get("lti_url"),
            f"http://testserver/lti/videos/{video.id}",
        )
        self.assertEqual(
            context.get("documents")[0].get("lti_url"),
            f"http://testserver/lti/documents/{document.id}",
        )

        self.assertEqual(
            context.get("new_document_url"), "http://testserver/lti/documents/"
        )
        self.assertEqual(context.get("new_video_url"), "http://testserver/lti/videos/")
        self.assertEqual(
            context.get("lti_select_form_data").get("activity_title"),
            "",
        )
        self.assertEqual(
            context.get("lti_select_form_data").get("activity_description"),
            "",
        )

        form_data = context.get("lti_select_form_data")
        jwt_token = LTISelectFormAccessToken(form_data.get("jwt"))
        lti_parameters.update({"lti_message_type": "ContentItemSelection"})
        self.assertEqual(jwt_token.get("lti_select_form_data"), lti_parameters)

    @override_settings(SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"))
    def test_views_lti_select_behind_tls_termination_proxy(self):
        """Validate the context passed to the frontend app for a LTI Content selection."""
        lti_consumer_parameters = {
            "roles": random.choice(["instructor", "administrator"]),
            "content_item_return_url": "https://lti-consumer.site/lti",
            "context_id": "sent_lti_context_id",
        }
        lti_parameters, passport = generate_passport_and_signed_lti_parameters(
            url="https://testserver/lti/select/",
            lti_parameters=lti_consumer_parameters,
        )

        resolutions = [144]
        playlist = PlaylistFactory(
            lti_id=lti_parameters.get("context_id"),
            consumer_site=passport.consumer_site,
        )
        video = VideoFactory(
            playlist=playlist,
            uploaded_on=timezone.now(),
            resolutions=resolutions,
        )
        document = DocumentFactory(
            playlist=playlist,
            uploaded_on=timezone.now(),
        )

        response = self.client.post(
            "/lti/select/",
            lti_parameters,
            HTTP_REFERER="http://testserver",
            HTTP_X_FORWARDED_PROTO="https",
            HTTP_HOST="testserver",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">',
            response.content.decode("utf-8"),
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(
            context.get("videos")[0].get("lti_url"),
            f"https://testserver/lti/videos/{video.id}",
        )
        self.assertEqual(
            context.get("documents")[0].get("lti_url"),
            f"https://testserver/lti/documents/{document.id}",
        )

        self.assertEqual(
            context.get("new_document_url"), "https://testserver/lti/documents/"
        )

        self.assertEqual(context.get("new_video_url"), "https://testserver/lti/videos/")

        form_data = context.get("lti_select_form_data")
        jwt_token = LTISelectFormAccessToken(form_data.get("jwt"))
        lti_parameters.update({"lti_message_type": "ContentItemSelection"})
        self.assertEqual(jwt_token.get("lti_select_form_data"), lti_parameters)

    def test_views_lti_select_no_playlist(self):
        """A playlist should be created if it does not exist for the current consumer site."""
        lti_parameters, passport = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "https://lti-consumer.site/lti",
                "context_id": "sent_lti_context_id",
            },
        )

        response = self.client.post(
            "/lti/select/", lti_parameters, HTTP_REFERER="https://testserver"
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(Playlist.objects.count(), 1)
        self.assertEqual(
            passport.consumer_site.playlists.first().lti_id,
            lti_parameters.get("context_id"),
        )

        playlist = Playlist.objects.first()
        self.assertEqual(
            context.get("playlist"),
            {
                "id": str(playlist.id),
                "lti_id": playlist.lti_id,
                "title": playlist.title,
            },
        )
        self.assertEqual(len(context.get("videos")), 0)
        self.assertEqual(len(context.get("documents")), 0)

        # second call should not create new playlist
        self.client.post(
            "/lti/select/", lti_parameters, HTTP_REFERER="https://testserver"
        )
        self.assertEqual(Playlist.objects.count(), 1)

    def test_views_lti_select_static_base_url(self):
        """Meta tag public-path should be the STATIC_URL settings with js/build/ at the end."""
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "https://lti-consumer.site/lti",
                "context_id": "sent_lti_context_id",
            },
        )

        response = self.client.post(
            "/lti/select/", lti_parameters, HTTP_REFERER="https://testserver"
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        self.assertContains(
            response, '<meta name="public-path" value="/static/js/build/lti_site/" />'
        )

    @mock.patch.object(Logger, "warning")
    def test_views_lti_select_wrong_signature(self, mock_logger):
        """Wrong signature should display an error."""
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "https://lti-consumer.site/lti",
                "context_id": "sent_lti_context_id",
            },
        )
        lti_parameters["oauth_signature"] = f"{lti_parameters['oauth_signature']}a"

        response = self.client.post(
            "/lti/select/", lti_parameters, HTTP_REFERER="https://testserver"
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(context.get("state"), "error")
        mock_logger.assert_called_once_with(
            "OAuth error: Please check your key and secret"
        )

    @mock.patch.object(Logger, "warning")
    def test_views_lti_select_wrong_referer(self, mock_logger):
        """Wrong referer should display an error."""
        lti_parameters, _ = generate_passport_and_signed_lti_parameters(
            url="http://testserver/lti/select/",
            lti_parameters={
                "roles": random.choice(["instructor", "administrator"]),
                "content_item_return_url": "https://lti-consumer.site/lti",
                "context_id": "sent_lti_context_id",
            },
        )

        response = self.client.post(
            "/lti/select/", lti_parameters, HTTP_REFERER="https://wrongserver"
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(context.get("state"), "error")
        mock_logger.assert_called_once_with(
            "Host domain (wrongserver) does not match registered passport (testserver)."
        )
