"""Tests for the livesession create API."""
from datetime import datetime, timedelta
from logging import Logger
import smtplib
from unittest import mock
import uuid

from django.core import mail
from django.utils import timezone

from marsha.core.defaults import IDLE, RAW
from marsha.core.factories import (
    AnonymousLiveSessionFactory,
    ConsumerSiteFactory,
    LiveSessionFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    PlaylistFactory,
    UserFactory,
    VideoFactory,
    WebinarVideoFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT, LiveSession
from marsha.core.models.account import NONE
from marsha.core.serializers.live_session import timezone as LiveSessionTimezone
from marsha.core.simple_jwt.factories import (
    LiveSessionLtiTokenFactory,
    LTIResourceAccessTokenFactory,
    ResourceAccessTokenFactory,
    UserAccessTokenFactory,
)

from .base import LiveSessionApiTestCase


# pylint: disable=too-many-lines


class LiveSessionCreateApiTest(LiveSessionApiTestCase):
    """Test the create API of the liveSession object."""

    def _post_url(self, video):
        """Return the url to use to create a live session."""
        return f"/api/videos/{video.pk}/livesessions/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.organization = OrganizationFactory()
        cls.live = WebinarVideoFactory(playlist__organization=cls.organization)

    def assert_user_cannot_create(self, user, video):
        """Assert a user cannot create with a POST request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            self._post_url(video),
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def assert_user_can_create(self, user, video):
        """Assert a user can create with a POST request."""
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.post(
            self._post_url(video),
            {"email": user.email, "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 201)
        created_livesession = LiveSession.objects.last()
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": None,
                "display_name": None,
                "email": user.email,
                "id": str(created_livesession.id),
                "is_registered": True,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": False,
                "username": user.username,
                "video": str(video.id),
            },
        )

        self.checkRegistrationEmailSent(user.email, video, None, created_livesession)

    def test_create_by_anonymous_user(self):
        """Anonymous users create."""
        response = self.client.post(
            self._post_url(self.live),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_create_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot update access for playlist they have no role in.
        """
        user = UserFactory()

        self.assert_user_cannot_create(user, self.live)

    def test_create_by_organization_student(self):
        """Organization students cannot create."""
        organization_access = OrganizationAccessFactory(
            role=STUDENT,
            organization=self.organization,
        )

        self.assert_user_cannot_create(organization_access.user, self.live)

    def test_create_by_organization_instructor(self):
        """Organization instructors cannot create."""
        organization_access = OrganizationAccessFactory(
            role=INSTRUCTOR,
            organization=self.organization,
        )

        self.assert_user_cannot_create(organization_access.user, self.live)

    def test_create_by_organization_administrator(self):
        """Organization administrators can create."""
        organization_access = OrganizationAccessFactory(
            role=ADMINISTRATOR,
            organization=self.organization,
        )

        self.assert_user_can_create(organization_access.user, self.live)

    def test_api_livesession_create_anonymous(self):
        """Anonymous users should not be able to create a livesession."""
        video = VideoFactory()

        response = self.client.post(self._post_url(video))
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
            self._post_url(video),
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
            self._post_url(video),
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
                self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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

    def test_api_livesession_create_with_unknown_video(self):
        """Token with wrong resource_id should render a 404."""
        video = VideoFactory()

        # token with no user information
        jwt_token = ResourceAccessTokenFactory()
        response = self.client.post(
            self._post_url(video),
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": True},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 404)

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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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
            self._post_url(video),
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


# Old routes to remove
class LiveSessionCreateApiOldTest(LiveSessionCreateApiTest):
    """Test the create API of the liveSession object with old URLs."""

    def _post_url(self, video):
        """Return the url to use to create a live session."""
        return "/api/livesessions/"

    def assert_user_can_create(self, user, video):
        """Defuse original assertion for old URLs"""
        self.assert_user_cannot_create(user, video)
