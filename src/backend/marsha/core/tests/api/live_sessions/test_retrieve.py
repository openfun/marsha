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
