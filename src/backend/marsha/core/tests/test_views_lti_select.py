"""Test the LTI select view."""
from html import unescape
import json
from logging import Logger
import random
import re
from unittest import mock
import uuid

from django.test import TestCase
from django.utils import timezone

from rest_framework_simplejwt.tokens import AccessToken

from ..factories import DocumentFactory, PlaylistFactory, VideoFactory
from ..models import Playlist
from .utils import generate_passport_and_signed_lti_parameters


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


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

        new_document_url = context.get("new_document_url")
        new_uuid = re.search(
            "http://testserver/lti/documents/(.*)", new_document_url
        ).group(1)
        self.assertEqual(uuid.UUID(new_uuid).version, 4)

        self.assertEqual(
            new_document_url, f"http://testserver/lti/documents/{new_uuid}"
        )

        self.assertEqual(
            context.get("new_video_url"), f"http://testserver/lti/videos/{new_uuid}"
        )

        form_data = context.get("lti_select_form_data")
        jwt_token = AccessToken(form_data.get("jwt"))
        lti_parameters.update({"lti_message_type": "ContentItemSelection"})
        self.assertEqual(jwt_token.get("lti_select_form_data"), lti_parameters)

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

        new_document_url = context.get("new_document_url")
        new_uuid = re.search(
            "https://testserver/lti/documents/(.*)", new_document_url
        ).group(1)
        self.assertEqual(uuid.UUID(new_uuid).version, 4)

        self.assertEqual(
            new_document_url, f"https://testserver/lti/documents/{new_uuid}"
        )

        self.assertEqual(
            context.get("new_video_url"), f"https://testserver/lti/videos/{new_uuid}"
        )

        form_data = context.get("lti_select_form_data")
        jwt_token = AccessToken(form_data.get("jwt"))
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
            response, '<meta name="public-path" value="/static/js/build/" />'
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
        lti_parameters["oauth_signature"] = "{:s}a".format(
            lti_parameters["oauth_signature"]
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
