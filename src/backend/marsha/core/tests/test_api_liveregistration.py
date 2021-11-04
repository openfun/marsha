"""Tests for the LiveRegistration API."""
from datetime import timedelta
import json
import random
import uuid

from django.test import TestCase
from django.utils import timezone

from rest_framework_simplejwt.tokens import AccessToken

from ..defaults import IDLE, RAW
from ..factories import (
    ConsumerSiteFactory,
    LiveRegistrationFactory,
    PlaylistFactory,
    UserFactory,
    VideoFactory,
)
from ..models import LiveRegistration


# pylint: disable=too-many-lines


class LiveRegistrationApiTest(TestCase):
    """Test the API of the liveRegistration object."""

    def test_api_liveregistration_read_anonymous(self):
        """Anonymous users should not be allowed to fetch a liveregistration."""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr", video=video
        )
        response = self.client.get(f"/api/liveregistrations/{liveregistration.id}/")
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_liveregistration_read_token_user_none_consumer_none(
        self,
    ):
        """Token with no user and no context_id can't read liveRegistration detail."""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            video=video,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_none_consumer_ok(
        self,
    ):
        """Token with context_id and no user's info can't read liveRegistration detail.

        If token has no email, we need the context_id leading to consumer_site and
        lti_user_id to match the registration one.
        """
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with right context_id but no email or user id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_with_email_ok_consumer_none(
        self,
    ):
        """Token with email should be allowed to read its liveRegistration detail."""
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            video=video,
        )
        # token has no context_id and good email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": liveregistration.email,
                "id": str(liveregistration.id),
                "consumer_site": None,
                "lti_user_id": None,
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_token_user_with_email_ok_consumer_ok(
        self,
    ):
        """Token with email and context_id can read its liveRegistration."""
        video = VideoFactory()
        # registration has consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token has right context_id and right email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": liveregistration.email,
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_token_user_with_email_diff_consumer_none(self):
        """Token with email can't read the registration if they don't have the right email."""
        video = VideoFactory()
        # registration has no consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            video=video,
        )
        # token has no context_id and different email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["user"] = {
            "email": "salmon@openfun.fr",
            "id": liveregistration.lti_user_id,
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_with_email_diff_consumer_ok(self):
        """Token with context_id can't read the registration if they don't have the right email."""
        video = VideoFactory()
        # registration has consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            video=video,
            consumer_site=video.playlist.consumer_site,
        )
        # token has right context_id but different email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "salmon@openfun.fr",
            "id": liveregistration.lti_user_id,
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_with_email_ok_consumer_nok_r_consumer_none(
        self,
    ):
        """Control we can only read liveregistration from the same consumer site.

        The video is portable in an other playlist portable from an other consumer site,
        the registration should not be return, if this one has been added with
        a token with no consumer_site.
        """
        video = VideoFactory()
        # registration has no consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            video=video,
        )
        # token has context_id so different consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # token has right email
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_with_email_ok_consumer_nok_r_consumer_diff(
        self,
    ):
        """Control we can only read liveregistration from the same consumer site.

        The video is portable in an other playlist portable from an other consumer site,
        the registration should not be return, if this one has been added with
        a token with a different consumer_site.
        """
        video = VideoFactory()
        other_consumer = ConsumerSiteFactory()
        # registration has consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            consumer_site=other_consumer,
            video=video,
        )
        # token has context_id but different one
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # token has right email
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_with_email_none_context_none(self):
        """Token with no email and no context_id can't read the registration."""
        video = VideoFactory()
        # registration with a consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        # token has right lti_user_id and no context_id
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # combo lti_user_id / consumer_site is needed if token has no email
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_with_email_none_context_none_r_consumer_none(
        self,
    ):
        """Token with no email and no context_id can't read this registration.

        If they're is no context_id in the token leading to no consumer site and in the
        liveRegistration, even if the lti_user_id is right in the token, it's not enough to
        access the liveRegistration detail. If token has no email and no context_id it
        won't be allowed to read the detail of the liveRegistration. This record can only be
        read with a token containing an email.
        """
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        # token has right lti_user_id and no context_id like registration
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_with_email_none_context_with_ok_userid_ok(
        self,
    ):
        """Token with no email can read its registration from the same consumer site.

        LTI users don't necessary have email. Token users with no email in token can only read
        registration if the registration has the same duo key lti_user_id and consumer_site.
        lti_user_id are only unique by consumer_site.
        """
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )

        # token with right context_id and lti_user_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": liveregistration.email,
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_token_user_with_email_none_context_with_ok_userid_wrong(
        self,
    ):
        """Token with no email can't read its registration with wrong lti informations.

        LTI users don't necessary have email. Token users with no email in token can only read
        registration if the registration has the same duo key lti_user_id and consumer_site.
        lti_user_id are only unique by consumer_site. Duo lti_user_id/consumer_site must
        match.
        """
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf0723DIFF",
            consumer_site=video.playlist.consumer_site,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # token with a different lti_user_id
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_with_email_none_context_with_nok_r_consumer_none(
        self,
    ):
        """Token with no email can't read its registration if consumer site is different.

        LTI users don't necessary have email. Token users with no email in token can only read
        registration if the registration has the same duo key lti_user_id and consumer_site.
        lti_user_id are only unique by consumer_site.
        """
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )
        other_playlist = PlaylistFactory()
        # token with different context_id and no email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_user_with_email_none_context_with_nok_r_consumer(
        self,
    ):
        """Token with no email can't read its registration with different consumer_site.

        LTI users don't necessary have email. Token users with no email in token can only read
        registration if the registration has the same duo key lti_user_id and consumer_site.
        lti_user_id are only unique by consumer_site.
        """
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )
        other_playlist = PlaylistFactory()

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        # context_id from another playlist leading to another consumer site
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_student_email_ok_context_none(self):
        """Students users can read his liveRegistration if context_id is not defined."""
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="student@aol.com",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )
        # token with no context_id and good email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "email": "student@aol.com",
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": liveregistration.email,
                "id": str(liveregistration.id),
                "consumer_site": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_student_email_ok_context_ok(self):
        """Students users should be allowed to read a liveRegistration detail if it's their own."""
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="student@aol.com",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        # token with correct context_id
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # token with correct user id and email
        jwt_token.payload["user"] = {
            "email": "student@aol.com",
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "id": str(liveregistration.id),
                "email": liveregistration.email,
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_student_email_ok_context_nok_r_consumer_none(
        self,
    ):
        """Student shouldn't be able to read a liveregistrations part of another consumer site."""
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(video=video, email="student@aol.com")

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        # token with different context_id leading to another consumer_site
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # token with correct id and email
        jwt_token.payload["user"] = {
            "email": "student@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_student_email_ok_context_nok_registration_consumer(
        self,
    ):
        """Student shouldn't be able to read a liveregistrations part of another consumer site."""
        video = VideoFactory()
        other_consumer_site = ConsumerSiteFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video, email="student@aol.com", consumer_site=other_consumer_site
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        # token with different context_id
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # token with correct id and email
        jwt_token.payload["user"] = {
            "email": "student@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_student_with_email_diff_consumer_none(
        self,
    ):
        """Student can't read the registration if they don't have the right email."""
        video = VideoFactory()
        # registration has no consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            video=video,
        )
        # token has no context_id and different email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "email": "salmon@openfun.fr",
            "id": liveregistration.lti_user_id,
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_student_with_email_diff_consumer_ok(self):
        """Student can't read the registration if they don't have the right email."""
        video = VideoFactory()
        # registration has consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            video=video,
            consumer_site=video.playlist.consumer_site,
        )
        # token has right context_id but different email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "salmon@openfun.fr",
            "id": liveregistration.lti_user_id,
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_student_email_none_context_ok_userid_ok(
        self,
    ):
        """Students users don't necessary have an email in token.

        They should be allowed to read a liveRegistration detail if they have the right
        combination of consumer_site and lti_user_id.
        """
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="student@aol.com",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        # token with right context_id and user's id
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "id": str(liveregistration.id),
                "email": "student@aol.com",
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_student_email_none_context_ok_userid_nok(
        self,
    ):
        """Students users don't necessary have an email in token.

        They can't read a liveRegistration detail if they don't have the right
        combination of consumer_site and lti_user_id.
        """
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="student@aol.com",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf0723DIFF",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # token doesn't have the right id
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_student_email_none_context_nok_registration_context_none(
        self,
    ):
        """Students users don't necessary have an email in token.

        They can't read a liveRegistration if they're not in the right context_id
        or don't have the right duo key consumer_site/lti_user_id.
        """
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="student@aol.com",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        # token has context_id
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_student_email_none_context_nok_registration_context(
        self,
    ):
        """Students users don't necessary have an email in token.

        They can't read a liveRegistration if they're not in the right context_id
        or don't have the right duo key consumer_site/lti_user_id.
        """
        other_consumer_site = ConsumerSiteFactory()
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="student@aol.com",
            consumer_site=other_consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        # context_id leading to another consumer site
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_admin_instruct_email_context_ok(self):
        """Admin/instructor can read any liveregistrations part of the context_id."""
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="different@aol.com",
            consumer_site=video.playlist.consumer_site,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "admin@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "different@aol.com",
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": liveregistration.lti_user_id,
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_admin_instruct_email_diff_context_none(self):
        """Admin/instructor can read any liveregistrations part of the context.

        Consumer site can be undefined, admin are able to read from undefined
        context only if their token has no context_id to be in the same consumer
        site.
        """
        video = VideoFactory()
        # registration with no consumer site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="different@aol.com",
        )

        # token with no context_id leading to undefined consumer site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["user"] = {
            "email": "admin@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # Admin/instructor with token with no context_id can read registration
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "id": str(liveregistration.id),
                "email": "different@aol.com",
                "consumer_site": None,
                "lti_user_id": None,
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_admin_instruct_email_context_nok_r_consumer_none(
        self,
    ):
        """Admin/instructor can't read a liveregistrations part of another consumer site."""
        video = VideoFactory()
        # registration with no consumer site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="different@aol.com",
        )
        # token with context_id leading to another consumer site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "admin@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_admin_instruct_email_context_nok_registration_consumer(
        self,
    ):
        """Admin/instructor can't read a liveregistrations part of another consumer site."""
        video = VideoFactory()
        other_consumer_site = ConsumerSiteFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="different@aol.com",
            consumer_site=other_consumer_site,
        )

        # token with context_id leading to another consumer site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "admin@openfun.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_admin_instruct_email_none_context_ok(
        self,
    ):
        """Admin/instructor users don't necessary have an email in token.

        They should be allowed to read a liveRegistration detail if they are in
        the right context_id.
        """
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="somemail@aol.com",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )
        # token with right context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf0723DIFF",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "id": str(liveregistration.id),
                "email": "somemail@aol.com",
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_admin_instruct_email_none_context_ok_but_none(
        self,
    ):
        """Admin/instructor users don't necessary have an email in token.

        They should be allowed to read a liveRegistration detail if they are in the same
        consumer site. If token has no context_id, the consumer site will not be defined.
        """
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="somemail@aol.com",
        )
        # token with no context_id leading to no consumer_site and no email defined
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf0723DIFF",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        # admin/instructor can read registrations from no consumer_site as they
        # have none defined in their token
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "somemail@aol.com",
                "id": str(liveregistration.id),
                "consumer_site": None,
                "lti_user_id": None,
                "should_send_reminders": False,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_admin_instruct_email_none_context_nok_r_consumer_none(
        self,
    ):
        """Admin/instructor can't read liveRegistration of another consumer site.

        They can read any liveRegistration detail even if it's not their own, but they
        have to be in the same consumer site otherwise it's not allowed.
        """
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="administrator@aol.com",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )
        # token with context_id leading to another consumer site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_admin_instruct_email_none_context_nok_registration_consumer(
        self,
    ):
        """Admin/instructor can't read liveRegistration of another consumer site.

        They can read any liveRegistration detail even if it's not their own, but they
        have to be in the same consumer site otherwise it's not allowed.
        """
        other_consumer_site = ConsumerSiteFactory()
        video = VideoFactory()
        # registration with a consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            email="administrator@aol.com",
            consumer_site=other_consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )

        # token with email leading to another consumer site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_wrong_video_token_context_none(self):
        """Request with wrong video in token."""
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(video=video)

        # token with no context_id leading to the same undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(uuid.uuid4())

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_wrong_video_token_context_ok(self):
        """Request with wrong video in token with right context_id."""
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site, video=video
        )
        # token with context_id leading to the same consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(uuid.uuid4())
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_other_video_context_none(self):
        """Request to read a registration for another video than the one in the token."""
        other_video = VideoFactory()
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(video=video)

        # token with no context_id leading to the same undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(other_video.id)

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_other_video_context_none_role(self):
        """Token user can't read another video than the one in the token."""
        other_video = VideoFactory()
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(video=video)

        # token with no context_id leading to the same undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(other_video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student"])
        ]
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_other_video_context_ok(self):
        """Token with context_id can't read another video than the one in the token."""
        other_video = VideoFactory()
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            consumer_site=video.playlist.consumer_site,
        )
        # token with context_id leading to the same consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(other_video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_other_video_context_ok_role(self):
        """Token with context_id can't read another video than the one in the token."""
        other_video = VideoFactory()
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            video=video,
            consumer_site=video.playlist.consumer_site,
        )
        # token with context_id leading to the same consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(other_video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student"])
        ]
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_create_anonymous(self):
        """Anonymous users should not be able to create a liveRegistration."""
        response = self.client.post("/api/liveregistrations/")
        content = json.loads(response.content)
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_liveregistration_create_role_none_token_email_none_user_none_context_none(
        self,
    ):
        """Token with no user's info can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id and no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_none_token_email_none_user_none_context_any(
        self,
    ):
        """Token with no user info can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        other_playlist = PlaylistFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        # context_id from token will be used to set the consumer_site_id
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_none_token_email_none_user_ok_context_none(
        self,
    ):
        """Token with user info, no email & no context_id can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        # token has no context_id and no email
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_none_token_email_none_user_ok_context_same(
        self,
    ):
        """Token with user info, no email & context_id can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has same context_id than the video
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_none_token_email_none_user_ok_context_diff(
        self,
    ):
        """Token with no email can create a liveRegistration from other context_id than video."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        other_playlist = PlaylistFactory()
        # token has different context_id than the video
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_none_token_email_with_user_ok_context_none(
        self,
    ):
        """Token with email should be able to create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has email and no context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_none_token_email_with_user_ok_context_same(
        self,
    ):
        """Token with user info can create a liveRegistration in the same context_id."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has email and same context_id than the video
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_none_token_email_with_user_ok_context_diff(
        self,
    ):
        """User with token from other context_id than the video can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        other_playlist = PlaylistFactory()
        # token has email and different context_id than the video
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_student_email_with_user_none_context_none(
        self,
    ):
        """Student users can create a liveRegistration with no context_id or user info in token."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has no user info and no context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_student_email_with_user_none_context_same(
        self,
    ):
        """Student can create a liveRegistration in the same context_id than the video."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has same context_id than the video and no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_student_email_with_user_none_context_diff(
        self,
    ):
        """Student from other context_id than the video can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_playlist = PlaylistFactory()
        self.assertTrue(video.is_scheduled)
        # token has different context_id than the video and no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["roles"] = ["student"]

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_student_email_with_user_with_context_none(
        self,
    ):
        """Student users should be able to create a liveRegistration with no context_id."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_student_email_with_user_with_context_same(
        self,
    ):
        """Student can create a liveRegistration in the same context_id than the video."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has same context_id than the video and user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_student_email_with_user_with_context_diff(
        self,
    ):
        """Student can create a liveRegistration in a different context_id than the video."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        other_playlist = PlaylistFactory()
        # token has same context_id than the video and user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_admin_instructor_email_with_user_none_context_diff(
        self,
    ):
        """Admin/instructors from other context_id than the video can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        other_playlist = PlaylistFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["roles"] = ["administrator", "instructor"]
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_admin_instructor_email_with_user_none_context_none(
        self,
    ):
        """Admin/Intructors can create a liveRegistration with no context_id & user in token."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["administrator", "instructor"]

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_admin_instructor_email_with_user_none_context_same(
        self,
    ):
        """Admin/Intructors can create a liveRegistration in the same context_id than the video."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["roles"] = ["administrator", "instructor"]

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_admin_instructor_email_with_user_none_context_any(
        self,
    ):
        """Admin/Intructors can create a liveRegistration linked to their token's context_id."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_playlist = PlaylistFactory()
        self.assertTrue(video.is_scheduled)
        # token has no user information
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        # context_id is different than the video one
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["roles"] = ["administrator", "instructor"]

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_admin_instructor_email_with_user_with_context_none(
        self,
    ):
        """Admin/Intructors can create a liveRegistration with no context_id."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["administrator", "instructor"]
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_admin_instructor_email_with_user_with_context_same(
        self,
    ):
        """Admin/Intructors can create a liveRegistration in the same context_id than the video."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["roles"] = ["administrator", "instructor"]
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_admin_instructor_email_with_user_with_context_diff(
        self,
    ):
        """Admin/Intructors from other context_id than the video can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_playlist = PlaylistFactory()
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["roles"] = ["administrator", "instructor"]
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_roles_same_mail_c_diff_user_no_context_no_regist(
        self,
    ):
        """Same email can be used for the same video if context_id is different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # no consumer_site
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student"])
        ]
        # leading to another consumer site
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        created_liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_roles_same_mail_c_diff_user_no_context_no_token(
        self,
    ):
        """Same email can be used for the same video if context_id is different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # registration with consumer_site
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        self.assertTrue(video.is_scheduled)
        # token with no context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student"])
        ]

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        created_liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr",
            consumer_site=None,
            video=video,
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_roles_same_mail_c_diff_user_no_context_with(
        self,
    ):
        """Same email can be used for the same video if context_id is different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # registration with consumer_site
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        other_playlist = PlaylistFactory()
        self.assertTrue(video.is_scheduled)
        # token with no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student"])
        ]
        # token with context_id leading to another consumer_site
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        created_liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr",
            consumer_site=other_playlist.consumer_site,
            video=video,
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_roles_same_mail_c_diff_user_with_context_none(
        self,
    ):
        """Same email can be used for the same video if context_id is different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        self.assertTrue(video.is_scheduled)
        # registration with consumer_site
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        # token with no context_id and user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student"])
        ]
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        created_liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr",
            consumer_site=None,
            video=video,
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_roles_same_mail_c_diff_user_with_context_with(
        self,
    ):
        """Same email can be used for the same video if context_id is different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        self.assertTrue(video.is_scheduled)
        # registration with consumer_site
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        other_playlist = PlaylistFactory()
        # token with another context_id and user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student"])
        ]
        jwt_token.payload["context_id"] = str(other_playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        created_liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr",
            consumer_site=other_playlist.consumer_site,
            video=video,
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(other_playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_role_none_restrict_email_context_none(self):
        """Users with email in their token can only register for their email."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["user"] = {
            "email": "saved@aol.com",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "notsaved@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": [
                    "You are not authorized to register with a specific email "
                    "notsaved@test-fun-mooc.fr. You can only use the email from your "
                    "authentication."
                ]
            },
        )

    def test_api_liveregistration_create_role_none_restrict_email_context_with(self):
        """Users with role and email in token can only register for their email."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["user"] = {
            "email": "saved@aol.com",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "notsaved@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": [
                    "You are not authorized to register with a specific email "
                    "notsaved@test-fun-mooc.fr. You can only use the email from your "
                    "authentication."
                ]
            },
        )

    def test_api_liveregistration_create_roles_restrict_email_context_with(self):
        """Users with role and email in token can only register for their email."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student"])
        ]
        # token with context_id
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "saved@aol.com",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "notsaved@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": [
                    "You are not authorized to register with a specific email "
                    "notsaved@test-fun-mooc.fr. You can only use the email from your "
                    "authentication."
                ]
            },
        )

    def test_api_liveregistration_create_roles_restrict_email_context_none(self):
        """Users with role and email in token can only register for their email."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student"])
        ]
        jwt_token.payload["user"] = {
            "email": "saved@aol.com",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "notsaved@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": [
                    "You are not authorized to register with a specific email "
                    "notsaved@test-fun-mooc.fr. You can only use the email from your "
                    "authentication."
                ]
            },
        )

    def test_api_liveregistration_create_cant_register_when_not_scheduled_context_none(
        self,
    ):
        """Can't register if video is not scheduled."""
        video = VideoFactory()
        self.assertFalse(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {"video": [f"video with id {str(video.id)} doesn't accept registration."]},
        )

    def test_api_liveregistration_create_cant_register_when_not_scheduled_context_with(
        self,
    ):
        """Can't register if video is not scheduled."""
        video = VideoFactory()
        self.assertFalse(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "saved@aol.com",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {"video": [f"video with id {str(video.id)} doesn't accept registration."]},
        )

    def test_api_liveregistration_create_cant_register_when_no_email(self):
        """Can't register to a scheduled video if there is no email."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.post(
            "/api/liveregistrations/",
            {"should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {"email": ["This field is required."]},
        )

    def test_api_liveregistration_create_cant_register_same_email_same_consumer(
        self,
    ):
        """Trio email/consumer_site/video must be unique."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # registration with consumer_site
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )
        self.assertTrue(video.is_scheduled)
        # token with same context_id and same email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": [
                    "salome@test-fun-mooc.fr is already registered for "
                    "this video and consumer site."
                ]
            },
        )

    def test_api_liveregistration_create_cant_register_same_email_same_consumer_none(
        self,
    ):
        """Duo email/video must be unique when consumer_site is not defined."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # registration with no consumer_site
        LiveRegistrationFactory(email="salome@test-fun-mooc.fr", video=video)
        self.assertTrue(video.is_scheduled)
        # token with no context_id leading to an undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # registration for this video with this email when consumer_site is not defined
        # already exists
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "email": [
                    "salome@test-fun-mooc.fr is already registered "
                    "for this video and consumer site."
                ]
            },
        )

    def test_api_liveregistration_create_diff_lti_info_same_email_consumer_token_email_none(
        self,
    ):
        """lti_user_id are only unique by consumer site.

        Same combination email/video/lti_user_id can be used for different consumer site.
        """
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        other_consumer_site = ConsumerSiteFactory()
        # registration with consumer_site
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=other_consumer_site,
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        # token with context_id leading to another consumer_site
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # token with same user id and no email
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(LiveRegistration.objects.count(), 2)
        # registration of same video/email/lti_user_id is possible if
        # consumer_site is different
        liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr",
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_diff_lti_info_same_email_consumer_token_email_ok(
        self,
    ):
        """lti_user_id are only unique by consumer site.

        Same combination email/video/lti_user_id can be used for different consumer site.
        """
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        other_consumer_site = ConsumerSiteFactory()
        # registration with consumer_site
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=other_consumer_site,
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        # token with context_id leading to another consumer_site
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # user has email in his token
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(LiveRegistration.objects.count(), 2)
        # registration of same video/email/lti_user_id is possible if
        # consumer_site is different
        liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr",
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_same_lti_info_diff_email_consumer_none(
        self,
    ):
        """lti_user_id is not an unique key if consumer site is not defined.

        Same lti_user_id with different email can be used for different registrations when
        consumer_site is not defined.
        """
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # no consumer_site is defined
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )
        self.assertTrue(video.is_scheduled)
        self.assertEqual(LiveRegistration.objects.count(), 1)

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        # no context_id in token
        jwt_token.payload["user"] = {
            "email": "balou@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "balou@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # lti_user_id has no constraint without consumer_site
        self.assertEqual(LiveRegistration.objects.count(), 2)
        liveregistration = LiveRegistration.objects.get(
            email="balou@test-fun-mooc.fr", video=video
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "balou@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "consumer_site": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_same_lti_info_diff_email_consumer(
        self,
    ):
        """Unicity of video/context_id/lti_user_id.

        Same combination of  video/context_id/lti_user_id can't be used for different emails
        registration. Token doesn't necessary have an email, duo context_id/lti_user_id is
        used to identify a user in this case.
        """
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        # token with no email so user can register to any email
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "balou@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # can't register because key video/context_id/lti_user_id already exists
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "lti_user_id": [
                    "This identified user is already registered "
                    "for this video and consumer site."
                ]
            },
        )

    def test_api_liveregistration_create_same_email_different_video_user_none_context_none(
        self,
    ):
        """Same email can be used for two different videos when token has no context_id."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=5),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(hours=1),
        )
        # registration with no consumer_site
        LiveRegistrationFactory(email="chantal@test-fun-mooc.fr", video=video)
        # token with no context_id leading to no consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video2.id)

        # With the same email but other video, liveregistration is possible
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "chantal@test-fun-mooc.fr", "should_send_reminders": True},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        liveregistration = LiveRegistration.objects.get(
            email="chantal@test-fun-mooc.fr", video=video2
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "chantal@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "consumer_site": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video2.id),
            },
        )

    def test_api_liveregistration_create_same_email_different_video_user_none_context_with(
        self,
    ):
        """Same email can be used for different videos when token has context_id."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=5),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(hours=1),
        )
        # registration with consumer_site
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )
        # token with right context_id and targeting video2
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video2.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)

        # With the same email but other video, liveregistration is possible
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "chantal@test-fun-mooc.fr", "should_send_reminders": True},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        liveregistration = LiveRegistration.objects.get(
            email="chantal@test-fun-mooc.fr", video=video2
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "chantal@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video2.id),
            },
        )

    def test_api_liveregistration_create_same_email_different_video_user_with_context_none(
        self,
    ):
        """Same email can be used for different videos when token has no context_id."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=5),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(hours=1),
        )
        # registration with no consumer_site
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token with no context_id and user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video2.id)
        jwt_token.payload["user"] = {
            "email": "chantal@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        # With the same email but other video, liveregistration is possible
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "chantal@test-fun-mooc.fr", "should_send_reminders": True},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        liveregistration = LiveRegistration.objects.get(
            email="chantal@test-fun-mooc.fr", video=video2
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "chantal@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "consumer_site": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video2.id),
            },
        )

    def test_api_liveregistration_create_same_email_different_video_user_with_context_with(
        self,
    ):
        """Same email can be used for different videos with token context_id/lti_user_id."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=5),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(hours=1),
        )
        # registration with consumer_site
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token with right context_id and user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video2.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "email": "chantal@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        # With the same email but other video, liveregistration is possible
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "chantal@test-fun-mooc.fr", "should_send_reminders": True},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        liveregistration = LiveRegistration.objects.get(
            email="chantal@test-fun-mooc.fr", video=video2
        )
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "chantal@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video2.id),
            },
        )

    def test_api_liveregistration_update_put_anonymous_not_allowed(self):
        """Anonymous can't update liveregistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        LiveRegistrationFactory(email="chantal@test-fun-mooc.fr", video=video)
        response = self.client.put(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_liveregistration_update_patch_anonymous_not_allowed(self):
        """Anonymous can't update liveregistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        LiveRegistrationFactory(email="chantal@test-fun-mooc.fr", video=video)

        response = self.client.patch(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_liveregistration_update_put_with_token_not_allowed(self):
        """Update method is not allowed."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        LiveRegistrationFactory(email="chantal@test-fun-mooc.fr", video=video)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.put(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(
            json.loads(response.content), {"detail": 'Method "PUT" not allowed.'}
        )

    def test_api_liveregistration_update_with_token_patch_not_allowed(self):
        """Patch update is not allowed."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        LiveRegistrationFactory(email="chantal@test-fun-mooc.fr", video=video)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.patch(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(
            json.loads(response.content), {"detail": 'Method "PATCH" not allowed.'}
        )

    def test_api_liveregistration_wrong_video_404_create(
        self,
    ):
        """Token with wrong resource_id should render a 404."""
        # token with no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(uuid.uuid4())
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_wrong_video_404_read(
        self,
    ):
        """Token with wrong resource_id should render a 404."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        liveregistration = LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )
        # token with no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(uuid.uuid4())
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_list_liveregistration_by_anonymous_user(self):
        """Anonymous users cannot fetch list requests for liveregistrations."""
        response = self.client.get("/api/liveregistrations/")
        self.assertEqual(response.status_code, 401)

    def test_list_liveregistration_role_none_email_with_consumer_none(
        self,
    ):
        """
        User with token can only fetch liveregistrations filtered by their token.

        If token has email and no context_id, liveregistrations with the same email can
        be fetched only for an undefined consumer site and for the same video.
        """
        user = UserFactory()
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # consumer_site is not defined
        liveregistration = LiveRegistrationFactory(
            email=user.email, lti_user_id=user.id, video=video
        )
        LiveRegistrationFactory(email="chantal@test-fun-mooc.fr", video=video)
        LiveRegistrationFactory(email="super@test-fun-mooc.fr", video=video)
        # liveregistration for another consumer_site
        LiveRegistrationFactory(
            email=user.email,
            lti_user_id=user.id,
            video=video,
            consumer_site=ConsumerSiteFactory(),
        )
        # liveregistration for another video and an undefined consumer_site
        LiveRegistrationFactory(email=user.email, lti_user_id=user.id, video=video2)

        # no context_id in the token leading to an undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        # email in the token
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
        }

        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": None,
                    "email": user.email,
                    "id": str(liveregistration.id),
                    "lti_user_id": str(user.id),
                    "should_send_reminders": False,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_liveregistration_role_none_email_with_consumer_with(
        self,
    ):
        """
        User with token can only fetch liveregistrations filtered by their token.

        If token has email, liveregistrations with the same email can be fetched only
        for the same video and same consumer site.
        """
        user = UserFactory()
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # consumer_site is defined
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_user_id=user.id,
            video=video,
        )
        # liveregistration for the same consumer_site, same video but other email
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@test-fun-mooc.fr",
            video=video,
        )
        # liveregistration for the same video, same email and for another consumer_site
        LiveRegistrationFactory(
            email=user.email,
            lti_user_id=user.id,
            video=video,
            consumer_site=ConsumerSiteFactory(),
        )
        # liveregistration with the same email for another video and for an undefined consumer_site
        LiveRegistrationFactory(email=user.email, lti_user_id=user.id, video=video2)

        # context_id in the token
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
        }

        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "email": user.email,
                    "id": str(liveregistration.id),
                    "lti_user_id": str(user.id),
                    "should_send_reminders": False,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_liveregistration_role_none_email_none_consumer_none(
        self,
    ):
        """
        User with token can't fetch liveregistrations if token has no email and no context_id.

        If token has no email and no context_id, the user can't read any liveregistration.
        Duo email/consumer_site or consumer_site/lti_user_id for a defined consumer_site is
        needed to read a liveregistration.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # liveregistration for the same video and lti_user_id but different consumer_site
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video,lti_user_id and undefined consumer_site
        LiveRegistrationFactory(
            email="chantal3@test-fun-mooc.fr",
            consumer_site=None,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same lti_user_id and undefined consumer_site but different video
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=None,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=other_video,
        )

        # token has no context_id leading to an undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": None,
        }
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_list_liveregistration_role_none_email_none_consumer_with(
        self,
    ):
        """
        User with token can fetch list requests but will fetch only their registrations.

        Will not receive liveregistrations other than the one corresponding to their token.
        If token has no email, the user can read liveregistrations of this video for the
        same duo consumer_site/lti_user_id.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_consumer = ConsumerSiteFactory()
        # liveregistration for the right video, lti_user_id and consumer_site
        liveregistration = LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video and lti_user_id but different consumer_site
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=other_consumer,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video and consumer_site but different lti_user_id
        LiveRegistrationFactory(
            email="chantal3@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="DIFFFF3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same lti_user_id and consumer_site but different video
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=other_consumer,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=other_video,
        )
        # liveregistration for the same video and lti_user_id but no consumer_site
        LiveRegistrationFactory(
            email="chantal4@test-fun-mooc.fr",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token has context_id and no email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": None,
        }
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "email": "chantal@test-fun-mooc.fr",
                    "id": str(liveregistration.id),
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_liveregistration_role_student_email_with_consumer_none(
        self,
    ):
        """
        Student can only fetch liveregistrations filtered by their token.

        If token has email and no context_id, liveregistrations with the same email can
        be fetched only for an undefined consumer site and for the same video.
        """
        user = UserFactory()
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # consumer_site is not defined
        liveregistration = LiveRegistrationFactory(
            email=user.email, lti_user_id=user.id, video=video
        )
        LiveRegistrationFactory(email="chantal@test-fun-mooc.fr", video=video)
        LiveRegistrationFactory(email="super@test-fun-mooc.fr", video=video)
        # liveregistration for another consumer_site
        LiveRegistrationFactory(
            email=user.email,
            lti_user_id=user.id,
            video=video,
            consumer_site=ConsumerSiteFactory(),
        )
        # liveregistration for another video and an undefined consumer_site
        LiveRegistrationFactory(email=user.email, lti_user_id=user.id, video=video2)

        # no context_id in the token leading to an undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        # email in the token
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
        }

        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": None,
                    "email": user.email,
                    "id": str(liveregistration.id),
                    "lti_user_id": str(user.id),
                    "should_send_reminders": False,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_liveregistration_role_student_email_with_consumer_with(
        self,
    ):
        """
        Student can only fetch liveregistrations filtered by their token.

        If token has email, liveregistrations with the same email can be fetched only
        for the same video and the same consumer site.
        """
        user = UserFactory()
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        video2 = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # consumer_site is defined
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_user_id=user.id,
            video=video,
        )
        # liveregistration for the same consumer_site, same video but other email
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@test-fun-mooc.fr",
            video=video,
        )

        # liveregistration for the same video, same email and for another consumer_site
        LiveRegistrationFactory(
            email=user.email,
            lti_user_id=user.id,
            video=video,
            consumer_site=ConsumerSiteFactory(),
        )
        # liveregistration with the same email for another video and for an undefined consumer_site
        LiveRegistrationFactory(email=user.email, lti_user_id=user.id, video=video2)

        # context_id in the token
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
        }

        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "email": user.email,
                    "id": str(liveregistration.id),
                    "lti_user_id": str(user.id),
                    "should_send_reminders": False,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_liveregistration_role_student_email_wrong_token_email(
        self,
    ):
        """
        Student can fetch his liveregistration even if his token has the wrong email.

        A registration already exists for this user and this consumer site, but the user token
        shows a different email, the user still should be considered as already registered.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)

        # liveregistration for the same video and lti_user_id and same consumer_site
        liveregistration = LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token doesn't have the same email than the registration
        jwt_token = AccessToken()
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": "anotheremail@test-fun.fr",
        }
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "email": "chantal@test-fun-mooc.fr",
                    "id": str(liveregistration.id),
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                }
            ],
        )

        # if we try to set a new registration with the email in the token, it won't be allowed
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "anotheremail@test-fun.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            json.loads(response.content),
            {
                "lti_user_id": [
                    "This identified user is already registered "
                    "for this video and consumer site."
                ]
            },
        )

    def test_list_liveregistration_role_student_email_none_consumer_none(
        self,
    ):
        """
        Student can't fetch liveregistrations if token has no email and no context_id.

        If token has no email and no context_id, the user can't read any liveregistration.
        Duo email/consumer_site or consumer_site/lti_user_id for a defined consumer_site is
        needed to read a liveregistration.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # liveregistration for the same video and lti_user_id but different consumer_site
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video, lti_user_id and undefined consumer_site
        LiveRegistrationFactory(
            email="chantal3@test-fun-mooc.fr",
            consumer_site=None,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same lti_user_id and undefined consumer_site but different video
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=None,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=other_video,
        )

        # token has no context_id leading to an undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": None,
        }
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_list_liveregistration_role_student_email_none_consumer_with(
        self,
    ):
        """
        Student can fetch list requests but will fetch only their registrations.

        Will not receive liveregistrations other than the one corresponding to their token.
        If token has no email, the user can read liveregistrations of this video for the
        same duo consumer_site/lti_user_id.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_consumer = ConsumerSiteFactory()
        # liveregistration for the right video, lti_user_id and consumer_site
        liveregistration = LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video and lti_user_id but different consumer_site
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=other_consumer,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video and consumer_site but different lti_user_id
        LiveRegistrationFactory(
            email="chantal3@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="DIFFFF3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same lti_user_id and consumer_site but different video
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=other_consumer,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=other_video,
        )
        # liveregistration for the same video and lti_user_id but no consumer_site
        LiveRegistrationFactory(
            email="chantal4@test-fun-mooc.fr",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token has context_id and no email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": None,
        }
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "email": "chantal@test-fun-mooc.fr",
                    "id": str(liveregistration.id),
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_liveregistration_role_admin_instruc_email_with_consumer_with(
        self,
    ):
        """
        Admin/instructor can access all registrations of this video for the same consumer_site.

        Will not receive liveregistrations other than the one corresponding to their consumer_site.
        If token has email, liveregistrations aren't filtered by this email.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_consumer = ConsumerSiteFactory()
        liveregistration = LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video and lti_user_id but different consumer_site
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=other_consumer,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same consumer_site but different video
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=other_video,
        )
        # liveregistration for the same video and consumer_site but different lti_user_id
        liveregistration2 = LiveRegistrationFactory(
            email="chantal3@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="DIFFFF3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token has context_id and email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": "chantal@test-fun-mooc.fr",
        }
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "email": "chantal3@test-fun-mooc.fr",
                    "id": str(liveregistration2.id),
                    "lti_user_id": "DIFFFF3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                },
                {
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "email": "chantal@test-fun-mooc.fr",
                    "id": str(liveregistration.id),
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                },
            ],
        )

    def test_list_liveregistration_role_admin_instruc_email_with_consumer_none(
        self,
    ):
        """
        Admin/instructor can access liveregistrations of this video with no consumer_site.

        Will not receive liveregistrations other than the one corresponding to their consumer_site.
        Token has no consumer_site, liveregistrations will be filtered by undefined consumer_site.
        Token has email, liveregistrations aren't filtered by this email.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_consumer = ConsumerSiteFactory()
        # liveregistration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video and lti_user_id but different consumer_site
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=other_consumer,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same undefined consumer_site but different video
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=other_video,
        )
        # liveregistration for the same video and consumer_site but different email and lti_user_id
        liveregistration2 = LiveRegistrationFactory(
            email="chantal3@test-fun-mooc.fr",
            consumer_site=None,
            lti_user_id="DIFFFF3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token has an email and no context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": "chantal@test-fun-mooc.fr",
        }
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": None,
                    "email": "chantal3@test-fun-mooc.fr",
                    "id": str(liveregistration2.id),
                    "lti_user_id": "DIFFFF3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                },
                {
                    "consumer_site": None,
                    "email": "chantal@test-fun-mooc.fr",
                    "id": str(liveregistration.id),
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                },
            ],
        )

    def test_list_liveregistration_role_admin_instruc_email_none_consumer_with(
        self,
    ):
        """
        Admin/instructor can access all registrations of this video for the same consumer_site.

        Will not receive liveregistrations other than the one corresponding to their consumer_site.
        Token has no email, liveregistrations aren't filtered by token's user's id.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_consumer = ConsumerSiteFactory()
        liveregistration = LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video and lti_user_id but different consumer_site
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=other_consumer,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same consumer_site but different video
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=other_video,
        )
        # liveregistration for the same video and consumer_site but different lti_user_id
        liveregistration2 = LiveRegistrationFactory(
            email="chantal3@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_user_id="DIFFFF3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token has context_id and email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": None,
        }
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "email": "chantal3@test-fun-mooc.fr",
                    "id": str(liveregistration2.id),
                    "lti_user_id": "DIFFFF3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                },
                {
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "email": "chantal@test-fun-mooc.fr",
                    "id": str(liveregistration.id),
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                },
            ],
        )

    def test_list_liveregistration_role_admin_instruc_email_none_consumer_none(
        self,
    ):
        """
        Admin/instructor can access liveregistrations of this video with no consumer_site.

        Will not receive liveregistrations other than the one corresponding to their consumer_site.
        Token has no consumer_site, liveregistrations will be filtered by undefined consumer_site.
        Token has no email, liveregistrations aren't filtered by token's user's id.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        other_consumer = ConsumerSiteFactory()
        # liveregistration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same video and lti_user_id but different consumer_site
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=other_consumer,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # liveregistration for the same undefined consumer_site but different video
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=other_video,
        )
        # liveregistration for the same video and consumer_site but different email and lti_user_id
        liveregistration2 = LiveRegistrationFactory(
            email="chantal3@test-fun-mooc.fr",
            consumer_site=None,
            lti_user_id="DIFFFF3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token has an email and no context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": "chantal@test-fun-mooc.fr",
        }
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 2)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "consumer_site": None,
                    "email": "chantal3@test-fun-mooc.fr",
                    "id": str(liveregistration2.id),
                    "lti_user_id": "DIFFFF3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                },
                {
                    "consumer_site": None,
                    "email": "chantal@test-fun-mooc.fr",
                    "id": str(liveregistration.id),
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "video": str(video.id),
                },
            ],
        )

    def test_api_liveregistration_create_role_none_email_empty(self):
        """Users with an empty email can register by setting one."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["user"] = {
            "email": "",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "saved@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            json.loads(response.content),
            {
                "email": "saved@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )
