"""Tests for check_live_state command."""
from datetime import datetime, timedelta
from io import StringIO
import smtplib
from unittest import mock
import uuid

from django.conf import settings
from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

import pytz

from marsha.core.management.commands import send_reminders

from ..defaults import IDLE, RAW, RUNNING
from ..factories import LiveRegistrationFactory, VideoFactory


class SendRemindersTest(TestCase):
    """Test send_reminders command."""

    date_past = timezone.now() - timedelta(days=60)
    date_future = timezone.now() + timedelta(days=10)

    def test_send_reminders_none(self):
        """Command should do nothing when there is no liveRegistration."""
        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertEqual("", out.getvalue())
        out.close()

    def test_send_reminders_none_to_come(self):
        """Command should do nothing when there are no scheduled videos in the future."""
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=self.date_past,
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=VideoFactory(
                live_state=IDLE,
                live_type=RAW,
                starting_at=self.date_past,
            ),
        )
        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertEqual("", out.getvalue())
        out.close()

    def test_send_reminders_none_when_everything_has_been_treated(self):
        """Command should do nothing when there are scheduled videos in the
        future but all the reminders have been sent.
        """
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=self.date_future,
        )
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=self.date_past,
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            reminders=[settings.REMINDER_1, settings.REMINDER_2, settings.REMINDER_3],
            video=video,
        )
        self.assertTrue(video.is_scheduled)
        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertEqual("", out.getvalue())
        out.close()

    def test_send_reminders_started_earlier(self):
        """Command should send reminders when video started before scheduled date
        but shouldn't send reminders after. Reminders should only be sent to users that
        have not unsubscribed to mails, that haven't already received this specific reminder,
        that are registered for this video."""
        video = VideoFactory(
            live_state=RUNNING,
            live_type=RAW,
            starting_at=self.date_future,
        )
        public_registration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=self.date_past,
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        # registration with is_registered False
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=self.date_past,
            email="not_registered@test-fun-mooc.fr",
            is_registered=False,
            should_send_reminders=True,
            video=video,
        )

        # registration with reminder settings.REMINDER_IS_STARTED already sent
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=self.date_past,
            email="settings.REMINDER_sent@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            reminders=[settings.REMINDER_IS_STARTED],
            video=video,
        )

        # registration with should_send_reminders False
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=self.date_past,
            email="unsubscribed@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=False,
            video=video,
        )

        # LTI registration with other reminders sent
        lti_registration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_1, settings.REMINDER_2, settings.REMINDER_3],
            video=video,
        )

        out = StringIO()
        call_command("send_reminders", stdout=out)

        # check email have been sent
        self.assertEqual(len(mail.outbox), 2)
        # orders of email is not always the same
        list_to = [mail.outbox[0].to[0], mail.outbox[1].to[0]]

        # check we send it to the the right emails
        self.assertIn("sarah@test-fun-mooc.fr", list_to)
        self.assertIn("chantal@test-fun-mooc.fr", list_to)

        # check it's the right content
        self.assertEqual(
            mail.outbox[0].subject,
            "Webinar started earlier, come quickly to join us.",
        )
        self.assertEqual(
            mail.outbox[1].subject,
            "Webinar started earlier, come quickly to join us.",
        )

        self.assertIn(
            f"Sending email for liveregistration {public_registration.id} for "
            f"video {public_registration.video.id} step {settings.REMINDER_IS_STARTED}",
            out.getvalue(),
        )
        self.assertIn(
            f"Sending email for liveregistration {lti_registration.id} for "
            f"video {lti_registration.video.id} step {settings.REMINDER_IS_STARTED}",
            out.getvalue(),
        )

        public_registration.refresh_from_db()
        lti_registration.refresh_from_db()

        # key has been added in both registrations
        self.assertIn(settings.REMINDER_IS_STARTED, public_registration.reminders)
        self.assertIn(settings.REMINDER_IS_STARTED, lti_registration.reminders)
        out.close()

        # call the command a new time, no new email should be sent
        out = StringIO()
        call_command("send_reminders", stdout=out)
        # still two
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual("", out.getvalue())
        out.close()

    def test_send_reminders_subscribe_over_five_minutes(self):
        """Command should send reminders 5 minutes before the live if user has subscribed
        at least three hours before. Reminders should only be sent to users that
        have not unsubscribed to mails, that haven't already received this specific reminder,
        that are registered to this video."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(minutes=4),
        )

        # video starting in over 5 minutes
        video_over_5_min = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(minutes=6),
        )

        # video past and not started
        video_past = VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=self.date_past
        )
        # video already started
        video_started = VideoFactory(
            live_state=RUNNING, live_type=RAW, starting_at=self.date_future
        )

        # registration has been created only two hours before
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=2),
            email="two_hours@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        # registration has been created 4 hours ago
        public_registration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # video over 5 minutes
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="video_over_5_min@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_over_5_min,
        )

        # LTI registration with other reminders sent
        lti_registration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=10),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_2, settings.REMINDER_3],
            video=video,
        )

        # registration with settings.REMINDER_1 reminder already sent
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=4),
            email="step1@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="66255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_1],
            video=video,
        )

        # not registered
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="not_registered@test-fun-mooc.fr",
            is_registered=False,
            should_send_reminders=True,
            video=video,
        )
        # unsubscribed
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="unsubscribed@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=False,
            video=video,
        )

        # video already started
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="video_started@test-fun-mooc.fr",
            is_registered=True,
            reminders=[settings.REMINDER_IS_STARTED],
            should_send_reminders=True,
            video=video_started,
        )

        # video in the past
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="video_in_the_past@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_past,
        )

        out = StringIO()
        call_command("send_reminders", stdout=out)

        # orders of email is not always the same
        list_to = [mail.outbox[0].to[0], mail.outbox[1].to[0]]
        # check we send it to the the right emails
        self.assertIn("sarah@test-fun-mooc.fr", list_to)
        self.assertIn("chantal@test-fun-mooc.fr", list_to)
        # check it's the right content
        self.assertEqual(
            mail.outbox[0].subject,
            "Live starts in less than 5 minutes",
        )
        self.assertEqual(
            mail.outbox[1].subject,
            "Live starts in less than 5 minutes",
        )

        self.assertIn(
            f"Sending email for liveregistration {public_registration.id} for video "
            f"{public_registration.video.id} step {settings.REMINDER_1}",
            out.getvalue(),
        )
        self.assertIn(
            f"Sending email for liveregistration {lti_registration.id} for video "
            f"{lti_registration.video.id} step {settings.REMINDER_1}",
            out.getvalue(),
        )
        public_registration.refresh_from_db()
        lti_registration.refresh_from_db()
        # key has been added
        self.assertIn(settings.REMINDER_1, public_registration.reminders)
        self.assertIn(settings.REMINDER_1, lti_registration.reminders)
        out.close()

        # call the command a new time, no new email should be sent
        out = StringIO()
        call_command("send_reminders", stdout=out)
        # there is still two emails sent
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual("", out.getvalue())
        out.close()

    def test_send_reminders_subscribe_over_three_hours(self):
        """Command should send reminders 3 hours before the live if user has subscribed
        at least a day before. Reminders should only be sent to users that
        have not unsubscribed to mails, that haven't already received this specific reminder,
        that are registered to this video."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(hours=2),
        )

        # video starting over 3 hours
        video_over = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(hours=4),
        )

        # video past and not started
        video_past = VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=self.date_past
        )
        # video already started
        video_started = VideoFactory(
            live_state=RUNNING, live_type=RAW, starting_at=self.date_future
        )
        # registration has been created only 23 hours before (<1 day)
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=23),
            email="less_than_a_day@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        # registration has been created 26 hours ago (>1day)
        public_registration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # video over
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="video_over_1_day@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_over,
        )

        # LTI registration with reminder 3 sent
        lti_registration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=26),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_3],
            video=video,
        )

        # registration with settings.REMINDER_2 reminder already sent
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=26),
            email="step1@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="66255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_2],
            video=video,
        )

        # registration with settings.REMINDER_1 reminder already sent
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(hours=26),
            email="rem1@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377cf0e5bf072359fd",
            reminders=[settings.REMINDER_1],
            video=video,
        )

        # not registered
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="not_registered@test-fun-mooc.fr",
            is_registered=False,
            should_send_reminders=True,
            video=video,
        )
        # unsubscribed
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="unsubscribed@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=False,
            video=video,
        )

        # video already started
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="video_started@test-fun-mooc.fr",
            is_registered=True,
            reminders=[settings.REMINDER_IS_STARTED],
            should_send_reminders=True,
            video=video_started,
        )

        # video in the past
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="video_in_the_past@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_past,
        )

        out = StringIO()
        call_command("send_reminders", stdout=out)

        # check email have been sent
        self.assertEqual(len(mail.outbox), 2)
        # orders of email is not always the same
        list_to = [mail.outbox[0].to[0], mail.outbox[1].to[0]]
        # check we send it to the the right emails
        self.assertIn("sarah@test-fun-mooc.fr", list_to)
        self.assertIn("chantal@test-fun-mooc.fr", list_to)
        # check it's the right content
        self.assertEqual(
            mail.outbox[0].subject,
            "Live starts in less than 3 hours",
        )
        self.assertEqual(
            mail.outbox[1].subject,
            "Live starts in less than 3 hours",
        )
        self.assertIn(
            f"Sending email for liveregistration {public_registration.id} for video "
            f"{public_registration.video.id} step {settings.REMINDER_2}",
            out.getvalue(),
        )
        self.assertIn(
            f"Sending email for liveregistration {lti_registration.id} for video "
            f"{lti_registration.video.id} step {settings.REMINDER_2}",
            out.getvalue(),
        )
        public_registration.refresh_from_db()
        lti_registration.refresh_from_db()
        # key has been added
        self.assertIn(settings.REMINDER_2, public_registration.reminders)
        self.assertIn(settings.REMINDER_2, lti_registration.reminders)
        out.close()

        # call the command a new time, no new email should be sent
        out = StringIO()
        call_command("send_reminders", stdout=out)
        # there is still two emails sent
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual("", out.getvalue())
        out.close()

    def test_send_reminders_subscribe_over_three_days(self):
        """Command should send reminders three days before the live if user has subscribed
        at least 1 month before. Reminders should only be sent to users that
        have not unsubscribed to mails, that haven't already received this specific reminder,
        that are registered to this video."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=2),
        )

        # video starting in over 3 days
        video_over = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=4),
        )

        # video past and not started
        video_past = VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=self.date_past
        )
        # video already started
        video_started = VideoFactory(
            live_state=RUNNING, live_type=RAW, starting_at=self.date_future
        )

        # registration has been created only 29 days before (<30 days)
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=29),
            email="29days@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        # registration has been created 32 days agp (>30 days)
        public_registration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # video over
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="video_over@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_over,
        )

        # LTI registration
        lti_registration = LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # registration with settings.REMINDER_3 reminder already sent
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="step1@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="66255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_3],
            video=video,
        )

        # registration off because reminder settings.REMINDER_IS_STARTED already sent
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="notif_off@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="76255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_IS_STARTED],
            video=video,
        )

        # registration with settings.REMINDER_1 reminder already sent
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="rem1@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fe",
            reminders=[settings.REMINDER_1],
            video=video,
        )

        # registration with settings.REMINDER_2 reminder already sent
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="rem2@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="59256f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_2],
            video=video,
        )

        # not registered
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="not_registered@test-fun-mooc.fr",
            is_registered=False,
            should_send_reminders=True,
            video=video,
        )
        # unsubscribed
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="unsubscribed@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=False,
            video=video,
        )

        # video already started
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="video_started@test-fun-mooc.fr",
            is_registered=True,
            reminders=[settings.REMINDER_IS_STARTED],
            should_send_reminders=True,
            video=video_started,
        )

        # video in the past
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="video_in_the_past@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_past,
        )

        out = StringIO()
        call_command("send_reminders", stdout=out)

        # orders of email is not always the same
        list_to = [mail.outbox[0].to[0], mail.outbox[1].to[0]]
        # check we send it to the the right emails
        self.assertIn("sarah@test-fun-mooc.fr", list_to)
        self.assertIn("chantal@test-fun-mooc.fr", list_to)
        # check it's the right content
        self.assertEqual(
            mail.outbox[0].subject,
            "Live starts in less than 3 days",
        )
        self.assertEqual(
            mail.outbox[1].subject,
            "Live starts in less than 3 days",
        )

        self.assertIn(
            f"Sending email for liveregistration {public_registration.id} for video "
            f"{public_registration.video.id} step {settings.REMINDER_3}",
            out.getvalue(),
        )
        self.assertIn(
            f"Sending email for liveregistration {lti_registration.id} for video "
            f"{lti_registration.video.id} step {settings.REMINDER_3}",
            out.getvalue(),
        )
        public_registration.refresh_from_db()
        lti_registration.refresh_from_db()
        # key has been added
        self.assertIn(settings.REMINDER_3, public_registration.reminders)
        self.assertIn(settings.REMINDER_3, lti_registration.reminders)
        out.close()

        # call the command a new time, no new email should be sent
        out = StringIO()
        call_command("send_reminders", stdout=out)
        # there is still two emails sent
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual("", out.getvalue())
        out.close()

    def test_send_reminders_subscribe_all_process(self):
        """Subscribe to a webinar and mock the time to show all three steps
        reminders are sent."""

        now_past = datetime(2020, 8, 8, tzinfo=pytz.utc)
        with mock.patch.object(timezone, "now", return_value=now_past):
            video = VideoFactory(
                live_state=IDLE,
                live_type=RAW,
                starting_at=timezone.now() + timedelta(days=40),
            )

            registration = LiveRegistrationFactory(
                anonymous_id=uuid.uuid4(),
                created_on=timezone.now(),
                email="sarah@test-fun-mooc.fr",
                is_registered=True,
                should_send_reminders=True,
                video=video,
            )

        # back in present, when days are over starting_at time
        self.assertGreater(timezone.now(), registration.video.starting_at)
        call_command("send_reminders")
        # even if no reminders have been sent, none are sent now
        self.assertEqual(len(mail.outbox), 0)

        # move time 4 days before, nothing happens as 1st mail sent is 3 days before
        two_days = registration.video.starting_at - timedelta(days=4)
        with mock.patch.object(timezone, "now", return_value=two_days):
            call_command("send_reminders")
            self.assertEqual(len(mail.outbox), 0)

        # move time 2 days before, mail of step 3 is sent
        two_days = registration.video.starting_at - timedelta(days=2)
        with mock.patch.object(timezone, "now", return_value=two_days):
            out = StringIO()
            call_command("send_reminders", stdout=out)
            self.assertEqual(len(mail.outbox), 1)

            # check we send it to the the right email
            self.assertEqual(mail.outbox[0].to[0], "sarah@test-fun-mooc.fr")
            self.assertIn(
                f"Sending email for liveregistration {registration.id} for video "
                f"{registration.video.id} step {settings.REMINDER_3}",
                out.getvalue(),
            )
            registration.refresh_from_db()
            # key has been added
            self.assertEqual([settings.REMINDER_3], registration.reminders)
            out.close()

            # move time 18 hours before, nothing new happens
            eigteen_hours = registration.video.starting_at - timedelta(hours=18)
            with mock.patch.object(timezone, "now", return_value=eigteen_hours):
                call_command("send_reminders")
                # no new mail
                self.assertEqual(len(mail.outbox), 1)

            # move time 2 hours before, mail of step 2 is sent
            two_hours = registration.video.starting_at - timedelta(hours=2)
            with mock.patch.object(timezone, "now", return_value=two_hours):
                out = StringIO()
                call_command("send_reminders", stdout=out)
                # new mail of step2
                self.assertEqual(len(mail.outbox), 2)
                self.assertIn(
                    f"Sending email for liveregistration {registration.id} for video "
                    f"{registration.video.id} step {settings.REMINDER_2}",
                    out.getvalue(),
                )
                registration.refresh_from_db()
                # key has been added
                self.assertEqual(
                    [settings.REMINDER_3, settings.REMINDER_2], registration.reminders
                )
                out.close()

            # move time 10 minutes before, nothing new happens
            ten_minutes = registration.video.starting_at - timedelta(minutes=10)
            with mock.patch.object(timezone, "now", return_value=ten_minutes):
                call_command("send_reminders")
                # no new mail
                self.assertEqual(len(mail.outbox), 2)

            # move time 4 minutes before, mail of step1 is sent
            four_minutes = registration.video.starting_at - timedelta(minutes=4)
            with mock.patch.object(timezone, "now", return_value=four_minutes):
                out = StringIO()
                call_command("send_reminders", stdout=out)
                # mail of step1 is sent
                self.assertEqual(len(mail.outbox), 3)
                self.assertIn(
                    f"Sending email for liveregistration {registration.id} for video "
                    f"{registration.video.id} step {settings.REMINDER_1}",
                    out.getvalue(),
                )
                registration.refresh_from_db()
                # key has been added
                self.assertEqual(
                    [settings.REMINDER_3, settings.REMINDER_2, settings.REMINDER_1],
                    registration.reminders,
                )
                out.close()

    def test_send_reminders_email_step_before_reminder_1(self):
        """Reminders 3 and 2 haven't been sent, it's already time for  reminder 1,
        make sure only reminder 1 is sent."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(minutes=4),
        )

        registration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(
            f"Sending email for liveregistration {registration.id} for video "
            f"{registration.video.id} step {settings.REMINDER_1}",
            out.getvalue(),
        )
        registration.refresh_from_db()
        # only key 1 has been added
        self.assertEqual([settings.REMINDER_1], registration.reminders)

        # we call the command, no new email should be sent
        call_command("send_reminders")
        self.assertEqual(len(mail.outbox), 1)

    def test_send_reminders_email_step_before_reminder_2(self):
        """Reminders 3 haven't been sent, it's already time for reminder 2,
        make sure only reminder 2 is sent."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(hours=2),
        )

        registration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(
            f"Sending email for liveregistration {registration.id} for video "
            f"{registration.video.id} step {settings.REMINDER_2}",
            out.getvalue(),
        )
        registration.refresh_from_db()
        # only key 1 has been added
        self.assertEqual([settings.REMINDER_2], registration.reminders)

        # we call the command, no new email should be sent
        call_command("send_reminders")
        self.assertEqual(len(mail.outbox), 1)

    def test_send_reminders_send_email_fails(self):
        """send_mail fails, we make sure the error is raised and should_send_reminders is
        disabled."""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=2),
        )

        registration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        with mock.patch.object(
            send_reminders,
            "send_mail",
            side_effect=smtplib.SMTPException("Error SMTPException"),
        ):
            out = StringIO()
            err_out = StringIO()
            call_command("send_reminders", stdout=out, stderr=err_out)
            self.assertEqual(len(mail.outbox), 0)
            self.assertIn(
                f"Sending email for liveregistration {registration.id} for video "
                f"{registration.video.id} step {settings.REMINDER_3}",
                out.getvalue(),
            )
            self.assertIn("Mail failed sarah@test-fun-mooc.fr", err_out.getvalue())
            registration.refresh_from_db()
            # key has been added
            self.assertEqual(
                [settings.REMINDER_3, settings.REMINDER_ERROR], registration.reminders
            )
            out.close()

        # we call the command, no email should be sent
        call_command("send_reminders")
        self.assertEqual(len(mail.outbox), 0)

    def test_send_reminders_simultanously(self):
        """We simulate that query to update doesn't have any match results
        and make sure no emails are sent"""
        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=2),
        )

        registration = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        with mock.patch.object(
            send_reminders.Command, "query_to_update_step", return_value=0
        ):
            out = StringIO()
            call_command("send_reminders", stdout=out)
            self.assertNotIn(
                f"Sending email for liveregistration {registration.id} for video "
                f"{registration.video.id} step {settings.REMINDER_3}",
                out.getvalue(),
            )
            self.assertEqual(len(mail.outbox), 0)

        # without mocking
        out = StringIO()
        # we call the command, email should be sent
        call_command("send_reminders", stdout=out)
        self.assertIn(
            f"Sending email for liveregistration {registration.id} for video "
            f"{registration.video.id} step {settings.REMINDER_3}",
            out.getvalue(),
        )
        # this time email is sent
        self.assertEqual(len(mail.outbox), 1)
