"""Test the LTI select view."""
from html import unescape
import json
import re
from unittest import mock
import uuid

from django.test import TestCase
from django.utils import timezone

from ..factories import (
    ConsumerSiteLTIPassportFactory,
    DocumentFactory,
    PlaylistFactory,
    VideoFactory,
)
from ..lti import LTI
from ..models import LTIPassport, Playlist


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument,too-many-lines


class SelectLTIViewTestCase(TestCase):
    """Test the select LTI view in the ``core`` app of the Marsha project."""

    maxDiff = None

    def test_views_lti_select_student(self):
        """Error 403 raised if a student initiates the request."""
        passport = ConsumerSiteLTIPassportFactory()
        PlaylistFactory(consumer_site=passport.consumer_site)

        # https://www.imsglobal.org/specs/lticiv1p0/specification
        data = {
            "context_id": passport.consumer_site.playlists.first().lti_id,
            "roles": "student",
        }

        response = self.client.post(
            "/lti/select/", data, HTTP_REFERER=passport.consumer_site
        )
        self.assertEqual(response.status_code, 403)

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_select(self, mock_get_consumer_site, mock_verify):
        """Validate the context passed to the frontend app for a LTI Content selection."""
        passport = ConsumerSiteLTIPassportFactory()
        resolutions = [144]
        playlist = PlaylistFactory(consumer_site=passport.consumer_site)
        VideoFactory(
            id=1,
            playlist=playlist,
            uploaded_on=timezone.now(),
            resolutions=resolutions,
        )
        DocumentFactory(
            id=2,
            playlist=playlist,
            uploaded_on=timezone.now(),
        )

        # https://www.imsglobal.org/specs/lticiv1p0/specification
        data = {
            "content_item_return_url": "https://example.com/lti",
            "context_id": passport.consumer_site.playlists.first().lti_id,
            "roles": "Instructor,Administrator",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(
            "/lti/select/", data, HTTP_REFERER=passport.consumer_site
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")

        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )
        context = json.loads(unescape(match.group(1)))

        self.assertEqual(
            context.get("videos")[0].get("lti_url"),
            "http://testserver/lti/videos/00000000-0000-0000-0000-000000000001",
        )
        self.assertEqual(
            context.get("documents")[0].get("lti_url"),
            "http://testserver/lti/documents/00000000-0000-0000-0000-000000000002",
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
        self.assertEqual(form_data.get("lti_message_type"), "ContentItemSelection")

    @mock.patch.object(LTI, "verify")
    @mock.patch.object(LTI, "get_consumer_site")
    def test_views_lti_select_no_playlist(self, mock_get_consumer_site, mock_verify):
        """A playlist should be created if it does not exist for the current consumer site."""
        passport: LTIPassport = ConsumerSiteLTIPassportFactory()

        # https://www.imsglobal.org/specs/lticiv1p0/specification
        data = {
            "context_id": "unknown",
            "oauth_consumer_key": passport.oauth_consumer_key,
            "roles": "Instructor,Administrator",
        }

        mock_get_consumer_site.return_value = passport.consumer_site
        response = self.client.post(
            "/lti/select/", data, HTTP_REFERER=passport.consumer_site
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
            passport.consumer_site.playlists.first().lti_id, data.get("context_id")
        )

        self.assertEqual(len(context.get("videos")), 0)
        self.assertEqual(len(context.get("documents")), 0)

        # second call should not create new playlist
        self.client.post("/lti/select/", data, HTTP_REFERER=passport.consumer_site)
        self.assertEqual(Playlist.objects.count(), 1)
