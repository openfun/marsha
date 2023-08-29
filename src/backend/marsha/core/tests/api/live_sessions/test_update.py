"""Tests for the livesession update API."""
from datetime import datetime, timedelta, timezone as baseTimezone
import random
from unittest import mock
import uuid

from django.core import mail
from django.utils import timezone

from marsha.core.defaults import IDLE, RAW
from marsha.core.factories import (
    AnonymousLiveSessionFactory,
    LiveSessionFactory,
    OrganizationAccessFactory,
    OrganizationFactory,
    UserFactory,
    VideoFactory,
    WebinarVideoFactory,
)
from marsha.core.models import ADMINISTRATOR, INSTRUCTOR, STUDENT
from marsha.core.serializers.live_session import timezone as LiveSessionTimezone
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    LiveSessionLtiTokenFactory,
    LTIPlaylistAccessTokenFactory,
    PlaylistAccessTokenFactory,
    UserAccessTokenFactory,
)

from .base import LiveSessionApiTestCase


class LiveSessionUpdateApiTest(LiveSessionApiTestCase):
    """Test the update API of the liveSession object."""

    def _update_url(self, video, live_session):
        """Return the url to use in tests."""
        return f"/api/videos/{video.pk}/livesessions/{live_session.pk}/"

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.organization = OrganizationFactory()
        cls.live = WebinarVideoFactory(playlist__organization=cls.organization)

    def assert_response_resource_not_accessible(self, response):
        """Assert response resource not the same as video_id"""
        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.json(),
            {"detail": "You do not have permission to perform this action."},
        )

    def assert_user_cannot_patch(self, user, video):
        """Assert a user cannot update livesession with a PATCH request."""
        livesession = LiveSessionFactory(
            email=user.email,
            is_registered=True,
            user=user,
            video=video,
        )
        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.patch(
            self._update_url(video, livesession),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, 403)

    def assert_user_can_patch(self, user, video):
        """Assert a user cannot update livesession with a PATCH request."""
        livesession = LiveSessionFactory(
            email=user.email,
            is_registered=True,
            user=user,
            video=video,
        )

        jwt_token = UserAccessTokenFactory(user=user)

        response = self.client.patch(
            self._update_url(video, livesession),
            {"is_registered": False, "email": "sarah@fun-test.fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": None,
                "consumer_site": None,
                "display_name": None,
                "email": "sarah@fun-test.fr",
                "id": str(livesession.id),
                "is_registered": False,
                "language": "en",
                "live_attendance": None,
                "lti_id": None,
                "lti_user_id": None,
                "should_send_reminders": True,
                "username": user.username,
                "video": str(video.id),
            },
        )

    def test_patch_by_anonymous_user(self):
        """Anonymous users cannot update livesession."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            display_name="Samantha63",
            email="john@fun-test.fr",
            is_registered=False,
            lti_user_id="55555",
            lti_id="Maths",
            username="Sylvie",
            video=video,
        )
        response = self.client.get(
            self._update_url(self.live, livesession),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_patch_by_random_logged_in_user(self):
        """
        Random logged-in users.

        Cannot update livesession for playlist they have no role in.
        """
        user = UserFactory()

        self.assert_user_cannot_patch(user, self.live)

    def test_patch_by_organization_student(self):
        """Organization students cannot update livesession."""
        organization_access = OrganizationAccessFactory(
            role=STUDENT,
            organization=self.organization,
        )

        self.assert_user_cannot_patch(organization_access.user, self.live)

    def test_patch_by_organization_instructor(self):
        """Organization instructors cannot update livesession."""
        organization_access = OrganizationAccessFactory(
            role=INSTRUCTOR,
            organization=self.organization,
        )

        self.assert_user_cannot_patch(organization_access.user, self.live)

    def test_patch_by_organization_administrator(self):
        """Organization administrators can update livesession."""
        organization_access = OrganizationAccessFactory(
            role=ADMINISTRATOR,
            organization=self.organization,
        )

        self.assert_user_can_patch(organization_access.user, self.live)

    def test_api_livesession_update_put_anonymous_not_allowed(self):
        """Anonymous can't update livesession."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        live_session = AnonymousLiveSessionFactory(video=video)
        response = self.client.put(
            self._update_url(video, live_session),
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json(), {"detail": 'Method "PUT" not allowed.'})

    def test_api_livesession_update_patch_anonymous_not_allowed(self):
        """Anonymous can't update livesession."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=100),
        )
        live_session = AnonymousLiveSessionFactory(video=video)

        response = self.client.patch(
            self._update_url(video, live_session),
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
        live_session = AnonymousLiveSessionFactory(video=video)
        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)

        response = self.client.put(
            self._update_url(video, live_session),
            {"email": "salome@test-fun-mooc.fr", "should_send_reminders": False},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json(), {"detail": 'Method "PUT" not allowed.'})

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

        jwt_token = LTIPlaylistAccessTokenFactory(
            playlist=video.playlist,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id=live_session.lti_id,
            user__id=live_session.lti_user_id,
            user__username="Token",
        )

        response = self.client.put(
            self._update_url(video, live_session),
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

        response = self.client.patch(self._update_url(video, live_session))

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
            response = self.client.patch(self._update_url(video, live_session))
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
            self._update_url(video, live_session),
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
            self._update_url(video, live_session),
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

        now = datetime(2022, 4, 7, tzinfo=baseTimezone.utc)
        with mock.patch.object(LiveSessionTimezone, "now", return_value=now):
            response = self.client.patch(
                self._update_url(video, live_session),
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
            registered_at=datetime(2022, 4, 7, tzinfo=baseTimezone.utc),
            username="Sylvie",
            video=video,
        )

        jwt_token = LiveSessionLtiTokenFactory(
            live_session=live_session,
            user__username="Token",
        )

        response = self.client.patch(
            self._update_url(video, live_session),
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
            datetime(2022, 4, 7, tzinfo=baseTimezone.utc) if is_registered else None
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
            self._update_url(video, live_session),
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
            self._update_url(video, live_session),
            {"is_registered": True, "email": "sarah@fun-test.fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 403)
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
            playlist=video.playlist,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id="Maths",
        )

        response = self.client.patch(
            self._update_url(video, live_session),
            {"is_registered": True, "email": "r00t@fun-test.fr", "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(live_session.email, "r00t@fun-test.fr")
        self.assertEqual(live_session.language, "fr")

        response = self.client.patch(
            self._update_url(other_live_session.video, other_live_session),
            {"is_registered": True, "email": "l33t@fun-test.fr", "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        other_live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(other_live_session.email, "l33t@fun-test.fr")
        self.assertEqual(other_live_session.language, "fr")

        response = self.client.patch(
            self._update_url(anonymous_live_session.video, anonymous_live_session),
            {"is_registered": True, "email": "An0n@fun-test.fr", "language": "fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        anonymous_live_session.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(anonymous_live_session.email, "An0n@fun-test.fr")
        self.assertEqual(anonymous_live_session.language, "fr")

        response = self.client.patch(
            self._update_url(
                not_accessing_live_session.video, not_accessing_live_session
            ),
            {"is_registered": True, "email": "wr0ng@fun-test.fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        self.assert_response_resource_not_accessible(response)

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
            playlist=video.playlist,
            consumer_site=str(video.playlist.consumer_site.id),
            context_id="Maths",
        )

        response = self.client.patch(
            self._update_url(anonymous_live_session.video, anonymous_live_session),
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

        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)

        now = datetime(2022, 4, 7, tzinfo=baseTimezone.utc)
        with mock.patch.object(LiveSessionTimezone, "now", return_value=now):
            response = self.client.patch(
                f"{self._update_url(video, live_session)}?anonymous_id={anonymous_id}",
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
        """Updating another live_session using an unknown anonymous_id should fail."""
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

        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)

        other_anonymous_id = uuid.uuid4()
        response = self.client.patch(
            f"{self._update_url(video, live_session)}?anonymous_id={other_anonymous_id}",
            {"is_registered": True, "email": "sarah@fun-test.fr"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        live_session.refresh_from_db()
        self.assertEqual(response.status_code, 403)
        self.assertIsNone(live_session.email)

    def test_api_livesession_patch_language(self):
        """Check language can be updated"""
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
        self.assertEqual(live_session.language, "en")

        jwt_token = PlaylistAccessTokenFactory(playlist=video.playlist)

        # if a wrong language is set
        response = self.client.patch(
            f"{self._update_url(video, live_session)}?anonymous_id={anonymous_id}",
            {
                "is_registered": True,
                "email": "sarah@fun-test.fr",
                "language": "whatever",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        live_session.refresh_from_db()
        self.assertEqual(live_session.language, "en")
        self.assertEqual(
            response.json(), {"language": ['"whatever" is not a valid choice.']}
        )

        # now with empty
        response = self.client.patch(
            f"{self._update_url(video, live_session)}?anonymous_id={anonymous_id}",
            {
                "is_registered": True,
                "email": "sarah@fun-test.fr",
                "language": "",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )
        live_session.refresh_from_db()
        self.assertEqual(live_session.language, "en")
        self.assertEqual(response.json(), {"language": ['"" is not a valid choice.']})

        # now with a value accepted
        response = self.client.patch(
            f"{self._update_url(video, live_session)}?anonymous_id={anonymous_id}",
            {
                "is_registered": True,
                "email": "sarah@fun-test.fr",
                "language": "fr",
            },
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        live_session.refresh_from_db()
        self.assertEqual(live_session.language, "fr")
        self.assertEqual(
            response.json(),
            {
                "anonymous_id": str(anonymous_id),
                "consumer_site": None,
                "display_name": None,
                "email": "sarah@fun-test.fr",
                "id": str(live_session.id),
                "is_registered": True,
                "language": "fr",
                "live_attendance": None,
                "lti_user_id": None,
                "lti_id": None,
                "should_send_reminders": True,
                "username": None,
                "video": str(video.id),
            },
        )
