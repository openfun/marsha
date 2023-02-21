"""Tests for the livesession update API."""
from datetime import datetime, timedelta
import random
from unittest import mock
import uuid

from django.core import mail
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone

from marsha.core.defaults import IDLE, RAW
from marsha.core.factories import (
    AnonymousLiveSessionFactory,
    LiveSessionFactory,
    UserFactory,
    VideoFactory,
)
from marsha.core.serializers.live_session import timezone as LiveSessionTimezone
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    LiveSessionLtiTokenFactory,
    LTIResourceAccessTokenFactory,
    ResourceAccessTokenFactory,
)


class LiveSessionUpdateApiTest(TestCase):
    """Test the update API of the liveSession object."""

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

        jwt_token = ResourceAccessTokenFactory(resource=video)

        # if a wrong language is set
        response = self.client.patch(
            f"/api/livesessions/{live_session.id}/?anonymous_id={anonymous_id}",
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
            f"/api/livesessions/{live_session.id}/?anonymous_id={anonymous_id}",
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
            f"/api/livesessions/{live_session.id}/?anonymous_id={anonymous_id}",
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
