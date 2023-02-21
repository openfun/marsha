"""Base test case for the livesession API tests."""
from django.core import mail
from django.core.cache import cache
from django.test import TestCase


class LiveSessionApiTestCase(TestCase):
    """Base test case for the API of the liveSession object."""

    maxDiff = None

    def setUp(self):
        """Reset the cache so that no throttles will be active"""
        cache.clear()

    def checkRegistrationEmailSent(self, email, video, username, live_session):
        """Shortcut to check registration email has been sent to email"""
        # check email has been sent
        self.assertEqual(len(mail.outbox), 1)

        # check we send it to the right email
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

        key_access = live_session.get_generate_salted_hmac()
        self.assertIn(
            f'We have taken note of your interest in the event "{video.title}".',
            email_content,
        )
        self.assertIn(
            f"Access the event [//example.com/videos/{video.id}?lrpk="
            f"{live_session.pk}&amp;key={key_access}]",
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
            f"unsubscribe [//example.com/reminders/cancel/{live_session.pk}/"
            f"{key_access}]",
            email_content,
        )

        # emails are generated from mjml format, test rendering of email doesn't
        # contain any trans tag, it might happen if \n are generated
        self.assertNotIn("trans", email_content)
