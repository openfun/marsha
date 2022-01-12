"""Tests for the LiveRegistration API."""
from datetime import timedelta
from logging import Logger
import random
import smtplib
import time
from unittest import mock
import uuid

from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

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

    def setUp(self):
        """
        Reset the cache so that no throttles will be active
        """
        cache.clear()

    def checkRegistrationEmailSent(self, email):
        """Shortcut to check registration email has been sent to email"""
        # check email has been sent
        self.assertEqual(len(mail.outbox), 1)

        # check we send it to the the right email
        self.assertEqual(mail.outbox[0].to[0], email)

        # check it's the right email content
        self.assertEqual(mail.outbox[0].subject, _("mail_registration_object"))
        self.assertEqual(
            " ".join(mail.outbox[0].body.split()),
            f"{_('mail_registration_success')} {_('mail_registration_extra_text')} "
            f"{_('mail_registration_block2_title')} {_('mail_registration_block2_paragraph')}",
        )

    def test_api_liveregistration_read_anonymous(self):
        """Anonymous users should not be allowed to fetch a liveregistration."""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr", video=video
        )
        response = self.client.get(f"/api/liveregistrations/{liveregistration.id}/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_liveregistration_read_token_public(
        self,
    ):
        """Token from public context can't read liveRegistration detail."""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah@openfun.fr",
            video=video,
        )
        # token has no consumer_site, no context_id and no user's info
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Not found."})

    def test_api_liveregistration_read_token_public_with_anonymous(
        self,
    ):
        """Token from public context can read liveRegistration detail with
        anonyous_id parameter.
        """
        video = VideoFactory()
        anonymous_id = uuid.uuid4()
        liveregistration = LiveRegistrationFactory(
            anonymous_id=anonymous_id,
            email="sarah@openfun.fr",
            video=video,
        )
        # token has no consumer_site, no context_id and no user's info
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/?anonymous_id={anonymous_id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": liveregistration.email,
                "id": str(liveregistration.id),
                "is_registered": False,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": False,
                "username": None,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_token_lti_email_set(
        self,
    ):
        """Token from lti with email can read its liveRegistration."""
        video = VideoFactory()
        # registration has consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="sarah@openfun.fr",
            is_registered=False,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            username="John",
            video=video,
        )
        # token from LTI has context_id, consumer_site and user.id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
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
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": liveregistration.email,
                "id": str(liveregistration.id),
                "is_registered": False,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "username": "John",
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_token_lti_email_none(
        self,
    ):
        """LTI Token with no email can read its registration."""
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with right context_id and lti_user_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
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
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": liveregistration.email,
                "id": str(liveregistration.id),
                "is_registered": True,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "username": None,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_token_lti_record_email_diff(self):
        """LTI's Token can read the registration even if they don't have the right email.
        A LTI user is identified by the combinaison of consumer_site/lti_user_id/lti_id
        """
        video = VideoFactory()
        # registration has consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="sarah@openfun.fr",
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="5555",
            video=video,
        )
        # token has right context_id but different email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
        jwt_token.payload["user"] = {
            "email": "salmon@openfun.fr",
            "id": liveregistration.lti_user_id,
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        # email is the one used during registration
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": "sarah@openfun.fr",
                "id": str(liveregistration.id),
                "is_registered": True,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "5555",
                "should_send_reminders": False,
                "username": None,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_token_lti_record_consumer_none(
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
            anonymous_id=uuid.uuid4(),
            email="sarah@openfun.fr",
            video=video,
        )
        # token has context_id so different consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
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

    def test_api_liveregistration_read_token_lti_record_consumer_diff(
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
            consumer_site=other_consumer,
            email="sarah@openfun.fr",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        # token has context_id but different one
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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

    def test_api_liveregistration_read_token_lti_record_course_diff(
        self,
    ):
        """Control we can only read liveregistration from the same course.

        The video is portable in an other playlist portable from an other course,
        the registration should not be return, if this one has been added with
        a token from a different course.
        """
        video = VideoFactory()
        other_consumer = ConsumerSiteFactory()
        # registration has consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=other_consumer,
            email="sarah@openfun.fr",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        # token has context_id but different one
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths 02"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
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

    def test_api_liveregistration_read_token_lti_record_lti_user_id_diff(
        self,
    ):
        """Control we can only read liveregistration from the same user."""
        video = VideoFactory()
        # registration has consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="sarah@openfun.fr",
            lti_user_id="ID1",
            lti_id="Maths",
            video=video,
        )
        # token has context_id but different one
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths 02"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
        # token has right email
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": "ID2",
            "username": "John",
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_public_partially_lti(self):
        """Token with no email and no consumer_site can't read the registration.

        This case is not supposed to happen. A LTI connection has necessary a
        consumer_site, context_id and a lti_user_id defined in the token.
        """
        video = VideoFactory()
        # registration with a consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
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

    def test_api_liveregistration_read_token_public_partially_lti_2(
        self,
    ):
        """Token with consumer_site and no user's info can't read liveRegistration detail.

        This case is not supposed to happen. A JWT token from a LTI connection contains
        context_id, consumer_site and user's keys.
        """
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with right context_id but no email or user id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_public_partially_lti_3(self):
        """Token with email can't read the registration.

        This case is not supposed to happen. Public token has no user's information, only
        lti's connections has the key `user` in the JWT token. A JWT token from a LTI
        connection contains context_id and consumer_site keys.
        """
        video = VideoFactory()
        # registration has no consumer_site
        liveregistration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah@openfun.fr",
            video=video,
        )
        # token has no context_id and different email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["user"] = {
            "email": "sarah@openfun.fr",
            "id": liveregistration.lti_user_id,
        }

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_lti_admin_instruct_token_email_ok(self):
        """Admin/instructor can read any liveregistration part of the course."""
        video = VideoFactory()
        # registration with another email and lti_user_id
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="different@aol.com",
            is_registered=True,
            lti_id="Maths",
            lti_user_id="4444",
            username="Sam",
            video=video,
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": "different@aol.com",
                "id": str(liveregistration.id),
                "is_registered": True,
                "lti_user_id": liveregistration.lti_user_id,
                "lti_id": "Maths",
                "should_send_reminders": False,
                "username": "Sam",
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_token_lti_admin_instruct_token_email_none(
        self,
    ):
        """Admin/instructor users don't necessary have an email in token.

        They should be allowed to read a liveRegistration detail if they are in
        the right context_id and consumer_site.
        """
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="somemail@aol.com",
            is_registered=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # token with right context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "somemail@aol.com",
                "id": str(liveregistration.id),
                "is_registered": True,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths",
                "should_send_reminders": False,
                "username": None,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_read_token_lti_admin_instruct_email_diff(self):
        """Admin/instructor can't read public liveregistration.

        Admin could only read this registration, if he had no consumer_site in his token
        as he necessary has one, it's not possible.
        """
        video = VideoFactory()
        # registration with no consumer site
        liveregistration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            video=video,
            email="different@aol.com",
        )

        # token with no context_id leading to undefined consumer site
        jwt_token = AccessToken()
        jwt_token.payload["consumer_site"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.id)
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
        # Admin/instructor with token with no context_id could only read registration
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_lti_admin_instruct_record_consumer_diff(
        self,
    ):
        """Admin/instructor can't read a liveregistrations part of another consumer site."""
        video = VideoFactory()
        other_consumer_site = ConsumerSiteFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=other_consumer_site,
            email="admin@openfun.fr",
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with context_id leading to another consumer site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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

    def test_api_liveregistration_read_token_lti_admin_instruct_record_course_diff(
        self,
    ):
        """Admin/instructor can't read a liveregistration part of another course."""
        video = VideoFactory()
        other_consumer_site = ConsumerSiteFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=other_consumer_site,
            email="admin@openfun.fr",
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token with context_id leading to another consumer site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["context_id"] = "Maths 2"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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

    def test_api_liveregistration_read_token_public_wrong_video_token(self):
        """Request with wrong video in token and public token."""
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), video=video
        )

        # token with no context_id leading to the same undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(uuid.uuid4())

        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_lti_wrong_video_token(self):
        """Request with wrong video in token and LTI token."""
        video = VideoFactory()
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            lti_user_id="555",
            lti_id="Maths",
            video=video,
        )
        # token with unexisting consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(uuid.uuid4())
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf0723DIFF",
        }
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_public_other_video_context_none_role(self):
        """Public token can't read another video than the one in the token."""
        other_video = VideoFactory()
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), video=video
        )

        # token with no context_id leading to the same undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(other_video.id)
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_read_token_lti_other_video_context_none_role(self):
        """LTI token can't read another video than the one in the token."""
        other_video = VideoFactory()
        video = VideoFactory()
        # registration with no consumer_site
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            lti_user_id="555",
            lti_id="Maths",
            video=video,
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(other_video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": None,
            "id": "555",
        }
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_create_anonymous(self):
        """Anonymous users should not be able to create a liveRegistration."""
        response = self.client.post("/api/liveregistrations/")
        content = response.json()
        self.assertEqual(response.status_code, 401)
        content = response.json()
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    @mock.patch(
        "marsha.core.api.live_registration.send_mail",
        side_effect=smtplib.SMTPException("Error SMTPException"),
    )
    @mock.patch.object(Logger, "warning")
    def test_api_liveregistration_create_send_mail_fails(
        self, mock_logger, _mock_send_mail
    ):
        """send_mail fails, we make sure should_send_reminders is set to False."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id and no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        anonymous_id = uuid.uuid4()
        response = self.client.post(
            "/api/liveregistrations/",
            {
                "anonymous_id": anonymous_id,
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)
        mock_logger.assert_called_once_with(
            "registration mail %s not send", "salome@test-fun-mooc.fr"
        )

    def test_api_liveregistration_create_public_token(
        self,
    ):
        """Public token can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id and no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        anonymous_id = uuid.uuid4()
        response = self.client.post(
            "/api/liveregistrations/",
            {
                "anonymous_id": anonymous_id,
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_public_token_is_registered_false(
        self,
    ):
        """Public token can create a liveRegistration, is_registered set to False
        is ignored."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id and no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        anonymous_id = uuid.uuid4()
        response = self.client.post(
            "/api/liveregistrations/",
            {
                "anonymous_id": anonymous_id,
                "email": "salome@test-fun-mooc.fr",
                "is_registered": False,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": False,
                "username": None,
                "video": str(video.id),
            },
        )
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_public_token_anonymous_mandatory(
        self,
    ):
        """Public token has anonymous_id mandatory."""
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
            {
                "email": "salome@test-fun-mooc.fr",
                "is_registered": False,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"anonymous_id": ["Anonymous id is mandatory."]}
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_public_partially_lti1(
        self,
    ):
        """Public token with some LTI information generates an error.

        LTI token must have consumer_site, context_id and user.id, this token
        is missing the key user
        """
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
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "token": [
                    "Public token shouldn't have any LTI information, "
                    "cases are not expected."
                ]
            },
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_public_partially_lti2(
        self,
    ):
        """Public token with some LTI information generates an error.

        LTI token must have consumer_site, context_id and user.id, this token
        is missing the key context_id
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "token": [
                    "Public token shouldn't have any LTI information, "
                    "cases are not expected."
                ]
            },
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_public_partially_lti3(
        self,
    ):
        """Public token with some LTI information generates an error.

        LTI token must have consumer_site, context_id and user.id, this token
        is missing the key lti_id
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = ("Maths",)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        # token has no context_id and no email
        jwt_token.payload["user"] = {
            "email": None,
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
            response.json(),
            {
                "token": [
                    "Public token shouldn't have any LTI information, "
                    "cases are not expected."
                ]
            },
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_token_lti_email_with(
        self,
    ):
        """LTI Token can create a liveRegistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has same context_id than the video
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
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
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_token_lti_is_registered_false(
        self,
    ):
        """is_registered set to False is ignored"""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has same context_id than the video
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "salome@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "is_registered": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_token_lti_email_none(
        self,
    ):
        """LTI token with no email can create a liveRegistration."""
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
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
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
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(other_playlist.lti_id),
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_public_token_record_email_other_registration_lti(
        self,
    ):
        """Same email can be used for the same video with a public token."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # created by LTI
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        anonymous_id = uuid.uuid4()
        response = self.client.post(
            "/api/liveregistrations/",
            {
                "anonymous_id": anonymous_id,
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
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
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_user_id": None,
                "lti_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_lti_token_record_email_other_consumer_site(
        self,
    ):
        """New registration for a consumer_site different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        other_consumer_site = ConsumerSiteFactory()
        # created by LTI
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(other_consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
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
        self.assertEqual(LiveRegistration.objects.count(), 2)
        created_liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr",
            consumer_site=other_consumer_site,
            video=video,
        )
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(other_consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_lti_token_record_email_other_context_id(
        self,
    ):
        """New registration for a context_id different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # created by LTI
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths2"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
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
        self.assertEqual(LiveRegistration.objects.count(), 2)
        created_liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr",
            lti_id="Maths2",
            video=video,
        )
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths2",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_lti_token_record_email_lti_user_id(
        self,
    ):
        """New registration for a lti_id different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # created by LTI
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id="Maths",
            lti_user_id="OLD",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": None,
            "id": "NEW",
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
            lti_user_id="NEW",
            video=video,
        )

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_user_id": "NEW",
                "lti_id": "Maths",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_token_lti_email_restricted_token(self):
        """LTI token can only register for the email in the token."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
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
            response.json(),
            {
                "email": [
                    "You are not authorized to register with a specific email "
                    "notsaved@test-fun-mooc.fr. You can only use the email from your "
                    "authentication."
                ]
            },
        )
        # no mail has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_public_token_cant_register_when_not_scheduled(
        self,
    ):
        """Can't register if video is not scheduled."""
        video = VideoFactory()
        self.assertFalse(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        anonymous_id = uuid.uuid4()
        response = self.client.post(
            "/api/liveregistrations/",
            {
                "anonymous_id": anonymous_id,
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"video": [f"video with id {str(video.id)} doesn't accept registration."]},
        )

        # no mail has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_lti_token_cant_register_when_not_scheduled(
        self,
    ):
        """LTI token can't register if video is not scheduled."""
        video = VideoFactory()
        self.assertFalse(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"video": [f"video with id {str(video.id)} doesn't accept registration."]},
        )

        # no mail has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_cant_register_same_email_same_consumer(
        self,
    ):
        """Key email/consumer_site/lti_id/lti_user_id/video must be unique."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # registration with consumer_site
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        self.assertTrue(video.is_scheduled)
        # token with same context_id and same email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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
            response.json(),
            {
                "lti_user_id": [
                    "This identified user is already registered "
                    "for this video and consumer site and course."
                ]
            },
        )

        # no mail has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_can_register_same_email_same_consumer_with_deleted(
        self,
    ):
        """Key email/consumer_site/lti_id/lti_user_id/video must be unique and can be used after
        being deleted."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        self.assertTrue(video.is_scheduled)
        # registration with consumer_site
        liveregistration = LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        liveregistration.delete()
        # token with same context_id and same email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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
        self.assertEqual(LiveRegistration.objects.count(), 1)
        liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr", deleted__isnull=True
        )
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "is_registered": True,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(video.playlist.lti_id),
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_can_register_same_email_same_consumer_deleted(
        self,
    ):
        """Key email/consumer_site/lti_id/lti_user_id/video must be unique but can be
        reused if deleted is set."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        self.assertTrue(video.is_scheduled)
        # registration with consumer_site
        liveregister = LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # delete it
        liveregister.delete()
        self.assertEqual(LiveRegistration.objects.count(), 0)
        # token with same context_id and same email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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
        self.assertEqual(LiveRegistration.objects.count(), 1)
        liveregistration = LiveRegistration.objects.get(
            email="salome@test-fun-mooc.fr", deleted__isnull=True
        )
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(video.playlist.lti_id),
                "id": str(liveregistration.id),
                "is_registered": True,
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_create_cant_register_same_email_same_consumer_none(
        self,
    ):
        """Duo email/video must be unique when consumer_site is not defined."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # registration with no consumer_site
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="salome@test-fun-mooc.fr", video=video
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id leading to an undefined consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.post(
            "/api/liveregistrations/",
            {
                "anonymous_id": uuid.uuid4(),
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # registration for this video with this email when consumer_site is not defined
        # already exists
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "email": [
                    "salome@test-fun-mooc.fr is already registered for "
                    "this video, consumer site and course."
                ]
            },
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_same_lti_info_diff_email_consumer(
        self,
    ):
        """Unicity of video/consumer_site/lti_id/lti_user_id.

        Combination of video/consumer_site/lti_id/lti_user_id can't be used for different
        emails."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        LiveRegistrationFactory(
            email="salome@test-fun-mooc.fr",
            video=video,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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
            response.json(),
            {
                "lti_user_id": [
                    "This identified user is already registered "
                    "for this video and consumer site and course."
                ]
            },
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_api_liveregistration_create_public_token_same_email_different_video(
        self,
    ):
        """Same email can be used for two different videos with public token."""
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
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr", video=video
        )
        # token with no context_id leading to no consumer_site
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video2.id)

        anonymous_id = uuid.uuid4()
        # With the same email but other video, liveregistration is possible
        response = self.client.post(
            "/api/liveregistrations/",
            {
                "anonymous_id": anonymous_id,
                "email": "chantal@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveRegistration.objects.count(), 2)
        liveregistration = LiveRegistration.objects.get(
            email="chantal@test-fun-mooc.fr", video=video2
        )
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "chantal@test-fun-mooc.fr",
                "lti_user_id": None,
                "lti_id": None,
                "id": str(liveregistration.id),
                "is_registered": True,
                "should_send_reminders": True,
                "username": None,
                "video": str(video2.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("chantal@test-fun-mooc.fr")

    def test_api_liveregistration_create_token_lti_same_email_different_video(
        self,
    ):
        """Same email can be used for different videos with LTI token."""
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
            consumer_site=video.playlist.consumer_site,
            email="chantal@test-fun-mooc.fr",
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video2.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": None,
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
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "chantal@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "is_registered": True,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video2.id),
            },
        )

        # check email has been sent
        self.checkRegistrationEmailSent("chantal@test-fun-mooc.fr")

    def test_api_liveregistration_create_username_doesnt_change(
        self,
    ):
        """Field username is not taken into account in the post request"""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/",
            {
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
                "username": "Sabrina",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent("salome@test-fun-mooc.fr")

    def test_api_liveregistration_delete_anonymous(self):
        """An anonymous should not be able to delete a liveregistration."""
        liveregistration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            email="chantal@test-fun-mooc.fr",
            video=VideoFactory(),
        )
        response = self.client.delete(
            f"/api/liveregistration/{liveregistration.id}/",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_delete_token_lti(self):
        """A student should not be able to delete a document."""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@test-fun-mooc.fr",
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["permissions"] = {"can_update": True}
        jwt_token.payload["user"] = {
            "email": "chantal@test-fun-mooc.fr",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.delete(
            f"/api/liveregistration/{liveregistration.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_liveregistration_update_put_anonymous_not_allowed(self):
        """Anonymous can't update liveregistration."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr", video=video
        )
        response = self.client.put(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        content = response.json()
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
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr", video=video
        )

        response = self.client.patch(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        content = response.json()
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
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr", video=video
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.put(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json(), {"detail": 'Method "PUT" not allowed.'})

    def test_api_liveregistration_update_with_token_patch_not_allowed(self):
        """Patch update is not allowed."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr", video=video
        )
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)

        response = self.client.patch(
            "/api/liveregistrations/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json(), {"detail": 'Method "PATCH" not allowed.'})

    def test_api_liveregistration_create_with_unknown_video(
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

    def test_api_liveregistration_read_detail_unknown_video(
        self,
    ):
        """Token with wrong resource_id should render a 404."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        liveregistration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            email="salome@test-fun-mooc.fr",
            video=video,
        )
        # token with no user informations
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(uuid.uuid4())
        response = self.client.get(
            f"/api/liveregistrations/{liveregistration.id}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_list_liveregistration_by_anonymous_user(self):
        """Anonymous users cannot fetch list requests for liveregistrations."""
        response = self.client.get("/api/liveregistrations/")
        self.assertEqual(response.status_code, 401)

    def test_list_liveregistration_public_token(
        self,
    ):
        """
        Public token can't fetch any liveregistration if there is no anonymous_id.
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
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email=user.email, video=video
        )
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr", video=video
        )
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="super@test-fun-mooc.fr", video=video
        )
        # liveregistration for another consumer_site
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            lti_user_id=user.id,
            lti_id="Maths",
            video=video,
            consumer_site=ConsumerSiteFactory(),
        )
        # liveregistration for another video
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email=user.email, video=video2
        )

        # public token
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_api_liveregistration_list_throttling(self):
        """Throttling should prevent more than three requests per minute."""
        # first 3 requests shouldn't be throttled
        for _i in range(3):
            video = VideoFactory()
            jwt_token = AccessToken()
            jwt_token.payload["resource_id"] = str(video.id)

            response = self.client.get(
                f"/api/liveregistrations/?anonymous_id={uuid.uuid4()}",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 0)

        # fourth request should be throttled
        response = self.client.get(
            f"/api/liveregistrations/?anonymous_id={uuid.uuid4()}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 429)
        self.assertEqual(
            response.json(),
            {"detail": "Request was throttled. Expected available in 60 seconds."},
        )

        # resetting throttling by mocking timer used by DRF in AnonRateThrottle
        with mock.patch.object(time, "time", return_value=time.time() + 60):
            # first 3 requests shouldn't be throttled
            for _i in range(3):
                response = self.client.get(
                    f"/api/liveregistrations/?anonymous_id={uuid.uuid4()}",
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["count"], 0)

            # fourth request should be throttled
            response = self.client.get(
                f"/api/liveregistrations/?anonymous_id={uuid.uuid4()}",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 429)
            self.assertEqual(
                response.json(),
                {"detail": "Request was throttled. Expected available in 60 seconds."},
            )

    def test_api_liveregistration_list_throttling_no_anonymous(self):
        """Throttling is not called if anonymous_id is not used."""
        # first 3 requests shouldn't be throttled
        for _i in range(3):
            video = VideoFactory()
            jwt_token = AccessToken()
            jwt_token.payload["resource_id"] = str(video.id)

            response = self.client.get(
                "/api/liveregistrations/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 0)

        # fourth request shouldn't be throttled
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_list_liveregistration_public_token_anonymous(
        self,
    ):
        """
        Public token can fetch is liveregistration if there is an anonymous_id.
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
        anonymous_id = uuid.uuid4()
        liveregistration = LiveRegistrationFactory(
            anonymous_id=anonymous_id, email=user.email, video=video
        )
        # another anonymous_id for the same video
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="chantal@test-fun-mooc.fr", video=video
        )

        # liveregistration for a LTI connection
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            lti_user_id=user.id,
            lti_id="Maths",
            video=video,
            consumer_site=ConsumerSiteFactory(),
        )
        # liveregistration for another video with the same anonymous_id
        LiveRegistrationFactory(
            anonymous_id=anonymous_id, email=user.email, video=video2
        )

        # public token
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.get(
            f"/api/liveregistrations/?anonymous_id={anonymous_id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)

        self.assertEqual(
            response.json()["results"],
            [
                {
                    "anonymous_id": str(anonymous_id),
                    "consumer_site": None,
                    "display_name": None,
                    "email": user.email,
                    "id": str(liveregistration.id),
                    "is_registered": False,
                    "lti_user_id": None,
                    "lti_id": None,
                    "should_send_reminders": False,
                    "username": None,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_liveregistration_lti_token_role_none(
        self,
    ):
        """
        User with LTI token can only fetch liveregistrations filtered by their token.

        Liveregistrations can be fetched  for the same video, same consumer site and
        same context_id. Token can have or not an email, result won't be filtered on
        email.
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
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths",
            lti_user_id=str(user.id),
            username=user.username,
            video=video,
        )
        # liveregistration with different lti_user
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths",
            lti_user_id="5555",
            video=video,
        )
        # liveregistration with another consumer_site
        LiveRegistrationFactory(
            consumer_site=ConsumerSiteFactory(),
            email=user.email,
            lti_id="Maths",
            lti_user_id=str(user.id),
            video=video,
        )
        # liveregistration with another context_id
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths2",
            lti_user_id=str(user.id),
            video=video,
        )
        # liveregistration for another video
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths",
            lti_user_id=str(user.id),
            video=video2,
        )
        # liveregistration with the same email with no consumer_site
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email=user.email, video=video
        )
        # liveregistration with the same email for another video
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email=user.email, video=video2
        )

        # context_id in the token
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["student", ""])]
        # results aren't filtered by email
        jwt_token.payload["user"] = {
            "id": str(user.id),
            "username": user.username,
            "email": random.choice([user.email, ""]),
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
                    "anonymous_id": None,
                    "consumer_site": str(video.playlist.consumer_site.id),
                    "display_name": None,
                    "email": user.email,
                    "id": str(liveregistration.id),
                    "is_registered": False,
                    "lti_user_id": str(user.id),
                    "lti_id": "Maths",
                    "should_send_reminders": False,
                    "username": user.username,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_liveregistration_lti_token_role_admin_instructeurs(
        self,
    ):
        """
        Admin/Intstructors can only fetch liveregistrations depending of their token.

        They can only fetch liveregistrations for the same video, same consumer site
        and same context_id.
        """

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
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="user1@test.fr",
            is_registered=True,
            lti_id="Maths",
            lti_user_id="1111",
            video=video,
        )
        # liveregistration with different lti_user
        liveregistration2 = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="user2@test.fr",
            is_registered=False,
            lti_id="Maths",
            lti_user_id="2222",
            video=video,
        )
        # liveregistration with another consumer_site
        LiveRegistrationFactory(
            consumer_site=ConsumerSiteFactory(),
            email="user3@test.fr",
            lti_id="Maths",
            lti_user_id="3333",
            video=video,
        )
        # liveregistration with another context_id
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="user4@test.fr",
            lti_id="Maths2",
            lti_user_id="4444",
            video=video,
        )
        # liveregistration for another video
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="user5@test.fr",
            lti_id="Maths",
            lti_user_id="5555",
            video=video2,
        )
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="user1@test.fr", video=video
        )
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="user1@test.fr", video=video2
        )

        # context_id in the token
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [random.choice(["administrator", "instructor"])]
        jwt_token.payload["user"] = {
            "id": "8888",
            "username": "admin",
            "email": "admin@test.fr",
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
                    "anonymous_id": None,
                    "consumer_site": str(liveregistration.consumer_site.id),
                    "display_name": None,
                    "email": liveregistration.email,
                    "id": str(liveregistration.id),
                    "is_registered": True,
                    "lti_user_id": liveregistration.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": False,
                    "username": liveregistration.username,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": None,
                    "consumer_site": str(liveregistration2.consumer_site.id),
                    "display_name": None,
                    "email": liveregistration2.email,
                    "id": str(liveregistration2.id),
                    "is_registered": False,
                    "lti_user_id": liveregistration2.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": False,
                    "username": liveregistration2.username,
                    "video": str(video.id),
                },
            ],
        )

    def test_list_liveregistration_role_student_email_wrong_token_email(
        self,
    ):
        """
        Student can fetch his liveregistration even if his token has the wrong email.

        A registration already exists for this user, this consumer site and context_id,
        but the user token shows a different email and username, the user still should
        be considered as already registered.
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
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token doesn't have the same email than the registration
        jwt_token = AccessToken()
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
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
                    "anonymous_id": None,
                    "consumer_site": str(video.playlist.consumer_site.id),
                    "display_name": None,
                    "email": "chantal@test-fun-mooc.fr",
                    "id": str(liveregistration.id),
                    "is_registered": False,
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "lti_id": str(video.playlist.lti_id),
                    "should_send_reminders": False,
                    "username": None,
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
            response.json(),
            {
                "lti_user_id": [
                    "This identified user is already registered "
                    "for this video and consumer site and course."
                ]
            },
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
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["user"] = {
            "email": "",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }

        response = self.client.post(
            "/api/liveregistrations/",
            {"email": "saved@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "saved@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "is_registered": True,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )

    def test_list_liveregistration_token_lti_wrong_is_registered_field(
        self,
    ):
        """
        Lti token can fetch list requests but will fetch only his registration.
        A registration without the flag is_registered set to True is not returned by
        liveregistrations API endpoint if it's filtered with flag is_registered.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # liveregistration for the right video, lti_user_id and consumer_site
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            is_registered=False,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )

        # token has context_id and no email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = ["student"]
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Chachou",
            "email": "chantal@test-fun-mooc.fr",
        }
        response = self.client.get(
            "/api/liveregistrations/?is_registered=True",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_list_liveregistration_role_admin_instruc_email_with_consumer_with_no_filtered(
        self,
    ):
        """
        Admin/instructor can access all registrations that are registered or not.
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
            is_registered=False,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        # liveregistration for the same video and lti_user_id but different consumer_site
        LiveRegistrationFactory(
            email="chantal2@test-fun-mooc.fr",
            consumer_site=other_consumer,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            is_registered=True,
            video=video,
        )
        # liveregistration for the same consumer_site but different video
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=other_video,
        )
        # liveregistration for the same video and consumer_site but different lti_user_id
        liveregistration2 = LiveRegistrationFactory(
            email="chantal3@test-fun-mooc.fr",
            is_registered=True,
            consumer_site=video.playlist.consumer_site,
            lti_user_id="DIFFFF3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        # liveregistration for different lti_id
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            is_registered=False,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths 2",
            video=video,
        )
        # liveregistration for this video but not without is_registered set to False
        liveregistration3 = LiveRegistrationFactory(
            email="chantal4@test-fun-mooc.fr",
            is_registered=False,
            consumer_site=video.playlist.consumer_site,
            lti_user_id="NEWDIFFFF3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        # token has context_id and email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
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
        self.assertEqual(response.json()["count"], 3)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "anonymous_id": None,
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "display_name": None,
                    "email": liveregistration.email,
                    "id": str(liveregistration.id),
                    "is_registered": False,
                    "lti_id": "Maths",
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "username": None,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": None,
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "display_name": None,
                    "email": liveregistration2.email,
                    "id": str(liveregistration2.id),
                    "is_registered": True,
                    "lti_id": "Maths",
                    "lti_user_id": "DIFFFF3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "username": None,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": None,
                    "consumer_site": str(video.playlist.consumer_site_id),
                    "display_name": None,
                    "email": liveregistration3.email,
                    "id": str(liveregistration3.id),
                    "is_registered": False,
                    "lti_id": "Maths",
                    "lti_user_id": "NEWDIFFFF3807599c377bf0e5bf072359fd",
                    "should_send_reminders": False,
                    "username": None,
                    "video": str(video.id),
                },
            ],
        )

    def test_api_liveregistration_post_attendance_no_payload(self):
        """Request without payload should raise an error."""
        response = self.client.post(
            "/api/liveregistrations/push_attendance/",
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_liveregistration_post_attendance_no_attendance(self):
        """Request without attendance should raise an error."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "id": "5555555",
        }
        response = self.client.post(
            "/api/liveregistrations/push_attendance/",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_liveregistration_post_attendance_token_lti_email_none_previous_none(
        self,
    ):
        """Endpoint push_attendance works with no email and no previous record."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["context_id"] = str(video.playlist.lti_id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": None,
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        response = self.client.post(
            "/api/liveregistrations/push_attendance/",
            {"live_attendance": {"data": "test"}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(
            response.json(),
            {
                "id": str(created_liveregistration.id),
                "live_attendance": {"data": "test"},
                "video": str(video.id),
            },
        )
        self.assertEqual(
            created_liveregistration.consumer_site, video.playlist.consumer_site
        )
        self.assertEqual(
            created_liveregistration.lti_user_id, "56255f3807599c377bf0e5bf072359fd"
        )
        self.assertEqual(created_liveregistration.email, None)
        self.assertEqual(created_liveregistration.username, "Token")
        self.assertEqual(created_liveregistration.live_attendance, {"data": "test"})
        self.assertEqual(created_liveregistration.is_registered, False)

    def test_api_liveregistration_post_attendance_token_lti_existing_record(
        self,
    ):
        """Endpoint push_attendance updates an existing record."""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email=None,
            is_registered=False,
            live_attendance={"key1": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        jwt_token = AccessToken()
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "chantal@aol.com",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }
        timestamp = str(timezone.now())
        response = self.client.post(
            "/api/liveregistrations/push_attendance/",
            {"live_attendance": {timestamp: {"sound": "ON", "tabs": "OFF"}}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        liveregistration.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": str(liveregistration.id),
                "live_attendance": {
                    "key1": {"sound": "OFF", "tabs": "OFF"},
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                },
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveRegistration.objects.count(), 1)
        # update username and email with current token
        self.assertEqual(liveregistration.email, "chantal@aol.com")
        self.assertEqual(liveregistration.username, "Token")
        self.assertEqual(
            liveregistration.live_attendance,
            {
                "key1": {"sound": "OFF", "tabs": "OFF"},
                timestamp: {"sound": "ON", "tabs": "OFF"},
            },
        )

    def test_api_liveregistration_post_attendance_token_public(
        self,
    ):
        """Can't create attendance when it's not a LTI token"""
        video = VideoFactory()
        self.assertEqual(LiveRegistration.objects.count(), 0)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.post(
            "/api/liveregistrations/push_attendance/",
            {"live_attendance": {"k2": "v2"}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(LiveRegistration.objects.count(), 0)
        self.assertEqual(
            response.json(),
            {"detail": "Attendance from public video is not implemented yet."},
        )

    def test_api_liveregistration_post_attendance_token_ok_user_record_empty_attendance(
        self,
    ):
        """Endpoint push_attendance updates an existing record without previous live_attendance."""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@aol.com",
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        self.assertEqual(liveregistration.live_attendance, None)
        jwt_token = AccessToken()
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "chantal@aol.com",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "Token",
        }

        response = self.client.post(
            "/api/liveregistrations/push_attendance/",
            {"live_attendance": {"key1": "val1"}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        liveregistration.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": str(liveregistration.id),
                "live_attendance": {"key1": "val1"},
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveRegistration.objects.count(), 1)

        # liveregistration object updated with data from the token
        self.assertEqual(liveregistration.email, "chantal@aol.com")
        self.assertEqual(liveregistration.username, "Token")
        # live_attendance has been set
        self.assertEqual(liveregistration.live_attendance, {"key1": "val1"})

    def test_api_liveregistration_post_attendance_token_lti_no_update_username_email_none(
        self,
    ):
        """Endpoint push_attendance matches record and doesn't update email and username
        if they are not defined in the token"""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@aol.com",
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        self.assertEqual(liveregistration.live_attendance, None)
        jwt_token = AccessToken()
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "id": "56255f3807599c377bf0e5bf072359fd",
        }

        response = self.client.post(
            "/api/liveregistrations/push_attendance/",
            {"live_attendance": {"key1": "val1"}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        liveregistration.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": str(liveregistration.id),
                "live_attendance": {"key1": "val1"},
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveRegistration.objects.count(), 1)

        # liveregistration object updated with data from the token
        self.assertEqual(liveregistration.email, "chantal@aol.com")
        self.assertEqual(liveregistration.username, "Sylvie")
        # live_attendance has been set
        self.assertEqual(liveregistration.live_attendance, {"key1": "val1"})

    def test_api_liveregistration_post_attendance_token_lti_no_update_username_email_empty(
        self,
    ):
        """Endpoint push_attendance matches record and doesn't update email and username
        if they are empty in the token"""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@aol.com",
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        self.assertEqual(liveregistration.live_attendance, None)
        jwt_token = AccessToken()
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "",
            "id": "56255f3807599c377bf0e5bf072359fd",
            "username": "",
        }

        response = self.client.post(
            "/api/liveregistrations/push_attendance/",
            {"live_attendance": {"key1": "val1"}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        liveregistration.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "id": str(liveregistration.id),
                "live_attendance": {"key1": "val1"},
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveRegistration.objects.count(), 1)

        # liveregistration object updated with data from the token
        self.assertEqual(liveregistration.email, "chantal@aol.com")
        self.assertEqual(liveregistration.username, "Sylvie")
        # live_attendance has been set
        self.assertEqual(liveregistration.live_attendance, {"key1": "val1"})

    def test_api_liveregistration_post_attendance_token_with_could_match_other_records(
        self,
    ):
        """Match the record with the combinaison consumer_site/lti_id/lti_user_id/video."""
        video = VideoFactory()
        video2 = VideoFactory()
        # different email and username than the token
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="another@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        # same email and username but no consumer_site
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            consumer_site=None,
            display_name="Token",
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id=None,
            lti_id=None,
            video=video,
        )
        # not the same consumer_site
        LiveRegistrationFactory(
            consumer_site=ConsumerSiteFactory(),
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths",
            video=video,
        )
        # not the same context_id
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths2",
            video=video,
        )
        # not the same lti_user_id
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="sabrina@fun-test.fr",
            live_attendance={"r1": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="444444",
            lti_id="Maths",
            video=video,
        )

        # not the same video
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths",
            video=video2,
        )
        nb_created = 6
        self.assertEqual(LiveRegistration.objects.count(), nb_created)
        # token with no context_id and same email
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "sabrina@fun-test.fr",
            "id": "55555",
            "username": "Token",
        }
        timestamp = str(timezone.now())
        response = self.client.post(
            "/api/liveregistrations/push_attendance/",
            {"live_attendance": {timestamp: {"sound": "ON", "tabs": "OFF"}}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        liveregistration.refresh_from_db()
        # no new record
        self.assertEqual(LiveRegistration.objects.count(), nb_created)

        self.assertEqual(
            response.json(),
            {
                "id": str(liveregistration.id),
                "live_attendance": {
                    "r2": {"sound": "OFF", "tabs": "OFF"},
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                },
                "video": str(video.id),
            },
        )
        self.assertEqual(liveregistration.email, "sabrina@fun-test.fr")
        self.assertEqual(liveregistration.lti_user_id, "55555")
        self.assertEqual(liveregistration.lti_id, "Maths")
        self.assertEqual(liveregistration.username, "Token")

        self.assertEqual(
            liveregistration.live_attendance,
            {
                "r2": {"sound": "OFF", "tabs": "OFF"},
                timestamp: {"sound": "ON", "tabs": "OFF"},
            },
        )
        self.assertEqual(liveregistration.consumer_site, video.playlist.consumer_site)

    def test_api_liveregistration_put_username_public_no_anonymous(
        self,
    ):
        """Field anonymous_id is mandatory."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_liveregistration_put_username_public_no_anonymous_no_displayname(
        self,
    ):
        """Field display_name is mandatory."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": uuid.uuid4()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_liveregistration_put_username_public_registration_existing(
        self,
    ):
        """Should update the display_name with the new value."""
        video = VideoFactory()
        anonymous_id = uuid.uuid4()
        liveregistration = LiveRegistrationFactory(
            anonymous_id=anonymous_id, display_name="Samuel", video=video
        )

        self.assertEqual(LiveRegistration.objects.count(), 1)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": anonymous_id, "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        liveregistration.refresh_from_db()
        # no new record
        self.assertEqual(LiveRegistration.objects.count(), 1)

        self.assertEqual(
            response.json(),
            {"display_name": "Antoine", "username": None},
        )
        self.assertEqual(liveregistration.display_name, "Antoine")

    def test_api_liveregistration_put_username_public_registration_exists_other_video(
        self,
    ):
        """Token is related to a specific video.
        We make sure that for the same anonymous_id we can't update data from other videos
        than the one refered in the token.
        """
        video = VideoFactory()
        video2 = VideoFactory()
        anonymous_id = uuid.uuid4()
        LiveRegistrationFactory(
            anonymous_id=anonymous_id, display_name="Samuel", video=video2
        )

        self.assertEqual(LiveRegistration.objects.count(), 1)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": anonymous_id, "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        # a new record has been created
        self.assertEqual(LiveRegistration.objects.count(), 2)
        self.assertEqual(
            response.json(),
            {"display_name": "Antoine", "username": None},
        )
        created_liveregistration = LiveRegistration.objects.get(video=video)
        self.assertEqual(created_liveregistration.display_name, "Antoine")
        self.assertEqual(created_liveregistration.username, None)
        self.assertEqual(created_liveregistration.anonymous_id, anonymous_id)

    def test_api_liveregistration_put_username_public_registration_no(
        self,
    ):
        """Should create a liveregistration as no previous one exists."""
        video = VideoFactory()
        anonymous_id = uuid.uuid4()

        self.assertEqual(LiveRegistration.objects.count(), 0)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": anonymous_id, "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        # new record
        self.assertEqual(LiveRegistration.objects.count(), 1)

        self.assertEqual(
            response.json(),
            {"display_name": "Antoine", "username": None},
        )
        created_liveregistration = LiveRegistration.objects.last()
        self.assertEqual(created_liveregistration.display_name, "Antoine")
        self.assertEqual(created_liveregistration.username, None)
        self.assertEqual(created_liveregistration.anonymous_id, anonymous_id)

    def test_api_liveregistration_put_username_public_already_exists(
        self,
    ):
        """display_name already exists should return a 409."""
        video = VideoFactory()
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), display_name="Samuel", video=video
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": uuid.uuid4(), "display_name": "Samuel"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json(),
            {"display_name": "User with that username already exists!"},
        )

    def test_api_liveregistration_put_username_lti_no_anonymous(
        self,
    ):
        """Field anonymous_id is mandatory."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "sabrina@fun-test.fr",
            "id": "55555",
            "username": "Token",
        }
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_liveregistration_put_username_lti_no_anonymous_no_displayname(
        self,
    ):
        """Field display_name is mandatory."""
        video = VideoFactory()
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "sabrina@fun-test.fr",
            "id": "55555",
            "username": "Token",
        }
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": uuid.uuid4()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_liveregistration_put_username_lti_registration_exists(
        self,
    ):
        """Should return the right information with existing record."""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )

        self.assertEqual(LiveRegistration.objects.count(), 1)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "sabrina@fun-test.fr",
            "id": "55555",
            "username": "Token",
        }
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": uuid.uuid4(), "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        liveregistration.refresh_from_db()
        # no new record
        self.assertEqual(LiveRegistration.objects.count(), 1)

        # username has been updated with current information in the token
        self.assertEqual(
            response.json(),
            {"display_name": "Antoine", "username": "Token"},
        )
        self.assertEqual(liveregistration.display_name, "Antoine")
        # username has been updated with current information in the token
        self.assertEqual(liveregistration.username, "Token")
        # email has been updated with current information in the token
        self.assertEqual(liveregistration.email, "sabrina@fun-test.fr")
        self.assertEqual(liveregistration.video.id, video.id)

    def test_api_liveregistration_put_username_lti_registration_exists_other_video(
        self,
    ):
        """Token is related to a specific video.
        We make sure that for the same anonymous_id we can't read data from other videos
        than the one refered in the token.
        """
        video = VideoFactory()
        video2 = VideoFactory()
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video2,
        )

        self.assertEqual(LiveRegistration.objects.count(), 1)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "sabrina@fun-test.fr",
            "id": "55555",
            "username": "Patou",
        }
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": uuid.uuid4(), "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        # a new record has been created
        self.assertEqual(LiveRegistration.objects.count(), 2)
        self.assertEqual(
            response.json(),
            {"display_name": "Antoine", "username": "Patou"},
        )
        created_liveregistration = LiveRegistration.objects.get(video=video)
        self.assertEqual(created_liveregistration.display_name, "Antoine")
        self.assertEqual(created_liveregistration.username, "Patou")

    def test_api_liveregistration_put_username_lti_registration_no(
        self,
    ):
        """Should create a liveregistration as no previous one exists."""
        video = VideoFactory()

        self.assertEqual(LiveRegistration.objects.count(), 0)
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "sabrina@fun-test.fr",
            "id": "55555",
            "username": "Token",
        }
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": uuid.uuid4(), "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        # new record
        self.assertEqual(LiveRegistration.objects.count(), 1)

        self.assertEqual(
            response.json(),
            {"display_name": "Antoine", "username": "Token"},
        )
        created_liveregistration = LiveRegistration.objects.get(video=video)
        self.assertEqual(created_liveregistration.display_name, "Antoine")
        self.assertEqual(created_liveregistration.username, "Token")

    def test_api_liveregistration_put_username_lti_already_exists(
        self,
    ):
        """display_name already exists should return a 409."""
        video = VideoFactory()
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), display_name="Samuel", video=video
        )

        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        jwt_token.payload["consumer_site"] = str(video.playlist.consumer_site.id)
        jwt_token.payload["context_id"] = "Maths"
        jwt_token.payload["roles"] = [
            random.choice(["administrator", "instructor", "student", ""])
        ]
        jwt_token.payload["user"] = {
            "email": "sabrina@fun-test.fr",
            "id": "55555",
            "username": "Token",
        }
        response = self.client.put(
            "/api/liveregistrations/display_name/",
            {"anonymous_id": uuid.uuid4(), "display_name": "Samuel"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json(),
            {"display_name": "User with that username already exists!"},
        )
