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

    def test_api_liveregistration_read_token_public(
        self,
    ):
        """Token from public context can't read liveRegistration detail."""
        video = VideoFactory()
        liveregistration = LiveRegistrationFactory(
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

    def test_api_liveregistration_read_token_lti_email_set(
        self,
    ):
        """Token from lti with email can read its liveRegistration."""
        video = VideoFactory()
        # registration has consumer_site
        liveregistration = LiveRegistrationFactory(
            email="sarah@openfun.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
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
            json.loads(response.content),
            {
                "email": liveregistration.email,
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site.id),
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
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
            json.loads(response.content),
            {
                "consumer_site": str(video.playlist.consumer_site.id),
                "email": liveregistration.email,
                "id": str(liveregistration.id),
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
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
            json.loads(response.content),
            {
                "email": "sarah@openfun.fr",
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site.id),
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "5555",
                "should_send_reminders": False,
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
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
            lti_id=str(video.playlist.lti_id),
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
            lti_id="Maths",
            lti_user_id="4444",
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
            json.loads(response.content),
            {
                "email": "different@aol.com",
                "id": str(liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site.id),
                "lti_user_id": liveregistration.lti_user_id,
                "lti_id": "Maths",
                "should_send_reminders": False,
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
            json.loads(response.content),
            {
                "consumer_site": str(video.playlist.consumer_site.id),
                "email": "somemail@aol.com",
                "id": str(liveregistration.id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths",
                "should_send_reminders": False,
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
        liveregistration = LiveRegistrationFactory(video=video)

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
        liveregistration = LiveRegistrationFactory(video=video)

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
        content = json.loads(response.content)
        self.assertEqual(response.status_code, 401)
        content = json.loads(response.content)
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
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
                "consumer_site": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

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
            json.loads(response.content),
            {
                "token": [
                    "Public token shouldn't have any LTI information, "
                    "cases are not expected."
                ]
            },
        )

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
            json.loads(response.content),
            {
                "token": [
                    "Public token shouldn't have any LTI information, "
                    "cases are not expected."
                ]
            },
        )

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
            json.loads(response.content),
            {
                "token": [
                    "Public token shouldn't have any LTI information, "
                    "cases are not expected."
                ]
            },
        )

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
            json.loads(response.content),
            {
                "consumer_site": str(video.playlist.consumer_site.id),
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

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
            json.loads(response.content),
            {
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "consumer_site": str(video.playlist.consumer_site.id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(other_playlist.lti_id),
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

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
                "consumer_site": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "lti_user_id": None,
                "lti_id": None,
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

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
            json.loads(response.content),
            {
                "consumer_site": str(other_consumer_site.id),
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

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
            json.loads(response.content),
            {
                "consumer_site": str(video.playlist.consumer_site.id),
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths2",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

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
            json.loads(response.content),
            {
                "consumer_site": str(video.playlist.consumer_site.id),
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "lti_user_id": "NEW",
                "lti_id": "Maths",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

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
            json.loads(response.content),
            {
                "email": [
                    "You are not authorized to register with a specific email "
                    "notsaved@test-fun-mooc.fr. You can only use the email from your "
                    "authentication."
                ]
            },
        )

    def test_api_liveregistration_create_public_token_cant_register_when_not_scheduled(
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
            json.loads(response.content),
            {"video": [f"video with id {str(video.id)} doesn't accept registration."]},
        )

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
            json.loads(response.content),
            {
                "lti_user_id": [
                    "This identified user is already registered "
                    "for this video and consumer site and course."
                ]
            },
        )

    def test_api_liveregistration_create_cant_register_same_email_same_consumer_with_deleted(
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
            json.loads(response.content),
            {
                "consumer_site": str(video.playlist.consumer_site.id),
                "email": "salome@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(video.playlist.lti_id),
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )

    def test_api_liveregistration_create_cant_register_same_email_same_consumer_deleted(
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
            json.loads(response.content),
            {
                "consumer_site": str(video.playlist.consumer_site.id),
                "email": "salome@test-fun-mooc.fr",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(video.playlist.lti_id),
                "id": str(liveregistration.id),
                "should_send_reminders": True,
                "video": str(video.id),
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
                    "salome@test-fun-mooc.fr is already registered for "
                    "this video, consumer site and course."
                ]
            },
        )

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
            json.loads(response.content),
            {
                "lti_user_id": [
                    "This identified user is already registered "
                    "for this video and consumer site and course."
                ]
            },
        )

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
                "consumer_site": None,
                "email": "chantal@test-fun-mooc.fr",
                "lti_user_id": None,
                "lti_id": None,
                "id": str(liveregistration.id),
                "should_send_reminders": True,
                "video": str(video2.id),
            },
        )

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
            json.loads(response.content),
            {
                "consumer_site": str(video.playlist.consumer_site.id),
                "email": "chantal@test-fun-mooc.fr",
                "id": str(liveregistration.id),
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video2.id),
            },
        )

    def test_api_liveregistration_delete_anonymous(self):
        """An anonymous should not be able to delete a liveregistration."""
        liveregistration = LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr", video=VideoFactory()
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
        Public token can't fetch any liveregistration.
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
        LiveRegistrationFactory(email=user.email, video=video)
        LiveRegistrationFactory(email="chantal@test-fun-mooc.fr", video=video)
        LiveRegistrationFactory(email="super@test-fun-mooc.fr", video=video)
        # liveregistration for another consumer_site
        LiveRegistrationFactory(
            email="chantal@test-fun-mooc.fr",
            lti_user_id=user.id,
            lti_id="Maths",
            video=video,
            consumer_site=ConsumerSiteFactory(),
        )
        # liveregistration for another video
        LiveRegistrationFactory(email=user.email, video=video2)

        # public token
        jwt_token = AccessToken()
        jwt_token.payload["resource_id"] = str(video.id)
        response = self.client.get(
            "/api/liveregistrations/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

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
        LiveRegistrationFactory(email=user.email, video=video)
        # liveregistration with the same email for another video
        LiveRegistrationFactory(email=user.email, video=video2)

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
                    "consumer_site": str(video.playlist.consumer_site.id),
                    "email": user.email,
                    "id": str(liveregistration.id),
                    "lti_user_id": str(user.id),
                    "lti_id": "Maths",
                    "should_send_reminders": False,
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
            lti_id="Maths",
            lti_user_id="1111",
            video=video,
        )
        # liveregistration with different lti_user
        liveregistration2 = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="user2@test.fr",
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
        LiveRegistrationFactory(email="user1@test.fr", video=video)
        LiveRegistrationFactory(email="user1@test.fr", video=video2)

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
                    "consumer_site": str(liveregistration.consumer_site.id),
                    "email": liveregistration.email,
                    "id": str(liveregistration.id),
                    "lti_user_id": liveregistration.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": False,
                    "video": str(video.id),
                },
                {
                    "consumer_site": str(liveregistration2.consumer_site.id),
                    "email": liveregistration2.email,
                    "id": str(liveregistration2.id),
                    "lti_user_id": liveregistration2.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": False,
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
        but the user token shows a different email, the user still should be considered
        as already registered.
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
                    "consumer_site": str(video.playlist.consumer_site.id),
                    "email": "chantal@test-fun-mooc.fr",
                    "id": str(liveregistration.id),
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "lti_id": str(video.playlist.lti_id),
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
            json.loads(response.content),
            {
                "consumer_site": str(video.playlist.consumer_site.id),
                "email": "saved@test-fun-mooc.fr",
                "id": str(created_liveregistration.id),
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "video": str(video.id),
            },
        )
