"""Test for the view to cancel reminders view."""
from datetime import timedelta

from django.test import TestCase
from django.utils import timezone

from ..defaults import IDLE, JITSI
from ..factories import LiveRegistrationFactory, VideoFactory


class ReminderCanceliewTestCase(TestCase):
    """Test the views to cancel reminders."""

    def test_views_reminders_cancel_no_params(self):
        """Shouldn't be able to access url without any params."""
        response = self.client.get("/reminders/cancel/")
        self.assertEqual(response.status_code, 404)

    def test_views_reminders_cancel_good_params(self):
        """Should inactivate reminders for the liveregistration targeted."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
            starting_at=timezone.now() + timedelta(hours=10),
            title="How to be perfect!",
        )

        # LTI registration
        lti_registration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=10),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # before accessing the cancel url, reminders are activated
        self.assertEqual(lti_registration.should_send_reminders, True)

        response = self.client.get(
            f"/reminders/cancel/{lti_registration.id}/"
            f"{lti_registration.get_generate_salted_hmac()}"
        )
        self.assertEqual(response.status_code, 200)

        self.assertContains(response, "<html>")
        content = response.content.decode("utf-8")
        self.assertIn("Reminders disabled", content)
        self.assertIn(
            "You have successfully unregistered your email for the alerts of "
            "the video How to be perfect!",
            content,
        )
        self.assertIn("You won't receive any reminders about this webinar.", content)
        lti_registration.refresh_from_db()
        self.assertEqual(lti_registration.should_send_reminders, False)

    def test_views_reminders_cancel_wrong_salted_hmac(self):
        """Should not access if salted hmac is wrong."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=JITSI,
            starting_at=timezone.now() + timedelta(hours=10),
            title="How to be perfect!",
        )

        # LTI registration
        lti_registration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=10),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        # non sense hmac
        response = self.client.get(f"/reminders/cancel/{lti_registration.id}/123/")
        self.assertEqual(response.status_code, 404)

        # possible hmac but not the corresponding one
        other_registration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=10),
            email="raoul@test-fun-mooc.fr",
            is_registered=True,
            lti_id="Maths",
            lti_user_id="36255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        response = self.client.get(
            f"/reminders/cancel/{lti_registration.id}/"
            f"{other_registration.get_generate_salted_hmac()}/"
        )
        self.assertEqual(response.status_code, 404)
