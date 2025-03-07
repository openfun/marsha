"""Test the LTI video view."""

from html import unescape
import json
import random
import re
import uuid

from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase, override_settings

from marsha.core.defaults import STATE_CHOICES
from marsha.core.factories import VideoFactory
from marsha.core.models import ConsumerSite, Video
from marsha.core.simple_jwt.tokens import PlaylistAccessToken


# We don't enforce arguments documentation in tests
# pylint: disable=unused-argument


class DevelopmentLTIViewTestCase(TestCase):
    """Test the views in the ``core`` app of the Marsha project for development use cases.

    When developing on marsha, we are using the DevelopmentLTIView to simulate a launch request
    from an iframe in an LMS. However:
    - This simple view does not compute the LTI signature,
    - We don't want to have to create an LTI passport to make it work.

    Setting the "BYPASS_LTI_VERIFICATION" setting to True, allows Marsha to work "normally" without
    a passport and without the LTI verification. This is only allowed when DEBUG is True.
    """

    @override_settings(DEBUG=True)
    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_lti_development_post_bypass_lti_student(self):
        """In development, passport creation and LTI verification can be bypassed for a student."""
        video = VideoFactory(
            playlist__consumer_site__domain="example.com",
            upload_state=random.choice([s[0] for s in STATE_CHOICES]),
            uploaded_on="2019-09-24 07:24:40+00",
            resolutions=[144, 240],
        )
        # There is no need to provide an "oauth_consumer_key"
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "student",
            "context_title": "mathematics",
            "tool_consumer_instance_name": "ufr",
            "tool_consumer_instance_guid": "example.com",
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }
        response = self.client.post(
            f"/lti/videos/{video.pk}",
            data,
            HTTP_REFERER="https://example.com",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": "jane_doe",
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "fr_FR")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": False, "can_update": False},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertIsNotNone(context.get("resource"))
        self.assertEqual(context.get("modelName"), "videos")

    @override_settings(DEBUG=True)
    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_lti_development_post_bypass_lti_instructor(self):
        """In development, passport creation and LTI verif can be bypassed for a instructor."""
        video = VideoFactory(
            playlist__consumer_site__domain="example.com",
            playlist__title="foo bar",
            playlist__lti_id="course-v1:ufr+mathematics+00001",
        )
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": "instructor",
            "tool_consumer_instance_guid": "example.com",
            "context_title": "mathematics",
            "tool_consumer_instance_name": "ufr",
            "user_id": "56255f3807599c377bf0e5bf072359fd",
        }
        response = self.client.post(
            f"/lti/videos/{video.pk}",
            data,
            HTTP_REFERER="https://example.com",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "email": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "username": None,
                "user_fullname": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(
            jwt_token.payload["permissions"],
            {"can_access_dashboard": True, "can_update": True},
        )
        self.assertEqual(context.get("state"), "success")
        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "starting_at": None,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": video.playlist.title,
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
                "tags": [],
                "license": None,
                "upload_error_reason": None,
            },
        )
        self.assertEqual(context.get("modelName"), "videos")

    @override_settings(DEBUG=True)
    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_lti_development_post_bypass_lti_instructor_no_video(self):
        """When bypassing LTI, the "example.com" consumer site is automatically created."""
        data = {
            "resource_link_id": "example.com-123",
            "context_id": "course-v1:ufr+mathematics+00001",
            "roles": "instructor",
            "tool_consumer_instance_guid": "example.com",
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }
        response = self.client.post(
            f"/lti/videos/{uuid.uuid4()}",
            data,
            HTTP_REFERER="https://example.com",
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        jwt_token = PlaylistAccessToken(context.get("jwt"))
        video = Video.objects.get()
        self.assertEqual(jwt_token.payload["playlist_id"], str(video.playlist.id))
        self.assertEqual(
            jwt_token.payload["user"],
            {
                "username": "jane_doe",
                "user_fullname": None,
                "id": "56255f3807599c377bf0e5bf072359fd",
                "email": None,
            },
        )
        self.assertEqual(jwt_token.payload["context_id"], data["context_id"])
        self.assertEqual(jwt_token.payload["roles"], [data["roles"]])
        self.assertEqual(jwt_token.payload["locale"], "en_US")
        self.assertEqual(context.get("state"), "success")

        self.assertEqual(
            context.get("resource"),
            {
                "active_shared_live_media": None,
                "active_shared_live_media_page": None,
                "active_stamp": None,
                "allow_recording": True,
                "can_edit": True,
                "estimated_duration": None,
                "has_chat": True,
                "has_live_media": True,
                "is_public": False,
                "is_ready_to_show": False,
                "is_recording": False,
                "is_scheduled": False,
                "join_mode": "approval",
                "show_download": True,
                "description": video.description,
                "id": str(video.id),
                "is_live": False,
                "upload_state": "pending",
                "timed_text_tracks": [],
                "thumbnail": None,
                "title": video.title,
                "urls": None,
                "should_use_subtitle_as_transcript": False,
                "starting_at": None,
                "has_transcript": False,
                "participants_asking_to_join": [],
                "participants_in_discussion": [],
                "playlist": {
                    "id": str(video.playlist.id),
                    "title": "course-v1:ufr+mathematics+00001",
                    "lti_id": "course-v1:ufr+mathematics+00001",
                },
                "recording_time": 0,
                "retention_date": None,
                "shared_live_medias": [],
                "live_state": None,
                "live_info": {},
                "live_type": None,
                "xmpp": None,
                "tags": [],
                "license": None,
                "upload_error_reason": None,
            },
        )
        self.assertEqual(context.get("modelName"), "videos")
        # The consumer site was created with a name and a domain name
        ConsumerSite.objects.get(name="example.com", domain="example.com")

    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_lti_development_post_bypass_lti_no_debug_mode(self):
        """Bypassing LTI verification is only allowed in debug mode."""
        video = VideoFactory(playlist__consumer_site__domain="example.com")
        role = random.choice(["instructor", "student"])
        data = {
            "resource_link_id": video.lti_id,
            "roles": role,
            "context_id": video.playlist.lti_id,
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
        }

        with self.assertRaises(ImproperlyConfigured):
            self.client.post(f"/lti/videos/{video.pk}", data)

    @override_settings(DEBUG=True)
    @override_settings(BYPASS_LTI_VERIFICATION=True)
    def test_views_lti_development_post_bypass_lti_no_referer(self):
        """Trying to bypass LTI verification without a referer, should return an LTI error."""
        video = VideoFactory(
            playlist__consumer_site__domain="example.com", upload_state="ready"
        )
        # There is no need to provide an "oauth_consumer_key"
        data = {
            "resource_link_id": video.lti_id,
            "context_id": video.playlist.lti_id,
            "roles": random.choice(["instructor", "student"]),
            "context_title": "mathematics",
            "tool_consumer_instance_name": "ufr",
            "tool_consumer_instance_guid": "example.com",
            "user_id": "56255f3807599c377bf0e5bf072359fd",
            "lis_person_sourcedid": "jane_doe",
            "launch_presentation_locale": "fr",
        }
        response = self.client.post(f"/lti/videos/{video.pk}", data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")

        match = re.search(
            '<div id="marsha-frontend-data" data-context="(.*)">', content
        )

        context = json.loads(unescape(match.group(1)))
        self.assertEqual(context["state"], "error")
