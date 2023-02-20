"""Tests for the livesession API."""
from datetime import datetime, timedelta
import json
from logging import Logger
import random
import smtplib
import time
from unittest import mock
import uuid

from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.core.models import STUDENT
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    LiveSessionLtiTokenFactory,
    LiveSessionResourceAccessTokenFactory,
    LTIResourceAccessTokenFactory,
    ResourceAccessTokenFactory,
)

from ..defaults import IDLE, JITSI, RAW, RUNNING, STOPPED
from ..factories import (
    AnonymousLiveSessionFactory,
    ConsumerSiteFactory,
    LiveSessionFactory,
    PlaylistFactory,
    UserFactory,
    VideoFactory,
)
from ..models import LiveSession, Video
from ..models.account import NONE
from ..serializers.live_session import timezone as LiveSessionTimezone
from ..utils.api_utils import generate_hash
from ..utils.time_utils import to_timestamp


# pylint: disable=too-many-lines


class LiveSessionApiTest(TestCase):
    """Test the API of the liveSession object."""

    maxDiff = None

    def setUp(self):
        """
        Reset the cache so that no throttles will be active
        """
        cache.clear()

    def checkRegistrationEmailSent(self, email, video, username, livesession):
        """Shortcut to check registration email has been sent to email"""
        # check email has been sent
        self.assertEqual(len(mail.outbox), 1)

        # check we send it to the the right email
        self.assertEqual(mail.outbox[0].to[0], email)

        # check it's the right email content
        self.assertEqual(
            mail.outbox[0].subject, f"Registration validated! {video.title}"
        )
        email_content = " ".join(mail.outbox[0].body.split())
        self.assertIn(f"Registration validated! {video.title}", email_content)
        if username:
            self.assertIn(f"Hello {username},", email_content)
        else:
            self.assertIn("Hello,", email_content)
            self.assertNotIn("None", email_content)

        key_access = livesession.get_generate_salted_hmac()
        self.assertIn(
            f'We have taken note of your interest in the event "{video.title}".',
            email_content,
        )
        self.assertIn(
            f"Access the event [//example.com/videos/{video.id}?lrpk="
            f"{livesession.pk}&amp;key={key_access}]",
            email_content,
        )
        self.assertIn(
            "Do not forward this email or share this link. "
            "It contains your personal code to access the event.",
            email_content,
        )

        self.assertIn(f"This mail has been sent to {email} by Marsha", email_content)
        self.assertIn(
            "Your email address is used because you have shown interest in this webinar. "
            "If you want to unsubscribe your email from these notifications, "
            "please follow the link :",
            email_content,
        )
        self.assertIn(
            f"unsubscribe [//example.com/reminders/cancel/{livesession.pk}/"
            f"{key_access}]",
            email_content,
        )

        # emails are generated from mjml format, test rendering of email doesn't
        # contain any trans tag, it might happens if \n are generated
        self.assertNotIn("trans", email_content)

    def test_api_livesession_read_anonymous(self):
        """Anonymous users should not be allowed to fetch a livesession."""
        livesession = AnonymousLiveSessionFactory()
        response = self.client.get(f"/api/livesessions/{livesession.id}/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_livesession_read_token_public(self):
        """Token from public context can't read livesession detail."""
        video = VideoFactory()
        livesession = AnonymousLiveSessionFactory(video=video)
        # token has no consumer_site, no context_id and no user's info
        jwt_token = ResourceAccessTokenFactory(resource=video)

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Not found."})

    def test_api_livesession_read_token_public_with_anonymous(self):
        """Token from public context can read livesession detail with
        anonymous_id parameter.
        """
        livesession = AnonymousLiveSessionFactory()
        # token has no consumer_site, no context_id and no user's info
        jwt_token = ResourceAccessTokenFactory(resource=livesession.video)

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/?anonymous_id={livesession.anonymous_id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(livesession.anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": livesession.email,
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(livesession.video.id),
            },
        )

    def test_api_livesession_read_token_lti_email_set(self):
        """Token from lti with email can read its livesession."""
        video = VideoFactory()
        # livesession has consumer_site
        livesession = LiveSessionFactory(
            email="sarah@openfun.fr",
            is_registered=False,
            username="John",
            video=video,
            is_from_lti_connection=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )
        # token from LTI has context_id, consumer_site and user.id
        jwt_token = LiveSessionResourceAccessTokenFactory(live_session=livesession)
        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": livesession.email,
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "John",
                "video": str(video.id),
            },
        )

    def test_api_livesession_read_token_lti_email_none(
        self,
    ):
        """LTI Token with no email can read its livesession."""
        video = VideoFactory()
        # livesession with consumer_site
        livesession = LiveSessionFactory(
            is_registered=True,
            video=video,
            is_from_lti_connection=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )

        # token with right context_id and lti_user_id
        jwt_token = LiveSessionResourceAccessTokenFactory(live_session=livesession)

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": livesession.email,
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )

    def test_api_livesession_read_token_lti_record_email_diff(self):
        """LTI's Token can read the livesession even if they don't have the right email.
        A LTI user is identified by the combinaison of consumer_site/lti_user_id/lti_id
        """
        video = VideoFactory()
        # livesession has consumer_site
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sarah@openfun.fr",
            is_registered=True,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="5555",
            video=video,
        )
        # token has right context_id but different email
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            user__email="salmon@openfun.fr",
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        # email is the one used during livesession
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": "sarah@openfun.fr",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "5555",
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )

    def test_api_livesession_read_token_lti_record_consumer_none(self):
        """Control we can only read livesession from the same consumer site.

        The video is portable in an other playlist portable from an other consumer site,
        the livesession should not be return, if this one has been added with
        a token with no consumer_site.
        """
        # livesession has no consumer_site
        livesession = AnonymousLiveSessionFactory()

        # token has context_id so different consumer_site
        jwt_token = LTIResourceAccessTokenFactory(
            resource=livesession.video,  # as usual
            roles=[random.choice([STUDENT, NONE])],
            user__email=livesession.email,  # as usual
            # below arguments are not usual for anonymous live session
            context_id=str(livesession.video.playlist.lti_id),
            consumer_site=str(livesession.video.playlist.consumer_site.id),
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_lti_record_consumer_diff(self):
        """Control we can only read livesession from the same consumer site.

        The video is portable in an other playlist portable from an other consumer site,
        the livesession should not be return, if this one has been added with
        a token with a different consumer_site.
        """
        other_consumer = ConsumerSiteFactory()
        # livesession has consumer_site
        livesession = LiveSessionFactory(
            is_from_lti_connection=True,
            consumer_site=other_consumer,  # enforce other consumer site than video's
        )
        # token has context_id but different one
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            consumer_site=str(
                livesession.video.playlist.consumer_site.id
            ),  # the **video** one
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_lti_record_course_diff(self):
        """Control we can only read livesession from the same course.

        The video is portable in an other playlist portable from an other course,
        the livesession should not be return, if this one has been added with
        a token from a different course.
        """
        other_consumer = ConsumerSiteFactory()
        # livesession has consumer_site
        livesession = LiveSessionFactory(
            is_from_lti_connection=True,
            consumer_site=other_consumer,  # enforce other consumer site than video's
        )

        # token has context_id but different one
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            context_id=f"{livesession.video.playlist.lti_id}_diff",  # different context
            consumer_site=str(
                livesession.video.playlist.consumer_site.id
            ),  # the **video** one
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_lti_record_lti_user_id_diff(self):
        """Control we can only read livesession from the same user."""
        video = VideoFactory()
        # livesession has consumer_site
        livesession = LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
        )
        # token has context_id but different one
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            context_id=f"{livesession.video.playlist.lti_id}_diff",  # different context
            user__id=f"{livesession.lti_user_id}_diff",  # different user ID
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_public_partially_lti(self):
        """Token with no email and no consumer_site can't read the livesession.

        This case is not supposed to happen. A LTI connection has necessary a
        consumer_site, context_id and a lti_user_id defined in the token.
        """
        # livesession with a consumer_site
        livesession = LiveSessionFactory(is_from_lti_connection=True)

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            user__email=None,
            consumer_site=None,
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # combo lti_user_id / consumer_site is needed if token has no email
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_public_partially_lti_2(self):
        """Token with consumer_site and no user's info can't read livesession detail.

        This case is not supposed to happen. A JWT token from a LTI connection contains
        context_id, consumer_site and user's keys.
        """
        livesession = LiveSessionFactory(is_from_lti_connection=True)

        # token with right context_id but no email or user id
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            user=None,
        )
        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_public_partially_lti_3(self):
        """Token with email can't read the livesession.

        This case is not supposed to happen. Public token has no user's information, only
        lti's connections has the key `user` in the JWT token. A JWT token from a LTI
        connection contains context_id and consumer_site keys.
        """
        video = VideoFactory()
        # livesession has no consumer_site
        livesession = AnonymousLiveSessionFactory(
            email="sarah@openfun.fr",
            video=video,
        )
        # token has no context_id and different email
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            consumer_site=None,
            context_id=None,
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_lti_admin_instruct_token_email_ok(self):
        """Admin/instructor can read any livesession part of the course."""
        # livesession with another email and lti_user_id
        livesession = LiveSessionFactory(
            is_registered=True,
            is_from_lti_connection=True,
            email="different@aol.com",  # explicit to be found in response
            video__playlist__lti_id="Maths",  # explicit to be found in response
            username="Sam",  # explicit to be found in response
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=livesession.video,
            context_id=str(livesession.video.playlist.lti_id),
            consumer_site=str(livesession.consumer_site.id),
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(livesession.video.playlist.consumer_site_id),
                "display_name": None,
                "email": "different@aol.com",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": livesession.lti_user_id,
                "lti_id": "Maths",
                "should_send_reminders": True,
                "username": "Sam",
                "video": str(livesession.video.id),
            },
        )

    def test_api_livesession_read_token_lti_admin_instruct_token_email_none(self):
        """Admin/instructor users don't necessary have an email in token.

        They should be allowed to read a livesession detail if they are in
        the right context_id and consumer_site.
        """
        # livesession with consumer_site
        livesession = LiveSessionFactory(
            is_registered=True,
            is_from_lti_connection=True,
            email="somemail@aol.com",  # explicit to be found in response
            video__playlist__lti_id="Maths",  # explicit to be found in response
            lti_user_id="56255f3807599c377bf0e5bf072359fd",  # explicit to be found in response
        )
        # token with right context_id
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=livesession.video,
            context_id=str(livesession.video.playlist.lti_id),
            consumer_site=str(livesession.consumer_site.id),
            user__email=None,
            user__id=f"{livesession.lti_user_id}_diff",
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(livesession.video.playlist.consumer_site.id),
                "display_name": None,
                "email": "somemail@aol.com",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths",
                "should_send_reminders": True,
                "username": None,
                "video": str(livesession.video.id),
            },
        )

    def test_api_livesession_read_token_lti_admin_instruct_email_diff(self):
        """Admin/instructor can read all livesession belonging to a video."""
        # livesession with no consumer site
        livesession = AnonymousLiveSessionFactory(
            email="different@aol.com",
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            # context_id and consumer_site are not determinant (random uuid here)
            resource=livesession.video,
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(livesession.anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "different@aol.com",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": None,
                "lti_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(livesession.video.id),
            },
        )

    def test_api_livesession_read_token_lti_admin_instruct_record_consumer_diff(self):
        """Admin/instructor can read all livesession belonging to a video."""
        other_consumer_site = ConsumerSiteFactory()
        # livesession with consumer_site
        livesession = LiveSessionFactory(
            consumer_site=other_consumer_site,
            is_from_lti_connection=True,
            email="admin@openfun.fr",  # explicit to be found in response
            lti_user_id="56255f3807599c377bf0e5bf072359fd",  # explicit to be found in response
        )

        # token with context_id leading to another consumer site
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=livesession.video,
            context_id=str(livesession.video.playlist.lti_id),
            # consumer_site is not other_consumer_site
            consumer_site=str(livesession.video.playlist.consumer_site.id),
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(other_consumer_site.id),
                "display_name": None,
                "email": "admin@openfun.fr",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(livesession.video.playlist.lti_id),
                "should_send_reminders": True,
                "username": None,
                "video": str(livesession.video.id),
            },
        )

    def test_api_livesession_read_token_lti_admin_instruct_record_course_diff(self):
        """Admin/instructor can read all livesession belonging to a video."""
        other_consumer_site = ConsumerSiteFactory()
        # livesession with consumer_site
        livesession = LiveSessionFactory(
            consumer_site=other_consumer_site,
            email="admin@openfun.fr",  # explicit to be found in response
            lti_user_id="56255f3807599c377bf0e5bf072359fd",  # explicit to be found in response
            lti_id="Maths",  # explicit to be found in response
        )

        # token with context_id leading to another consumer site
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=livesession.video,
            context_id=f"{livesession.video.playlist.lti_id}_diff",
            # consumer_site is not other_consumer_site
            consumer_site=str(livesession.video.playlist.consumer_site.id),
            user__email=livesession.email,
            user__id=livesession.lti_user_id,
            user__username=livesession.username,
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(other_consumer_site.id),
                "display_name": None,
                "email": "admin@openfun.fr",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths",
                "should_send_reminders": True,
                "username": None,
                "video": str(livesession.video.id),
            },
        )

    def test_api_livesession_read_token_public_wrong_video_token(self):
        """Request with wrong video in token and public token."""
        # livesession with no consumer_site
        livesession = AnonymousLiveSessionFactory()

        # token with no context_id leading to the same undefined consumer_site
        jwt_token = ResourceAccessTokenFactory()

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_lti_wrong_video_token(self):
        """Request with wrong video in token and LTI token."""
        # livesession with consumer_site
        livesession = LiveSessionFactory(is_from_lti_connection=True)
        # token with unexisting consumer_site
        jwt_token = LTIResourceAccessTokenFactory(
            context_id=str(livesession.video.playlist.lti_id),
            consumer_site=str(livesession.video.playlist.consumer_site.id),
            user__email=None,
        )
        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_public_other_video_context_none_role(self):
        """Public token can't read another video than the one in the token."""
        # livesession with no consumer_site
        livesession = AnonymousLiveSessionFactory()

        # token with no context_id leading to the same undefined consumer_site
        jwt_token = ResourceAccessTokenFactory(resource=VideoFactory())

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_token_lti_other_video_context_none_role(self):
        """LTI token can't read another video than the one in the token."""
        # livesession with no consumer_site
        livesession = LiveSessionFactory(is_from_lti_connection=True)

        jwt_token = LTIResourceAccessTokenFactory(
            resource=VideoFactory(),  # other video
            context_id=str(livesession.video.playlist.lti_id),
            consumer_site=str(livesession.video.playlist.consumer_site.id),
            user__email=None,
            user__id=str(livesession.lti_user_id),
        )

        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_create_anonymous(self):
        """Anonymous users should not be able to create a livesession."""
        response = self.client.post("/api/livesessions/")
        self.assertEqual(response.status_code, 401)
        content = response.json()
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    @mock.patch(
        "marsha.core.api.live_session.send_mail",
        side_effect=smtplib.SMTPException("Error SMTPException"),
    )
    @mock.patch.object(Logger, "warning")
    def test_api_livesession_create_send_mail_fails(self, mock_logger, _mock_send_mail):
        """send_mail fails, we make sure should_send_reminders is set to False."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id and no user information
        jwt_token = ResourceAccessTokenFactory(resource=video)

        anonymous_id = uuid.uuid4()
        response = self.client.post(
            "/api/livesessions/",
            {
                "anonymous_id": anonymous_id,
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
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

    def test_api_livesession_create_public_token(self):
        """Public token can create a livesession."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id and no user information
        jwt_token = ResourceAccessTokenFactory(resource=video)
        anonymous_id = uuid.uuid4()
        response = self.client.post(
            "/api/livesessions/",
            {
                "anonymous_id": anonymous_id,
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": False,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_livesession.id),
                "language": "en",
                "live_attendance": None,
                "is_registered": True,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": False,
                "username": None,
                "video": str(video.id),
            },
        )
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr", video, None, created_livesession
        )

    def test_api_livesession_create_public_token_is_registered_false(self):
        """Public token can create a livesession, is_registered set to False
        is ignored."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id and no user information
        jwt_token = ResourceAccessTokenFactory(resource=video)
        anonymous_id = uuid.uuid4()
        now = datetime(2022, 4, 7, tzinfo=timezone.utc)
        with mock.patch.object(LiveSessionTimezone, "now", return_value=now):
            response = self.client.post(
                "/api/livesessions/",
                {
                    "anonymous_id": anonymous_id,
                    "email": "salome@test-fun-mooc.fr",
                    "is_registered": False,
                },
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        self.assertEqual(response.status_code, 201)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr", video, None, created_livesession
        )
        self.assertEqual(created_livesession.registered_at, now)

    def test_api_livesession_create_public_token_anonymous_mandatory(
        self,
    ):
        """Public token has anonymous_id mandatory."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with no context_id and no user information
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.post(
            "/api/livesessions/",
            {
                "email": "salome@test-fun-mooc.fr",
                "is_registered": False,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"anonymous_id": "Anonymous id is mandatory."}
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_public_partially_lti1(self):
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
        jwt_token = LTIResourceAccessTokenFactory(resource=video, user={})

        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "token": (
                    "Public token shouldn't have any LTI information, "
                    "cases are not expected."
                )
            },
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_public_partially_lti2(self):
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
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=None,
        )

        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "token": (
                    "Public token shouldn't have any LTI information, "
                    "cases are not expected."
                )
            },
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_public_partially_lti3(self):
        """Public token with some LTI information generates an error.

        LTI token must have consumer_site, context_id and user.id, this token
        is missing the key consumer_site
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=None,
        )

        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "token": (
                    "Public token shouldn't have any LTI information, "
                    "cases are not expected."
                )
            },
        )
        # no email has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_token_lti_email_with(self):
        """LTI Token can create a livesession."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has same consumer_site than the video
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id="Maths",  # explicit to be found in response
            consumer_site=str(video.playlist.consumer_site.id),
            user__id="56255f3807599c377bf0e5bf072359fd",  # explicit to be found in response
            user__email="salome@test-fun-mooc.fr",  # explicit to be found in response
            user__username="Token",  # explicit to be found in response
        )
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr",
            video,
            "Token",
            created_livesession,
        )

    def test_api_livesession_create_token_lti_is_registered_false(self):
        """is_registered set to False is ignored"""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token has same consumer_site than the video
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id="Maths",  # explicit to be found in response
            consumer_site=str(video.playlist.consumer_site.id),
            user__id="56255f3807599c377bf0e5bf072359fd",  # explicit to be found in response
            user__email="salome@test-fun-mooc.fr",  # explicit to be found in response
            user__username="Token",  # explicit to be found in response
        )
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "is_registered": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr",
            video,
            "Token",
            created_livesession,
        )

    def test_api_livesession_create_token_lti_email_none(self):
        """LTI token with no email can create a livesession."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        other_playlist = PlaylistFactory()
        # token has different context_id than the video
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(other_playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
            user__id="56255f3807599c377bf0e5bf072359fd",  # explicit to be found in response
            user__email=None,
            user__username="Token",  # explicit to be found in response
        )
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(other_playlist.lti_id),
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr",
            video,
            "Token",
            created_livesession,
        )

    def test_api_livesession_create_public_token_record_email_other_livesession_lti(
        self,
    ):
        """Same email can be used for the same video with a public token."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # created by LTI
        LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
            email="salome@test-fun-mooc.fr",
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertTrue(video.is_scheduled)
        jwt_token = ResourceAccessTokenFactory(resource=video)
        anonymous_id = uuid.uuid4()
        response = self.client.post(
            "/api/livesessions/",
            {
                "anonymous_id": anonymous_id,
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveSession.objects.count(), 2)
        created_livesession = LiveSession.objects.get(
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
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": None,
                "lti_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr", video, None, created_livesession
        )

    def test_api_livesession_create_lti_token_record_email_other_consumer_site(
        self,
    ):
        """New livesession for a consumer_site different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        other_consumer_site = ConsumerSiteFactory()
        # created by LTI
        live_session = LiveSessionFactory(
            email="salome@test-fun-mooc.fr",  # explicit to be used later
            video=video,
            is_from_lti_connection=True,
            lti_id="Maths",  # explicit to be found in response
            lti_user_id="56255f3807599c377bf0e5bf072359fd",  # explicit to be found in response
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertTrue(video.is_scheduled)
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(other_consumer_site.id),
            context_id=live_session.lti_id,
            user__id=live_session.lti_user_id,
            user__email=None,  # mandatory
            user__username="Token",  # explicit to be found in response
        )
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveSession.objects.count(), 2)
        created_livesession = LiveSession.objects.get(
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
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths",
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr", video, "Token", created_livesession
        )

    def test_api_livesession_create_lti_token_record_email_other_context_id(
        self,
    ):
        """New livesession for a context_id different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # created by LTI
        live_session = LiveSessionFactory(
            email="salome@test-fun-mooc.fr",  # explicit to be used later
            video=video,
            is_from_lti_connection=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",  # explicit to be found in response
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertTrue(video.is_scheduled)

        other_context_id = f"{live_session.lti_id}_diff"
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=other_context_id,
            user__id=live_session.lti_user_id,
            user__email=None,  # mandatory
            user__username="Token",  # explicit to be found in response
        )
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveSession.objects.count(), 2)
        created_livesession = LiveSession.objects.get(
            email="salome@test-fun-mooc.fr",
            lti_id=other_context_id,
            video=video,
        )
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": other_context_id,
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr", video, "Token", created_livesession
        )

    def test_api_livesession_create_lti_token_record_email_lti_user_id(self):
        """New livesession for a lti_id different."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # created by LTI
        live_session = LiveSessionFactory(
            email="salome@test-fun-mooc.fr",  # explicit to be used later
            video=video,
            is_from_lti_connection=True,
            lti_id="Maths",  # explicit to be found in response
            lti_user_id="OLD",  # explicit to be found in response
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertTrue(video.is_scheduled)
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(live_session.consumer_site.id),
            context_id=live_session.lti_id,
            user__id="NEW",  # explicit to be found in response
            user__email=None,  # mandatory
            user__username="Token",  # explicit to be found in response
        )
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveSession.objects.count(), 2)
        created_livesession = LiveSession.objects.get(
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
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "NEW",
                "lti_id": "Maths",
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr", video, "Token", created_livesession
        )

    def test_api_livesession_create_token_lti_email_restricted_token(self):
        """LTI token can only register for the email in the token."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with different context_id
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
        )

        response = self.client.post(
            "/api/livesessions/",
            {"email": "notsaved@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "email": (
                    "You are not authorized to register with a specific email "
                    "notsaved@test-fun-mooc.fr. You can only use the email from your "
                    "authentication."
                )
            },
        )
        # no mail has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_public_token_cant_register_when_not_scheduled(
        self,
    ):
        """Can't register if video is not scheduled."""
        video = VideoFactory()
        self.assertFalse(video.is_scheduled)
        jwt_token = ResourceAccessTokenFactory(resource=video)

        response = self.client.post(
            "/api/livesessions/",
            {
                "anonymous_id": uuid.uuid4(),
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"video": f"video with id {str(video.id)} doesn't accept registration."},
        )

        # no mail has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_lti_token_cant_register_when_not_scheduled(
        self,
    ):
        """LTI token can't register if video is not scheduled."""
        video = VideoFactory()
        self.assertFalse(video.is_scheduled)
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
        )
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"video": f"video with id {str(video.id)} doesn't accept registration."},
        )

        # no mail has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_cant_register_same_email_same_consumer(
        self,
    ):
        """Key email/consumer_site/lti_id/lti_user_id/video must be unique."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # registration with consumer_site
        live_session = LiveSessionFactory(
            email="salome@test-fun-mooc.fr",  # explicit to be used later
            video=video,
            is_from_lti_connection=True,
        )
        self.assertTrue(video.is_scheduled)
        # token with same context_id and same email
        jwt_token = LiveSessionLtiTokenFactory(live_session=live_session)
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "lti_user_id": (
                    "This identified user is already registered "
                    "for this video and consumer site and course."
                )
            },
        )

        # no mail has been sent
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_can_register_same_email_same_consumer_with_deleted(
        self,
    ):
        """Key email/consumer_site/lti_id/lti_user_id/video must be unique and can be used after
        being deleted."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        self.assertTrue(video.is_scheduled)
        # livesession with consumer_site
        livesession = LiveSessionFactory(
            email="salome@test-fun-mooc.fr",  # explicit to be used later
            video=video,
            username="Token",
            is_from_lti_connection=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )
        livesession.delete()
        # token with same context_id and same email
        jwt_token = LiveSessionLtiTokenFactory(live_session=livesession)
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveSession.objects.count(), 1)
        livesession = LiveSession.objects.get(
            email="salome@test-fun-mooc.fr", deleted__isnull=True
        )
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(video.playlist.lti_id),
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr", video, "Token", livesession
        )

    def test_api_livesession_create_can_register_same_email_same_consumer_deleted(
        self,
    ):
        """Key email/consumer_site/lti_id/lti_user_id/video must be unique but can be
        reused if deleted is set."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        self.assertTrue(video.is_scheduled)
        # livesession with consumer_site
        liveregister = LiveSessionFactory(
            email="salome@test-fun-mooc.fr",  # explicit to be used later
            username="Token",
            video=video,
            is_from_lti_connection=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )
        # delete it
        liveregister.delete()
        self.assertEqual(LiveSession.objects.count(), 0)
        # token with same context_id and same email
        jwt_token = LiveSessionLtiTokenFactory(live_session=liveregister)
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveSession.objects.count(), 1)
        livesession = LiveSession.objects.get(
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
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr", video, "Token", livesession
        )

    def test_api_livesession_create_cant_register_same_email_same_consumer_none(
        self,
    ):
        """Duo email/video must be unique when consumer_site is not defined."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        # livesession with no consumer_site
        AnonymousLiveSessionFactory(email="salome@test-fun-mooc.fr", video=video)
        self.assertTrue(video.is_scheduled)
        # token with no context_id leading to an undefined consumer_site
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.post(
            "/api/livesessions/",
            {
                "anonymous_id": uuid.uuid4(),
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # livesession for this video with this email when consumer_site is not defined
        # already exists
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "email": (
                    "salome@test-fun-mooc.fr is already registered for "
                    "this video, consumer site and course."
                )
            },
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_same_lti_info_diff_email_consumer(
        self,
    ):
        """Unicity of video/consumer_site/lti_id/lti_user_id.

        Combination of video/consumer_site/lti_id/lti_user_id can't be used for different
        emails."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        livesession = LiveSessionFactory(video=video, is_from_lti_connection=True)
        self.assertTrue(video.is_scheduled)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            user__email=None,
        )
        response = self.client.post(
            "/api/livesessions/",
            {"email": "balou@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        # can't register because key video/context_id/lti_user_id already exists
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "lti_user_id": (
                    "This identified user is already registered "
                    "for this video and consumer site and course."
                )
            },
        )
        self.assertEqual(len(mail.outbox), 0)

    def test_api_livesession_create_public_token_same_email_different_video(
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

        # livesession with no consumer_site
        AnonymousLiveSessionFactory(email="chantal@test-fun-mooc.fr", video=video)
        # token with no context_id leading to no consumer_site
        jwt_token = ResourceAccessTokenFactory(resource=video2)

        anonymous_id = uuid.uuid4()
        # With the same email but other video, livesession is possible
        response = self.client.post(
            "/api/livesessions/",
            {
                "anonymous_id": anonymous_id,
                "email": "chantal@test-fun-mooc.fr",
                "should_send_reminders": True,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveSession.objects.count(), 2)
        livesession = LiveSession.objects.get(
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
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video2.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "chantal@test-fun-mooc.fr", video2, None, livesession
        )

    def test_api_livesession_create_token_lti_same_email_different_video(
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
        # livesession with consumer_site
        live_session = LiveSessionFactory(
            email="chantal@test-fun-mooc.fr",
            video=video,
            is_from_lti_connection=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
        )
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video2,
            context_id=live_session.lti_id,
            consumer_site=str(video.playlist.consumer_site.id),
            user__email=None,
            user__id=live_session.lti_user_id,
            user__username="Token",
        )
        # With the same email but other video, livesession is possible
        response = self.client.post(
            "/api/livesessions/",
            {"email": "chantal@test-fun-mooc.fr", "should_send_reminders": False},
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(LiveSession.objects.count(), 2)
        livesession = LiveSession.objects.get(
            email="chantal@test-fun-mooc.fr", video=video2
        )
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "chantal@test-fun-mooc.fr",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video2.id),
            },
        )

        # check email has been sent
        self.checkRegistrationEmailSent(
            "chantal@test-fun-mooc.fr", video2, "Token", livesession
        )

    def test_api_livesession_create_username_doesnt_change(
        self,
    ):
        """Field username is not taken into account in the post request"""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id="Maths",
            consumer_site=str(video.playlist.consumer_site.id),
            user__email=None,
            user__id="56255f3807599c377bf0e5bf072359fd",
            user__username="Token",
        )
        response = self.client.post(
            "/api/livesessions/",
            {
                "email": "salome@test-fun-mooc.fr",
                "should_send_reminders": True,
                "username": "Sabrina",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": "Maths",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # check email has been sent
        self.checkRegistrationEmailSent(
            "salome@test-fun-mooc.fr", video, "Token", created_livesession
        )

    def test_api_livesession_delete_anonymous(self):
        """An anonymous should not be able to delete a livesession."""
        livesession = AnonymousLiveSessionFactory()
        response = self.client.delete(
            f"/api/livesession/{livesession.id}/",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_delete_token_lti(self):
        """A user should not be able to delete a livesession."""
        livesession = LiveSessionFactory(is_from_lti_connection=True)

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
            permissions__can_update=True,
        )

        response = self.client.delete(
            f"/api/livesession/{livesession.id}/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_update_put_anonymous_not_allowed(self):
        """Anonymous can't update livesession."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        AnonymousLiveSessionFactory(video=video)
        response = self.client.put(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        content = response.json()
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_livesession_update_patch_anonymous_not_allowed(self):
        """Anonymous can't update livesession."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        AnonymousLiveSessionFactory(video=video)

        response = self.client.patch(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        content = response.json()
        self.assertEqual(
            content, {"detail": "Authentication credentials were not provided."}
        )

    def test_api_livesession_update_put_with_token_not_allowed(self):
        """Update method is not allowed."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        AnonymousLiveSessionFactory(video=video)
        jwt_token = ResourceAccessTokenFactory(resource=video)

        response = self.client.put(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json(), {"detail": 'Method "PUT" not allowed.'})

    def test_api_livesession_update_with_token_patch_not_allowed(self):
        """Patch update is not allowed."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        AnonymousLiveSessionFactory(video=video)
        jwt_token = ResourceAccessTokenFactory(resource=video)

        response = self.client.patch(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json(), {"detail": 'Method "PATCH" not allowed.'})

    def test_api_livesession_create_with_unknown_video(self):
        """Token with wrong resource_id should render a 404."""
        # token with no user information
        jwt_token = ResourceAccessTokenFactory()
        response = self.client.post(
            "/api/livesessions/",
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_read_detail_unknown_video(self):
        """Token with wrong resource_id should render a 404."""
        starting_at = timezone.now() + timedelta(days=5)
        video = VideoFactory(live_state=IDLE, live_type=RAW, starting_at=starting_at)
        livesession = AnonymousLiveSessionFactory(video=video)
        # token with no user information
        jwt_token = ResourceAccessTokenFactory()
        response = self.client.get(
            f"/api/livesessions/{livesession.id}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_list_livesession_by_anonymous_user(self):
        """Anonymous users cannot fetch list requests for livesessions."""
        response = self.client.get("/api/livesessions/")
        self.assertEqual(response.status_code, 401)

    def test_list_livesession_public_token(self):
        """
        Public token can't fetch any livesession if there is no anonymous_id.
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
        AnonymousLiveSessionFactory(email=user.email, video=video)
        AnonymousLiveSessionFactory(email="chantal@test-fun-mooc.fr", video=video)
        AnonymousLiveSessionFactory(email="super@test-fun-mooc.fr", video=video)
        # livesession for another consumer_site
        LiveSessionFactory(
            email="chantal@test-fun-mooc.fr",
            video=video,
            is_from_lti_connection=True,
            lti_user_id=user.id,
            consumer_site=ConsumerSiteFactory(),
        )
        # livesession for another video
        AnonymousLiveSessionFactory(email=user.email, video=video2)

        # public token
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.get(
            "/api/livesessions/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_api_livesession_list_throttling(self):
        """Throttling should prevent more than three requests per minute."""
        # first 3 requests shouldn't be throttled
        for _i in range(3):
            video = VideoFactory()
            jwt_token = ResourceAccessTokenFactory(resource=video)

            response = self.client.get(
                f"/api/livesessions/?anonymous_id={uuid.uuid4()}",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 0)

        # fourth request should be throttled
        response = self.client.get(
            f"/api/livesessions/?anonymous_id={uuid.uuid4()}",
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
                    f"/api/livesessions/?anonymous_id={uuid.uuid4()}",
                    HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["count"], 0)

            # fourth request should be throttled
            response = self.client.get(
                f"/api/livesessions/?anonymous_id={uuid.uuid4()}",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 429)
            self.assertEqual(
                response.json(),
                {"detail": "Request was throttled. Expected available in 60 seconds."},
            )

    def test_api_livesession_list_throttling_no_anonymous(self):
        """Throttling is not called if anonymous_id is not used."""
        # first 3 requests shouldn't be throttled
        for _i in range(3):
            video = VideoFactory()
            jwt_token = ResourceAccessTokenFactory(resource=video)

            response = self.client.get(
                "/api/livesessions/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["count"], 0)

        # fourth request shouldn't be throttled
        response = self.client.get(
            "/api/livesessions/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_list_livesession_public_token_anonymous(self):
        """
        Public token can fetch is livesession if there is an anonymous_id.
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
        livesession = AnonymousLiveSessionFactory(email=user.email, video=video)
        # another anonymous_id for the same video
        AnonymousLiveSessionFactory(email="chantal@test-fun-mooc.fr", video=video)

        # livesession for a LTI connection
        LiveSessionFactory(
            email="chantal@test-fun-mooc.fr",
            video=video,
            is_from_lti_connection=True,
            lti_user_id=user.id,
            consumer_site=ConsumerSiteFactory(),
        )
        # livesession for another video with the same anonymous_id
        AnonymousLiveSessionFactory(
            anonymous_id=livesession.anonymous_id,
            email=user.email,
            video=video2,
        )

        # public token
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.get(
            f"/api/livesessions/?anonymous_id={livesession.anonymous_id}",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)

        self.assertEqual(
            response.json()["results"],
            [
                {
                    "anonymous_id": str(livesession.anonymous_id),
                    "consumer_site": None,
                    "display_name": None,
                    "email": user.email,
                    "id": str(livesession.id),
                    "is_registered": False,
                    "live_attendance": None,
                    "language": "en",
                    "lti_user_id": None,
                    "lti_id": None,
                    "should_send_reminders": True,
                    "username": None,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_livesession_lti_token_role_none(self):
        """
        User with LTI token can only fetch livesessions filtered by their token.

        livesessions can be fetched  for the same video, same consumer site and
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
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths",
            lti_user_id=str(user.id),
            username=user.username,
            video=video,
        )
        # livesession with different lti_user
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths",
            lti_user_id="5555",
            video=video,
        )
        # livesession with another consumer_site
        LiveSessionFactory(
            consumer_site=ConsumerSiteFactory(),
            email=user.email,
            lti_id="Maths",
            lti_user_id=str(user.id),
            video=video,
        )
        # livesession with another context_id
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths2",
            lti_user_id=str(user.id),
            video=video,
        )
        # livesession for another video
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=user.email,
            lti_id="Maths",
            lti_user_id=str(user.id),
            video=video2,
        )
        # livesession with the same email with no consumer_site
        AnonymousLiveSessionFactory(email=user.email, video=video)
        # livesession with the same email for another video
        AnonymousLiveSessionFactory(email=user.email, video=video2)

        # context_id in the token
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            # results aren't filtered by email
            user__email=random.choice([user.email, ""]),
        )

        response = self.client.get(
            "/api/livesessions/",
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
                    "id": str(livesession.id),
                    "is_registered": False,
                    "live_attendance": None,
                    "language": "en",
                    "lti_user_id": str(user.id),
                    "lti_id": "Maths",
                    "should_send_reminders": True,
                    "username": user.username,
                    "video": str(video.id),
                }
            ],
        )

    def test_list_livesession_lti_token_role_admin_instructors(self):
        """
        Admin/Instructors can fetch all livesessions belonging to a video.
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
        livesession = LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
            is_registered=True,
            lti_id="Maths",
        )
        # livesession with different lti_user
        livesession2 = LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
            is_registered=False,
            lti_id="Maths",
        )
        # livesession with another consumer_site
        livesession3 = LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
            consumer_site=ConsumerSiteFactory(),
            lti_id="Maths",
        )
        # livesession with another context_id
        livesession4 = LiveSessionFactory(
            video=video,
            is_from_lti_connection=True,
            lti_id="Maths2",
        )
        # anonymous live session
        livesession5 = AnonymousLiveSessionFactory(email=livesession.email, video=video)
        # livesession for another video
        LiveSessionFactory(
            video=video2,
            is_from_lti_connection=True,
            lti_id="Maths",
        )
        AnonymousLiveSessionFactory(email=livesession.email, video=video2)

        # context_id in the token
        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            context_id="Maths",
            consumer_site=str(video.playlist.consumer_site.id),
        )

        response = self.client.get(
            "/api/livesessions/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 5)
        self.assertEqual(
            response.json()["results"],
            [
                {
                    "anonymous_id": None,
                    "consumer_site": str(livesession.consumer_site.id),
                    "display_name": None,
                    "email": livesession.email,
                    "id": str(livesession.id),
                    "is_registered": True,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": livesession.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": True,
                    "username": livesession.username,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": None,
                    "consumer_site": str(livesession2.consumer_site.id),
                    "display_name": None,
                    "email": livesession2.email,
                    "id": str(livesession2.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": livesession2.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": True,
                    "username": livesession2.username,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": None,
                    "consumer_site": str(livesession3.consumer_site.id),
                    "display_name": None,
                    "email": livesession3.email,
                    "id": str(livesession3.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": livesession3.lti_user_id,
                    "lti_id": "Maths",
                    "should_send_reminders": True,
                    "username": livesession3.username,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": None,
                    "consumer_site": str(livesession4.consumer_site.id),
                    "display_name": None,
                    "email": livesession4.email,
                    "id": str(livesession4.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": livesession4.lti_user_id,
                    "lti_id": "Maths2",
                    "should_send_reminders": True,
                    "username": livesession4.username,
                    "video": str(video.id),
                },
                {
                    "anonymous_id": str(livesession5.anonymous_id),
                    "consumer_site": None,
                    "display_name": None,
                    "email": livesession5.email,
                    "id": str(livesession5.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": None,
                    "lti_id": None,
                    "should_send_reminders": True,
                    "username": None,
                    "video": str(video.id),
                },
            ],
        )

    def test_list_livesession_role_student_email_wrong_token_email(
        self,
    ):
        """
        Student can fetch his livesession even if his token has the wrong email.

        A livesession already exists for this user, this consumer site and context_id,
        but the user token shows a different email and username, the user still should
        be considered as already registered.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)

        # livesession for the same video and lti_user_id and same consumer_site
        livesession = LiveSessionFactory(
            email="chantal@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            lti_id=str(video.playlist.lti_id),
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # token doesn't have the same email as the livesession
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            roles=[STUDENT],
            user__email="anotheremail@test-fun.fr",
        )
        response = self.client.get(
            "/api/livesessions/",
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
                    "id": str(livesession.id),
                    "is_registered": False,
                    "language": "en",
                    "live_attendance": None,
                    "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                    "lti_id": str(video.playlist.lti_id),
                    "should_send_reminders": True,
                    "username": None,
                    "video": str(video.id),
                }
            ],
        )

        # if we try to set a new livesession with the email in the token, it won't be allowed
        response = self.client.post(
            "/api/livesessions/",
            {"email": "anotheremail@test-fun.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "lti_user_id": (
                    "This identified user is already registered "
                    "for this video and consumer site and course."
                )
            },
        )

    def test_api_livesession_create_role_none_email_empty(self):
        """Users with an empty email can register by setting one."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        # token with context_id
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
            roles=[NONE],
            user__id="56255f3807599c377bf0e5bf072359fd",
            user__username="Token",
            user__email=None,
        )

        response = self.client.post(
            "/api/livesessions/",
            {"email": "saved@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "saved@test-fun-mooc.fr",
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )

    def test_list_livesession_token_lti_wrong_is_registered_field(self):
        """
        Lti token can fetch list requests but will fetch only his livesession.
        A livesession without the flag is_registered set to True is not returned by
        livesessions API endpoint if it's filtered with flag is_registered.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        # livesession for the right video, lti_user_id and consumer_site
        live_session = LiveSessionFactory(
            is_from_lti_connection=True,
            is_registered=False,
            video=video,
        )

        # token has context_id and no email
        jwt_token = LiveSessionResourceAccessTokenFactory(live_session=live_session)
        response = self.client.get(
            "/api/livesessions/?is_registered=True",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)

    def test_api_livesession_post_attendance_no_payload(self):
        """Request without payload should raise an error."""
        response = self.client.post(
            "/api/livesessions/push_attendance/",
        )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_livesession_post_attendance_no_attendance(self):
        """Request without attendance should raise an error."""
        video = VideoFactory()
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
        )
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"live_attendance": ["This field is required."]}
        )

    def test_api_livesession_post_attendance_token_lti_video_not_existing(
        self,
    ):
        """Pushing an attendance on a not existing video should fail."""
        video = VideoFactory()
        jwt_token = LTIResourceAccessTokenFactory(
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
            user__email=None,
        )
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {
                "live_attendance": {
                    to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}
                }
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 404)

    def test_api_livesession_post_attendance_token_lti_consumer_site_not_existing(
        self,
    ):
        """Pushing an attendance on a not existing video should fail."""
        video = VideoFactory()
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            user__email=None,
        )
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {
                "live_attendance": {
                    to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}
                }
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_livesession_post_attendance_token_lti_email_none_previous_none(
        self,
    ):
        """Endpoint push_attendance works with no email and no previous record."""
        video = VideoFactory()
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(video.playlist.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
            user__email=None,
            user__id="56255f3807599c377bf0e5bf072359fd",
            user__username="Token",
        )
        live_attendance = {to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}}
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": live_attendance, "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 200)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": None,
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "fr",
                "live_attendance": live_attendance,
                "lti_id": str(video.playlist.lti_id),
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        self.assertEqual(
            created_livesession.consumer_site, video.playlist.consumer_site
        )
        self.assertEqual(
            created_livesession.lti_user_id, "56255f3807599c377bf0e5bf072359fd"
        )
        self.assertEqual(created_livesession.email, None)
        self.assertEqual(created_livesession.username, "Token")
        self.assertEqual(created_livesession.live_attendance, live_attendance)
        self.assertEqual(created_livesession.is_registered, False)

    def test_api_livesession_post_attendance_token_lti_existing_record(self):
        """Endpoint push_attendance updates an existing record."""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email=None,
            is_registered=False,
            live_attendance={"key1": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            context_id=str(livesession.lti_id),
            consumer_site=str(video.playlist.consumer_site.id),
            user__email="chantal@aol.com",
            user__id="56255f3807599c377bf0e5bf072359fd",
            user__username="Token",
        )
        timestamp = to_timestamp(timezone.now())
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": {timestamp: {"sound": "ON", "tabs": "OFF"}}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site_id),
                "display_name": None,
                "email": "chantal@aol.com",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": {
                    "key1": {"sound": "OFF", "tabs": "OFF"},
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                },
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveSession.objects.count(), 1)
        # update username and email with current token
        self.assertEqual(livesession.email, "chantal@aol.com")
        self.assertEqual(livesession.username, "Token")
        self.assertEqual(
            livesession.live_attendance,
            {
                "key1": {"sound": "OFF", "tabs": "OFF"},
                timestamp: {"sound": "ON", "tabs": "OFF"},
            },
        )

    def test_api_livesession_post_new_attendance_token_public_unexisting_video(
        self,
    ):
        """Pushing an attendance on a not existing video should fail"""
        anonymous_id = uuid.uuid4()
        self.assertEqual(LiveSession.objects.count(), 0)
        jwt_token = ResourceAccessTokenFactory()
        response = self.client.post(
            f"/api/livesessions/push_attendance/?anonymous_id={anonymous_id}",
            {"live_attendance": {}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(LiveSession.objects.count(), 0)

    def test_api_livesession_post_new_attendance_token_public(self):
        """Create a new live session if no one was existing for this anonymous id"""
        video = VideoFactory()
        anonymous_id = uuid.uuid4()
        self.assertEqual(LiveSession.objects.count(), 0)
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.post(
            f"/api/livesessions/push_attendance/?anonymous_id={anonymous_id}",
            {"language": "fr", "live_attendance": {}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(LiveSession.objects.count(), 1)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": None,
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "fr",
                "live_attendance": {},
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.assertEqual(created_livesession.anonymous_id, anonymous_id)

    def test_api_livesession_post_attendance_existing_token_public(self):
        """An existing live session for an anonymous id should be updated if existing."""
        livesession = AnonymousLiveSessionFactory(email=None, is_registered=False)
        self.assertEqual(LiveSession.objects.count(), 1)
        timestamp = to_timestamp(timezone.now())

        jwt_token = ResourceAccessTokenFactory(resource=livesession.video)
        response = self.client.post(
            f"/api/livesessions/push_attendance/?anonymous_id={livesession.anonymous_id}",
            {
                "live_attendance": {
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                }
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        livesession.refresh_from_db()

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(livesession.anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": None,
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": {timestamp: {"sound": "ON", "tabs": "OFF"}},
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(livesession.video.id),
            },
        )

        self.assertIsNone(livesession.email)
        self.assertIsNone(livesession.username)
        self.assertEqual(
            livesession.live_attendance,
            {
                timestamp: {"sound": "ON", "tabs": "OFF"},
            },
        )

    def test_api_livesession_post_attendance_token_public_missing_anonymous_id(self):
        """Posting an attendance with a public token and missing anonymous_id query string
        should fail."""
        video = VideoFactory()

        self.assertEqual(LiveSession.objects.count(), 0)
        timestamp = to_timestamp(timezone.now())

        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {
                "live_attendance": {
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                }
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(LiveSession.objects.count(), 0)
        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.json(),
            {"detail": "anonymous_id is missing"},
        )

    def test_api_livesession_post_attendance_token_live_attendance_timestamps(
        self,
    ):
        """Endpoint push_attendance expects the live_attendance field to only
        contain timestamps as keys"""
        livesession = LiveSessionFactory(
            is_registered=True, is_from_lti_connection=True
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertIsNone(livesession.live_attendance)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
        )

        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": {"key1": "val1"}},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "live_attendance": [
                    "Field live_attendance doesn't contain expected key "
                    "`key1`, it should be a timestamp"
                ]
            },
        )

    def test_api_livesession_post_attendance_token_ok_user_record_empty_attendance(
        self,
    ):
        """Endpoint push_attendance updates an existing record without previous live_attendance."""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            is_from_lti_connection=True,
            is_registered=True,
            email="chantal@aol.com",
            username="Token",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertEqual(livesession.live_attendance, None)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
        )

        live_attendance = {to_timestamp(timezone.now()): "val1"}

        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": live_attendance},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "chantal@aol.com",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": live_attendance,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveSession.objects.count(), 1)

        # livesession object updated with data from the token
        self.assertEqual(livesession.email, "chantal@aol.com")
        self.assertEqual(livesession.username, "Token")
        # live_attendance has been set
        self.assertEqual(livesession.live_attendance, live_attendance)

    def test_api_livesession_post_attendance_token_lti_no_update_username_email_none(
        self,
    ):
        """Endpoint push_attendance matches record and doesn't update email and username
        if they are not defined in the token"""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@aol.com",
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertEqual(livesession.live_attendance, None)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
        )
        live_attendance = {to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}}
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": live_attendance},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "chantal@aol.com",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": live_attendance,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Sylvie",
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveSession.objects.count(), 1)

        # livesession object updated with data from the token
        self.assertEqual(livesession.email, "chantal@aol.com")
        self.assertEqual(livesession.username, "Sylvie")
        # live_attendance has been set
        self.assertEqual(livesession.live_attendance, live_attendance)

    def test_api_livesession_post_attendance_token_lti_no_update_username_email_empty(
        self,
    ):
        """Endpoint push_attendance matches record and doesn't update email and username
        if they are empty in the token"""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@aol.com",
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertEqual(livesession.live_attendance, None)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
            user__email="",
            user__username="",
        )
        live_attendance = {to_timestamp(timezone.now()): {"sound": "ON", "tabs": "OFF"}}
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": live_attendance, "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "chantal@aol.com",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "fr",
                "live_attendance": live_attendance,
                "lti_id": "Maths",
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "should_send_reminders": True,
                "username": "Sylvie",
                "video": str(video.id),
            },
        )
        # no new object has been created
        self.assertEqual(LiveSession.objects.count(), 1)

        # livesession object updated with data from the token
        self.assertEqual(livesession.email, "chantal@aol.com")
        self.assertEqual(livesession.username, "Sylvie")
        # live_attendance has been set
        self.assertEqual(livesession.live_attendance, live_attendance)

    def test_api_livesession_post_attendance_wrong_language(self):
        """Wrong value of language generates an error"""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@aol.com",
            is_registered=True,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)
        self.assertEqual(livesession.live_attendance, None)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
            user__email="",
            user__username="",
        )

        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": {"key1": "val1"}, "language": "whatever"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 400)

        self.assertEqual(
            response.json(),
            {
                "language": ['"whatever" is not a valid choice.'],
                "live_attendance": [
                    "Field live_attendance doesn't contain expected key "
                    "`key1`, it should be a timestamp"
                ],
            },
        )

        # now with empty
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {"live_attendance": {to_timestamp(timezone.now()): "val1"}, "language": ""},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        livesession.refresh_from_db()

        self.assertEqual(response.status_code, 400)

        self.assertEqual(response.json(), {"language": ['"" is not a valid choice.']})

    def test_api_livesession_post_attendance_token_with_could_match_other_records(
        self,
    ):
        """Match the record with the combinaison consumer_site/lti_id/lti_user_id/video."""
        video = VideoFactory()
        video2 = VideoFactory()
        # different email and username than the token
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="another@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        # same email and username but no consumer_site
        LiveSessionFactory(
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
        LiveSessionFactory(
            consumer_site=ConsumerSiteFactory(),
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths",
            video=video,
        )
        # not the same context_id
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths2",
            video=video,
        )
        # not the same lti_user_id
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sabrina@fun-test.fr",
            live_attendance={"r1": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="444444",
            lti_id="Maths",
            video=video,
        )

        # not the same video
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            email="sabrina@fun-test.fr",
            live_attendance={"r2": {"sound": "OFF", "tabs": "OFF"}},
            lti_user_id="55555",
            lti_id="Maths",
            video=video2,
        )
        nb_created = 6
        self.assertEqual(LiveSession.objects.count(), nb_created)
        # token with same email
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id="Maths",
            user__id="55555",
            user__email="sabrina@fun-test.fr",
            user__username="Token",
        )
        timestamp = to_timestamp(timezone.now())
        response = self.client.post(
            "/api/livesessions/push_attendance/",
            {
                "language": "fr",
                "live_attendance": {timestamp: {"sound": "ON", "tabs": "OFF"}},
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        # no new record
        self.assertEqual(LiveSession.objects.count(), nb_created)

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "sabrina@fun-test.fr",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "fr",
                "live_attendance": {
                    "r2": {"sound": "OFF", "tabs": "OFF"},
                    timestamp: {"sound": "ON", "tabs": "OFF"},
                },
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        self.assertEqual(livesession.email, "sabrina@fun-test.fr")
        self.assertEqual(livesession.lti_user_id, "55555")
        self.assertEqual(livesession.lti_id, "Maths")
        self.assertEqual(livesession.username, "Token")
        self.assertEqual(livesession.language, "fr")

        self.assertEqual(
            livesession.live_attendance,
            {
                "r2": {"sound": "OFF", "tabs": "OFF"},
                timestamp: {"sound": "ON", "tabs": "OFF"},
            },
        )
        self.assertEqual(livesession.consumer_site, video.playlist.consumer_site)

    def test_api_livesession_put_username_public_no_anonymous(
        self,
    ):
        """Field anonymous_id is mandatory when the JWT token is a public one."""
        video = VideoFactory()
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_livesession_put_username_public_no_anonymous_no_displayname(
        self,
    ):
        """Field display_name is mandatory."""
        video = VideoFactory()
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"anonymous_id": uuid.uuid4()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_livesession_put_username_public_session_existing(
        self,
    ):
        """Should update the display_name with the new value."""
        video = VideoFactory()
        anonymous_id = uuid.uuid4()
        livesession = LiveSessionFactory(
            anonymous_id=anonymous_id, display_name="Samuel", video=video
        )

        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"anonymous_id": anonymous_id, "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        # no new record
        self.assertEqual(LiveSession.objects.count(), 1)

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": "Antoine",
                "email": livesession.email,
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.assertEqual(livesession.display_name, "Antoine")

    def test_api_livesession_put_username_public_session_exists_other_video(
        self,
    ):
        """Token is related to a specific video.
        We make sure that for the same anonymous_id we can't update data from other videos
        than the one refered in the token.
        """
        video = VideoFactory()
        video2 = VideoFactory()
        live_session = AnonymousLiveSessionFactory(display_name="Samuel", video=video2)

        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"anonymous_id": live_session.anonymous_id, "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        # a new record has been created
        self.assertEqual(LiveSession.objects.count(), 2)
        created_livesession = LiveSession.objects.get(video=video)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(live_session.anonymous_id),
                "consumer_site": None,
                "display_name": "Antoine",
                "email": None,
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.assertEqual(created_livesession.display_name, "Antoine")
        self.assertEqual(created_livesession.username, None)
        self.assertEqual(created_livesession.anonymous_id, live_session.anonymous_id)

    def test_api_livesession_put_username_public_session_no(
        self,
    ):
        """Should create a livesession as no previous one exists."""
        video = VideoFactory()
        anonymous_id = uuid.uuid4()

        self.assertEqual(LiveSession.objects.count(), 0)
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"anonymous_id": anonymous_id, "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        # new record
        self.assertEqual(LiveSession.objects.count(), 1)
        created_livesession = LiveSession.objects.last()

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": "Antoine",
                "email": None,
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.assertEqual(created_livesession.display_name, "Antoine")
        self.assertEqual(created_livesession.username, None)
        self.assertEqual(created_livesession.anonymous_id, anonymous_id)

    def test_api_livesession_put_username_public_already_exists(
        self,
    ):
        """display_name already exists should return a 409."""
        video = VideoFactory()
        AnonymousLiveSessionFactory(display_name="Samuel", video=video)
        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = ResourceAccessTokenFactory(resource=video)
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"anonymous_id": uuid.uuid4(), "display_name": "Samuel"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json(),
            {"display_name": "User with that display_name already exists!"},
        )

    def test_api_livesession_put_username_lti_no_displayname(self):
        """Field display_name is mandatory."""
        video = VideoFactory()
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
        )
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"anonymous_id": uuid.uuid4()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"detail": "Invalid request."})

    def test_api_livesession_put_username_lti_session_exists(self):
        """Should return the right information with existing record."""
        video = VideoFactory()
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )

        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = LiveSessionLtiTokenFactory(
            live_session=livesession,
            any_role=True,
            user__email="sabrina@fun-test.fr",
            user__username="Token",
        )
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        # no new record
        self.assertEqual(LiveSession.objects.count(), 1)

        # username has been updated with current information in the token
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": "Antoine",
                "email": "sabrina@fun-test.fr",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )
        self.assertEqual(livesession.display_name, "Antoine")
        # username has been updated with current information in the token
        self.assertEqual(livesession.username, "Token")
        # email has been updated with current information in the token
        self.assertEqual(livesession.email, "sabrina@fun-test.fr")
        self.assertEqual(livesession.video.id, video.id)

    def test_api_livesession_put_username_lti_session_exists_other_video(self):
        """Token is related to a specific video.
        We make sure that for the same anonymous_id we can't read data from other videos
        than the one refered in the token.
        """
        video = VideoFactory()
        video2 = VideoFactory()
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video2,
        )

        self.assertEqual(LiveSession.objects.count(), 1)
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(live_session.consumer_site.id),
            context_id=live_session.lti_id,
            user__email="sabrina@fun-test.fr",
            user__id=live_session.lti_user_id,
            user__username="Patou",
        )
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)

        # a new record has been created
        self.assertEqual(LiveSession.objects.count(), 2)
        created_livesession = LiveSession.objects.get(video=video)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": "Antoine",
                "email": "sabrina@fun-test.fr",
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Patou",
                "video": str(video.id),
            },
        )
        self.assertEqual(created_livesession.display_name, "Antoine")
        self.assertEqual(created_livesession.username, "Patou")

    def test_api_livesession_put_username_lti_session_no(self):
        """Should create a livesession as no previous one exists."""
        video = VideoFactory()

        self.assertEqual(LiveSession.objects.count(), 0)
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id="Maths",
            user__email="sabrina@fun-test.fr",
            user__id="55555",
            user__username="Token",
        )
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"anonymous_id": uuid.uuid4(), "display_name": "Antoine"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        # new record
        self.assertEqual(LiveSession.objects.count(), 1)
        created_livesession = LiveSession.objects.get(video=video)

        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": "Antoine",
                "email": "sabrina@fun-test.fr",
                "id": str(created_livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Token",
                "video": str(video.id),
            },
        )

        self.assertEqual(created_livesession.display_name, "Antoine")
        self.assertEqual(created_livesession.username, "Token")

    def test_api_livesession_put_username_lti_already_exists(
        self,
    ):
        """display_name already exists should return a 409."""
        video = VideoFactory()
        AnonymousLiveSessionFactory(display_name="Samuel", video=video)

        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
        )
        response = self.client.put(
            "/api/livesessions/display_name/",
            {"anonymous_id": uuid.uuid4(), "display_name": "Samuel"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(
            response.json(),
            {"display_name": "User with that display_name already exists!"},
        )

    def test_api_livesession_put_not_allowed(self):
        """Updating a live_session using a PUT method is not allowed."""
        video = VideoFactory()
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )

        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=live_session.lti_id,
            user__id=live_session.lti_user_id,
            user__username="Token",
        )

        response = self.client.put(
            f"/api/livesessions/{live_session.id}/",
            {"is_registered": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 405)

    def test_api_livesession_patch_anonymous(self):
        """Anonymous user should not be allowed to PATCH a live_session."""

        video = VideoFactory()
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )

        response = self.client.patch(f"/api/livesessions/{live_session.id}/")

        self.assertEqual(response.status_code, 401)

    def test_api_livesession_patch_staff_or_user(self):
        """Users authenticated via a session shouldn't be able to patch a live_session."""
        video = VideoFactory()
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        for user in [UserFactory(), UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            response = self.client.patch(f"/api/livesessions/{live_session.id}/")
            self.assertEqual(response.status_code, 401)

    def test_api_livesession_patch_student_not_allowed_fields(self):
        """Only is_registered field can be patched, all other fields present should generate
        a 400."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            is_registered=False,
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=live_session,
            user__username="Token",
        )

        response = self.client.patch(
            f"/api/livesessions/{live_session.id}/",
            {"is_registered": True, "anonymous_id": uuid.uuid4()},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json(), {"not_allowed_fields": ["anonymous_id"]})

    def test_api_livesession_student_patch_email_failed_from_lti_livesession_with_email(
        self,
    ):
        """live session created from an LTI session having a mail in its JWT token is not
        allowed to modify it."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            email="john@fun-test.fr",
            is_registered=False,
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=live_session,
            user__username="Token",
        )

        response = self.client.patch(
            f"/api/livesessions/{live_session.id}/",
            {"is_registered": True, "email": "sarah@fun-test.fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {
                "email": (
                    "You are not authorized to modify your email."
                    "You can only use the email from your authentication."
                )
            },
        )

    def test_api_livesession_student_patch_email_from_lti_livesession_without_email_in_token(
        self,
    ):
        """live session created from an LTI session not having a mail in its JWT token can
        modify it."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            email="john@fun-test.fr",
            is_registered=False,
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )

        self.assertIsNone(live_session.registered_at)

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=live_session,
            user__username="Token",
            user__email=None,
        )

        now = datetime(2022, 4, 7, tzinfo=timezone.utc)
        with mock.patch.object(LiveSessionTimezone, "now", return_value=now):
            response = self.client.patch(
                f"/api/livesessions/{live_session.id}/",
                {"is_registered": True, "email": "sarah@fun-test.fr"},
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )
        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": "Samantha63",
                "email": "sarah@fun-test.fr",
                "id": str(live_session.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Sylvie",
                "video": str(video.id),
            },
        )
        self.assertEqual(live_session.email, "sarah@fun-test.fr")
        self.checkRegistrationEmailSent(
            live_session.email, video, live_session.username, live_session
        )
        self.assertEqual(live_session.registered_at, now)

    def test_api_livesession_student_unregister_should_not_send_email(self):
        """A student unregistering should not receive a registration email."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            email="john@fun-test.fr",
            is_registered=True,
            lti_user_id="55555",
            lti_id="Maths",
            registered_at=datetime(2022, 4, 7, tzinfo=timezone.utc),
            username="Sylvie",
            video=video,
        )

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=live_session,
            user__username="Token",
        )

        response = self.client.patch(
            f"/api/livesessions/{live_session.id}/",
            {"is_registered": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": "Samantha63",
                "email": "john@fun-test.fr",
                "id": str(live_session.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Sylvie",
                "video": str(video.id),
            },
        )
        self.assertEqual(len(mail.outbox), 0)
        self.assertIsNone(live_session.registered_at)

    def test_api_livesession_student_not_changing_registration_should_not_change_registered_at(
        self,
    ):
        """When is_registered is not modified, registered_at should not be changed."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        is_registered = random.choice([True, False])
        registered_at = (
            datetime(2022, 4, 7, tzinfo=timezone.utc) if is_registered else None
        )
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            email="john@fun-test.fr",
            is_registered=is_registered,
            lti_user_id="55555",
            lti_id="Maths",
            registered_at=registered_at,
            username="Sylvie",
            video=video,
        )

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=live_session,
            user__username="Token",
            user__email=None,
        )

        response = self.client.patch(
            f"/api/livesessions/{live_session.id}/",
            {"email": "sarah@fun-test.fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": "Samantha63",
                "email": "sarah@fun-test.fr",
                "id": str(live_session.id),
                "is_registered": is_registered,
                "language": "en",
                "live_attendance": None,
                "lti_id": "Maths",
                "lti_user_id": "55555",
                "should_send_reminders": True,
                "username": "Sylvie",
                "video": str(video.id),
            },
        )
        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(live_session.is_registered, is_registered)
        self.assertEqual(live_session.registered_at, registered_at)

    def test_api_livesession_student_patch_with_an_other_LTI_session(self):
        """Only the live_session owner can update its own live_session"""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            email="john@fun-test.fr",
            is_registered=False,
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=live_session,
            user__id="44444",
            user__username="Token",
            user__email=None,
        )

        response = self.client.patch(
            f"/api/livesessions/{live_session.id}/",
            {"is_registered": True, "email": "sarah@fun-test.fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 404)
        self.assertEqual(live_session.email, "john@fun-test.fr")

    def test_api_livesession_admin_can_patch_any_record_from_the_same_consumer_site(
        self,
    ):
        """An admin can update all the live_session belonging to the video he is accessing."""
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
        live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Sarah",
            email="sarah@fun-test.fr",
            is_registered=False,
            lti_user_id="55555",
            lti_id="Maths",
            username="Sarah",
            video=video,
        )
        other_live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="John",
            email="john@fun-test.fr",
            is_registered=False,
            lti_user_id="44444",
            lti_id="Maths",
            username="John",
            video=video,
        )

        anonymous_live_session = AnonymousLiveSessionFactory(
            email=None,
            is_registered=False,
            video=video,
        )

        not_accessing_live_session = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Sarah",
            email="sarah@fun-test.fr",
            is_registered=False,
            lti_user_id="55555",
            lti_id="Maths",
            username="Sarah",
            video=other_video,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id="Maths",
        )

        response = self.client.patch(
            f"/api/livesessions/{live_session.id}/",
            {"is_registered": True, "email": "r00t@fun-test.fr", "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(live_session.email, "r00t@fun-test.fr")
        self.assertEqual(live_session.language, "fr")

        response = self.client.patch(
            f"/api/livesessions/{other_live_session.id}/",
            {"is_registered": True, "email": "l33t@fun-test.fr", "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        other_live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(other_live_session.email, "l33t@fun-test.fr")
        self.assertEqual(other_live_session.language, "fr")

        response = self.client.patch(
            f"/api/livesessions/{anonymous_live_session.id}/",
            {"is_registered": True, "email": "An0n@fun-test.fr", "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        anonymous_live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(anonymous_live_session.email, "An0n@fun-test.fr")
        self.assertEqual(anonymous_live_session.language, "fr")

        response = self.client.patch(
            f"/api/livesessions/{not_accessing_live_session.id}/",
            {"is_registered": True, "email": "wr0ng@fun-test.fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

    def test_api_live_session_admin_using_existing_email(self):
        """An instructor trying to update an anonymous live_session using an email
        already used in another anonymous live_session should fail."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        anonymous_live_session = AnonymousLiveSessionFactory(
            email="anon@fun-test.fr",
            is_registered=False,
            video=video,
        )
        other_anonymous_live_session = AnonymousLiveSessionFactory(
            email="anon2@fun-test.fr",
            is_registered=False,
            video=video,
        )

        jwt_token = InstructorOrAdminLtiTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id="Maths",
        )

        response = self.client.patch(
            f"/api/livesessions/{anonymous_live_session.id}/",
            {"is_registered": True, "email": other_anonymous_live_session.email},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(), {"email": "Email already registered for this live"}
        )

    def test_api_livesession_patch_email_from_anonymous_livesession(self):
        """live session created with an anonymous_id can update its email."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        anonymous_id = uuid.uuid4()
        live_session = LiveSessionFactory(
            anonymous_id=anonymous_id,
            email=None,
            is_registered=False,
            video=video,
        )
        self.assertIsNone(live_session.registered_at)

        jwt_token = ResourceAccessTokenFactory(resource=video)

        now = datetime(2022, 4, 7, tzinfo=timezone.utc)
        with mock.patch.object(LiveSessionTimezone, "now", return_value=now):
            response = self.client.patch(
                f"/api/livesessions/{live_session.id}/?anonymous_id={anonymous_id}",
                {"is_registered": True, "email": "sarah@fun-test.fr"},
                content_type="application/json",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "sarah@fun-test.fr",
                "id": str(live_session.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
        self.assertEqual(live_session.email, "sarah@fun-test.fr")
        self.checkRegistrationEmailSent(
            live_session.email, video, live_session.username, live_session
        )
        self.assertEqual(live_session.registered_at, now)

    def test_api_livesession_update_email_with_another_anonymous_id(self):
        """Updating an other live_session using an unknown anonymous_id should fail."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        live_session = AnonymousLiveSessionFactory(
            email=None,
            is_registered=False,
            video=video,
        )

        jwt_token = ResourceAccessTokenFactory(resource=video)

        other_anonymous_id = uuid.uuid4()
        response = self.client.patch(
            f"/api/livesessions/{live_session.id}/?anonymous_id={other_anonymous_id}",
            {"is_registered": True, "email": "sarah@fun-test.fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 404)
        self.assertIsNone(live_session.email)

    def test_api_livesession_send_mail_i18n(self):
        """Mails are sent in the language of the livesession"""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        self.assertTrue(video.is_scheduled)
        other_playlist = PlaylistFactory()
        # token has different context_id than the video
        jwt_token = LTIResourceAccessTokenFactory(
            resource=video,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=str(other_playlist.lti_id),
            user__id="56255f3807599c377bf0e5bf072359fd",
            user__email="salome@test-fun-mooc.fr",
            user__username="Token",
        )
        response = self.client.post(
            "/api/livesessions/",
            {
                "email": "salome@test-fun-mooc.fr",
                "language": "fr",
                "should_send_reminders": False,
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 201)
        livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": str(video.playlist.consumer_site.id),
                "display_name": None,
                "email": "salome@test-fun-mooc.fr",
                "id": str(livesession.id),
                "is_registered": True,
                "language": "fr",
                "live_attendance": None,
                "lti_user_id": "56255f3807599c377bf0e5bf072359fd",
                "lti_id": str(other_playlist.lti_id),
                "should_send_reminders": False,
                "username": "Token",
                "video": str(video.id),
            },
        )

        # check email has been sent
        self.assertEqual(len(mail.outbox), 1)

        # check we send it to the right email
        self.assertEqual(mail.outbox[0].to[0], "salome@test-fun-mooc.fr")

        # check it's the right email content
        self.assertEqual(mail.outbox[0].subject, f"Inscription validée ! {video.title}")
        email_content = " ".join(mail.outbox[0].body.split())
        self.assertIn("Inscription validée !", email_content)
        self.assertIn("Bonjour Token,", email_content)
        key_access = livesession.get_generate_salted_hmac()
        self.assertIn(
            f'Nous avons pris connaissance de votre intérêt pour cet événement "{video.title}".',
            email_content,
        )
        self.assertIn(
            f"Accéder au webinaire [//example.com/videos/{video.id}?lrpk="
            f"{livesession.pk}&amp;key={key_access}]",
            email_content,
        )
        self.assertIn(
            "Ne transmettez pas cet e-mail ou ne partagez pas ce lien. "
            "Il contient votre code personnel pour accéder à l'événement.",
            email_content,
        )

        self.assertIn(
            "Ce mail a été envoyé à salome@test-fun-mooc.fr par Marsha", email_content
        )
        self.assertIn(
            "Votre adresse e-mail est utilisée parce que vous avez manifesté votre intérêt pour "
            "ce webinaire. Si vous souhaitez vous désabonner de ces notifications, "
            "veuillez suivre le lien : ",
            email_content,
        )
        self.assertIn(
            f"se désabonner [//example.com/reminders/cancel/{livesession.pk}/"
            f"{key_access}]",
            email_content,
        )
