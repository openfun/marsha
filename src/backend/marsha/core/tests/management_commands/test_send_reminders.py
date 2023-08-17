"""Tests for send_reminders command."""
from datetime import datetime, timedelta, timezone as baseTimezone
from io import StringIO
import smtplib
from unittest import mock
import uuid

from django.conf import settings
from django.core import mail
from django.core.management import call_command
from django.test import TestCase
from django.utils import dateformat, timezone

from marsha.core.defaults import IDLE, JITSI, RAW, RUNNING
from marsha.core.factories import LiveSessionFactory, VideoFactory
from marsha.core.management.commands import send_reminders
from marsha.core.simple_jwt.factories import InstructorOrAdminLtiTokenFactory


# pylint: disable=too-many-lines


class SendRemindersTest(TestCase):
    """Test send_reminders command."""

    date_past = timezone.now() - timedelta(days=60)
    date_future = timezone.now() + timedelta(days=10)

    def test_send_reminders_none(self):
        """Command should do nothing when there is no livesession."""
        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertEqual("", out.getvalue())
        out.close()

    def test_send_reminders_none_to_come(self):
        """Command should do nothing when there are no scheduled videos in the future."""
        LiveSessionFactory(
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
        LiveSessionFactory(
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

        # livesession has been created only two hours before
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=2),
            email="two_hours@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        # livesession has been created 4 hours ago
        public_livesession = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # video over 5 minutes
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="video_over_5_min@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_over_5_min,
        )

        # LTI livesession with other reminders sent
        lti_livesession = LiveSessionFactory(
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

        # livesession with settings.REMINDER_1 reminder already sent
        LiveSessionFactory(
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
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="not_registered@test-fun-mooc.fr",
            is_registered=False,
            should_send_reminders=True,
            video=video,
        )
        # unsubscribed
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="unsubscribed@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=False,
            video=video,
        )

        # video already started
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=4),
            email="video_started@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_started,
        )

        # video in the past
        LiveSessionFactory(
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
        # check this kind of template is well formed
        self.assertNotIn("trans", mail.outbox[0].body)

        lti_key_access = lti_livesession.get_generate_salted_hmac()
        public_key_access = public_livesession.get_generate_salted_hmac()
        self.assertIn(
            f"Access the event [//example.com/videos/{lti_livesession.video.pk}?lrpk="
            f"{lti_livesession.pk}&amp;key={lti_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )
        self.assertIn(
            "Do not forward this email or share this link. "
            "It contains your personal code to access the event.",
            " ".join(mail.outbox[0].body.split()),
        )

        self.assertIn(
            f"unsubscribe [//example.com/reminders/cancel/{lti_livesession.pk}/"
            f"{lti_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )

        self.assertIn(
            f"Access the event [//example.com/videos/{public_livesession.video.pk}?lrpk="
            f"{public_livesession.pk}&amp;key={public_key_access}]",
            " ".join(mail.outbox[1].body.split()),
        )
        self.assertIn(
            "Do not forward this email or share this link. "
            "It contains your personal code to access the event.",
            " ".join(mail.outbox[1].body.split()),
        )
        self.assertIn(
            f"unsubscribe [//example.com/reminders/cancel/{public_livesession.pk}/"
            f"{public_key_access}]",
            " ".join(mail.outbox[1].body.split()),
        )

        self.assertIn(
            f"Sending email for livesession {public_livesession.id} for video "
            f"{public_livesession.video.id} step {settings.REMINDER_1}",
            out.getvalue(),
        )
        self.assertIn(
            f"Sending email for livesession {lti_livesession.id} for video "
            f"{lti_livesession.video.id} step {settings.REMINDER_1}",
            out.getvalue(),
        )
        public_livesession.refresh_from_db()
        lti_livesession.refresh_from_db()
        # key has been added
        self.assertIn(settings.REMINDER_1, public_livesession.reminders)
        self.assertIn(settings.REMINDER_1, lti_livesession.reminders)
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
        # livesession has been created only 23 hours before (<1 day)
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=23),
            email="less_than_a_day@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        # livesession has been created 26 hours ago (>1day)
        public_livesession = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # video over
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="video_over_1_day@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_over,
        )

        # LTI livesession with reminder 3 sent
        lti_livesession = LiveSessionFactory(
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

        # livesession with settings.REMINDER_2 reminder already sent
        LiveSessionFactory(
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

        # livesession with settings.REMINDER_1 reminder already sent
        LiveSessionFactory(
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
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="not_registered@test-fun-mooc.fr",
            is_registered=False,
            should_send_reminders=True,
            video=video,
        )
        # unsubscribed
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="unsubscribed@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=False,
            video=video,
        )

        # video already started
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(hours=26),
            email="video_started@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_started,
        )

        # video in the past
        LiveSessionFactory(
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
        # check this kind of template is well formed
        self.assertNotIn("trans", mail.outbox[0].body)
        lti_key_access = lti_livesession.get_generate_salted_hmac()
        public_key_access = public_livesession.get_generate_salted_hmac()
        self.assertIn(
            f"Access the event [//example.com/videos/{public_livesession.video.pk}?lrpk="
            f"{public_livesession.pk}&amp;key={public_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )
        self.assertIn(
            "Do not forward this email or share this link. "
            "It contains your personal code to access the event.",
            " ".join(mail.outbox[0].body.split()),
        )

        self.assertIn(
            f"unsubscribe [//example.com/reminders/cancel/{public_livesession.pk}/"
            f"{public_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )

        self.assertIn(
            f"unsubscribe [//example.com/reminders/cancel/{lti_livesession.pk}/"
            f"{lti_key_access}]",
            " ".join(mail.outbox[1].body.split()),
        )
        self.assertIn(
            f"Access the event [//example.com/videos/{lti_livesession.video.pk}?lrpk="
            f"{lti_livesession.pk}&amp;key={lti_key_access}]",
            " ".join(mail.outbox[1].body.split()),
        )
        self.assertIn(
            "Do not forward this email or share this link. "
            "It contains your personal code to access the event.",
            " ".join(mail.outbox[1].body.split()),
        )
        self.assertIn(
            f"Sending email for livesession {public_livesession.id} for video "
            f"{public_livesession.video.id} step {settings.REMINDER_2}",
            out.getvalue(),
        )
        self.assertIn(
            f"Sending email for livesession {lti_livesession.id} for video "
            f"{lti_livesession.video.id} step {settings.REMINDER_2}",
            out.getvalue(),
        )
        public_livesession.refresh_from_db()
        lti_livesession.refresh_from_db()
        # key has been added
        self.assertIn(settings.REMINDER_2, public_livesession.reminders)
        self.assertIn(settings.REMINDER_2, lti_livesession.reminders)
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

        # livesession has been created only 29 days before (<30 days)
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=29),
            email="29days@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )
        # livesession has been created 32 days agp (>30 days)
        public_livesession = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # video over
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="video_over@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_over,
        )

        # LTI livesession
        lti_livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

        # livesession with settings.REMINDER_3 reminder already sent
        LiveSessionFactory(
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

        # livesession with settings.REMINDER_1 reminder already sent
        LiveSessionFactory(
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

        # livesession with settings.REMINDER_2 reminder already sent
        LiveSessionFactory(
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
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="not_registered@test-fun-mooc.fr",
            is_registered=False,
            should_send_reminders=True,
            video=video,
        )
        # unsubscribed
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="unsubscribed@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=False,
            video=video,
        )

        # video already started
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="video_started@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video_started,
        )

        # video in the past
        LiveSessionFactory(
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
        # check this kind of template is well formed
        self.assertNotIn("trans", mail.outbox[0].body)
        lti_key_access = lti_livesession.get_generate_salted_hmac()
        public_key_access = public_livesession.get_generate_salted_hmac()
        self.assertIn(
            f"Access the event [//example.com/videos/{lti_livesession.video.pk}?lrpk="
            f"{lti_livesession.pk}&amp;key={lti_key_access}]",
            " ".join(mail.outbox[1].body.split()),
        )
        self.assertIn(
            "Do not forward this email or share this link. "
            "It contains your personal code to access the event.",
            " ".join(mail.outbox[1].body.split()),
        )

        self.assertIn(
            f"unsubscribe [//example.com/reminders/cancel/{lti_livesession.pk}/"
            f"{lti_key_access}]",
            " ".join(mail.outbox[1].body.split()),
        )

        self.assertIn(
            f"unsubscribe [//example.com/reminders/cancel/{public_livesession.pk}/"
            f"{public_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )
        self.assertIn(
            f"Access the event [//example.com/videos/{public_livesession.video.pk}?lrpk="
            f"{public_livesession.pk}&amp;key={public_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )
        self.assertIn(
            "Do not forward this email or share this link. "
            "It contains your personal code to access the event.",
            " ".join(mail.outbox[0].body.split()),
        )

        self.assertIn(
            f"Sending email for livesession {public_livesession.id} for video "
            f"{public_livesession.video.id} step {settings.REMINDER_3}",
            out.getvalue(),
        )

        self.assertIn(
            f"Sending email for livesession {lti_livesession.id} for video "
            f"{lti_livesession.video.id} step {settings.REMINDER_3}",
            out.getvalue(),
        )
        public_livesession.refresh_from_db()
        lti_livesession.refresh_from_db()
        # key has been added
        self.assertIn(settings.REMINDER_3, public_livesession.reminders)
        self.assertIn(settings.REMINDER_3, lti_livesession.reminders)
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

        now_past = datetime(2020, 8, 8, tzinfo=baseTimezone.utc)
        with mock.patch.object(timezone, "now", return_value=now_past):
            video = VideoFactory(
                live_state=IDLE,
                live_type=RAW,
                starting_at=timezone.now() + timedelta(days=40),
            )

            livesession = LiveSessionFactory(
                anonymous_id=uuid.uuid4(),
                created_on=timezone.now(),
                email="sarah@test-fun-mooc.fr",
                is_registered=True,
                should_send_reminders=True,
                video=video,
            )

        # back in present, when days are over starting_at time
        self.assertGreater(timezone.now(), livesession.video.starting_at)
        call_command("send_reminders")
        # even if no reminders have been sent, none are sent now
        self.assertEqual(len(mail.outbox), 0)

        # move time 4 days before, nothing happens as 1st mail sent is 3 days before
        two_days = livesession.video.starting_at - timedelta(days=4)
        with mock.patch.object(timezone, "now", return_value=two_days):
            call_command("send_reminders")
            self.assertEqual(len(mail.outbox), 0)

        # move time 2 days before, mail of step 3 is sent
        two_days = livesession.video.starting_at - timedelta(days=2)
        with mock.patch.object(timezone, "now", return_value=two_days):
            out = StringIO()
            call_command("send_reminders", stdout=out)
            self.assertEqual(len(mail.outbox), 1)

            # check we send it to the the right email
            self.assertEqual(mail.outbox[0].to[0], "sarah@test-fun-mooc.fr")
            self.assertIn(
                f"Sending email for livesession {livesession.id} for video "
                f"{livesession.video.id} step {settings.REMINDER_3}",
                out.getvalue(),
            )
            livesession.refresh_from_db()
            # key has been added
            self.assertEqual([settings.REMINDER_3], livesession.reminders)
            out.close()

            # move time 18 hours before, nothing new happens
            eigteen_hours = livesession.video.starting_at - timedelta(hours=18)
            with mock.patch.object(timezone, "now", return_value=eigteen_hours):
                call_command("send_reminders")
                # no new mail
                self.assertEqual(len(mail.outbox), 1)

            # move time 2 hours before, mail of step 2 is sent
            two_hours = livesession.video.starting_at - timedelta(hours=2)
            with mock.patch.object(timezone, "now", return_value=two_hours):
                out = StringIO()
                call_command("send_reminders", stdout=out)
                # new mail of step2
                self.assertEqual(len(mail.outbox), 2)
                self.assertIn(
                    f"Sending email for livesession {livesession.id} for video "
                    f"{livesession.video.id} step {settings.REMINDER_2}",
                    out.getvalue(),
                )
                livesession.refresh_from_db()
                # key has been added
                self.assertEqual(
                    [settings.REMINDER_3, settings.REMINDER_2], livesession.reminders
                )
                out.close()

            # move time 10 minutes before, nothing new happens
            ten_minutes = livesession.video.starting_at - timedelta(minutes=10)
            with mock.patch.object(timezone, "now", return_value=ten_minutes):
                call_command("send_reminders")
                # no new mail
                self.assertEqual(len(mail.outbox), 2)

            # move time 4 minutes before, mail of step1 is sent
            four_minutes = livesession.video.starting_at - timedelta(minutes=4)
            with mock.patch.object(timezone, "now", return_value=four_minutes):
                out = StringIO()
                call_command("send_reminders", stdout=out)
                # mail of step1 is sent
                self.assertEqual(len(mail.outbox), 3)
                self.assertIn(
                    f"Sending email for livesession {livesession.id} for video "
                    f"{livesession.video.id} step {settings.REMINDER_1}",
                    out.getvalue(),
                )
                livesession.refresh_from_db()
                # key has been added
                self.assertEqual(
                    [settings.REMINDER_3, settings.REMINDER_2, settings.REMINDER_1],
                    livesession.reminders,
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

        livesession = LiveSessionFactory(
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
            f"Sending email for livesession {livesession.id} for video "
            f"{livesession.video.id} step {settings.REMINDER_1}",
            out.getvalue(),
        )
        livesession.refresh_from_db()
        # only key 1 has been added
        self.assertEqual([settings.REMINDER_1], livesession.reminders)

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

        livesession = LiveSessionFactory(
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
            f"Sending email for livesession {livesession.id} for video "
            f"{livesession.video.id} step {settings.REMINDER_2}",
            out.getvalue(),
        )
        livesession.refresh_from_db()
        # only key 1 has been added
        self.assertEqual([settings.REMINDER_2], livesession.reminders)

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

        livesession = LiveSessionFactory(
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
                f"Sending email for livesession {livesession.id} for video "
                f"{livesession.video.id} step {settings.REMINDER_3}",
                out.getvalue(),
            )
            self.assertIn("Mail failed sarah@test-fun-mooc.fr", err_out.getvalue())
            livesession.refresh_from_db()
            # key has been added
            self.assertEqual(
                [settings.REMINDER_3, settings.REMINDER_ERROR], livesession.reminders
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

        livesession = LiveSessionFactory(
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
                f"Sending email for livesession {livesession.id} for video "
                f"{livesession.video.id} step {settings.REMINDER_3}",
                out.getvalue(),
            )
            self.assertEqual(len(mail.outbox), 0)

        # without mocking
        out = StringIO()
        # we call the command, email should be sent
        call_command("send_reminders", stdout=out)
        self.assertIn(
            f"Sending email for livesession {livesession.id} for video "
            f"{livesession.video.id} step {settings.REMINDER_3}",
            out.getvalue(),
        )
        # this time email is sent
        self.assertEqual(len(mail.outbox), 1)

    def test_send_reminders_date_has_changed(self):
        """If date of video has been updated, check reminder has been sent."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=200),
        )
        video_live_state = VideoFactory(
            live_state=RUNNING,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=400),
        )
        # video past and not started
        video_past = VideoFactory(
            live_state=IDLE, live_type=RAW, starting_at=self.date_past
        )

        public_livesession = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            must_notify=[settings.REMINDER_DATE_UPDATED],
            should_send_reminders=True,
            video=video,
        )
        # reminders have the tag REMINDER_ERROR
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah3@test-fun-mooc.fr",
            is_registered=True,
            reminders=[settings.REMINDER_ERROR],
            must_notify=[settings.REMINDER_DATE_UPDATED],
            should_send_reminders=True,
            video=video,
        )

        # must_notify has another tag
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah2@test-fun-mooc.fr",
            is_registered=True,
            must_notify=["SOME_DATA"],
            should_send_reminders=True,
            video=video,
        )

        # video past
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="video_started@test-fun-mooc.fr",
            is_registered=True,
            must_notify=[settings.REMINDER_DATE_UPDATED],
            should_send_reminders=True,
            video=video_past,
        )

        # LTI livesession
        lti_livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            must_notify=[settings.REMINDER_DATE_UPDATED],
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            should_send_reminders=True,
            video=video,
        )

        # livesession with settings.REMINDER_DATE_UPDATED reminder
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="already_sent@test-fun-mooc.fr",
            is_registered=True,
            must_notify=[settings.REMINDER_DATE_UPDATED],
            lti_id="Maths",
            lti_user_id="66255f3807599c377bf0e5bf072359fd",
            reminders=[settings.REMINDER_DATE_UPDATED],
            should_send_reminders=True,
            video=video,
        )

        # not registered
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="not_registered@test-fun-mooc.fr",
            must_notify=[settings.REMINDER_DATE_UPDATED],
            is_registered=False,
            should_send_reminders=True,
            video=video,
        )
        # unsubscribed
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="unsubscribed@test-fun-mooc.fr",
            must_notify=[settings.REMINDER_DATE_UPDATED],
            is_registered=True,
            should_send_reminders=False,
            video=video,
        )

        # video in the past
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="video_in_the_past@test-fun-mooc.fr",
            must_notify=[settings.REMINDER_DATE_UPDATED],
            is_registered=True,
            should_send_reminders=True,
            video=video_past,
        )
        # video live_state running
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            created_on=timezone.now() - timedelta(days=32),
            email="video_in_the_past@test-fun-mooc.fr",
            must_notify=[settings.REMINDER_DATE_UPDATED],
            is_registered=True,
            should_send_reminders=True,
            video=video_live_state,
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
            "Webinar has been updated.",
        )
        self.assertEqual(
            mail.outbox[1].subject,
            "Webinar has been updated.",
        )
        # check this kind of template is well formed
        self.assertNotIn("trans", mail.outbox[0].body)
        lti_key_access = lti_livesession.get_generate_salted_hmac()
        public_key_access = public_livesession.get_generate_salted_hmac()

        self.assertIn(
            f"Access the event [//example.com/videos/{lti_livesession.video.pk}?lrpk="
            f"{lti_livesession.pk}&amp;key={lti_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )
        self.assertIn(
            "Do not forward this email or share this link. "
            "It contains your personal code to access the event.",
            " ".join(mail.outbox[0].body.split()),
        )

        self.assertIn(
            f"unsubscribe [//example.com/reminders/cancel/{lti_livesession.pk}/"
            f"{lti_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )

        self.assertIn(
            f"unsubscribe [//example.com/reminders/cancel/{public_livesession.pk}/"
            f"{public_key_access}]",
            " ".join(mail.outbox[1].body.split()),
        )
        self.assertIn(
            f"Access the event [//example.com/videos/{public_livesession.video.pk}?lrpk="
            f"{public_livesession.pk}&amp;key={public_key_access}]",
            " ".join(mail.outbox[1].body.split()),
        )
        self.assertIn(
            "Do not forward this email or share this link. "
            "It contains your personal code to access the event.",
            " ".join(mail.outbox[1].body.split()),
        )

        self.assertIn(
            f"Sending email for livesession {public_livesession.id} for video "
            f"{public_livesession.video.id} step {settings.REMINDER_DATE_UPDATED}",
            out.getvalue(),
        )

        self.assertIn(
            f"Sending email for livesession {lti_livesession.id} for video "
            f"{lti_livesession.video.id} step {settings.REMINDER_DATE_UPDATED}",
            out.getvalue(),
        )
        public_livesession.refresh_from_db()
        lti_livesession.refresh_from_db()
        # key has been added
        key_updated = (
            f"{settings.REMINDER_DATE_UPDATED}_"
            f'{dateformat.format(timezone.now(), "Y-m-d H:i")}'
        )
        self.assertIn(key_updated, public_livesession.reminders)
        self.assertIn(key_updated, lti_livesession.reminders)
        # key has been deleted from must_notify field
        self.assertNotIn(settings.REMINDER_DATE_UPDATED, public_livesession.must_notify)
        self.assertNotIn(settings.REMINDER_DATE_UPDATED, lti_livesession.must_notify)

        out.close()

        # call the command a new time, no new email should be sent
        out = StringIO()
        call_command("send_reminders", stdout=out)
        # there is still two emails sent
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual("", out.getvalue())
        out.close()

    # pylint: disable=too-many-statements
    def test_scenario_video_date_has_changed(self):
        """
        Scenario of video updates used in combinaison of the commande send_reminders
        with livesession created after the update.
        """

        video = VideoFactory(
            title="my title", live_state=IDLE, live_type=JITSI, starting_at=None
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)
        self.assertFalse(video.is_scheduled)
        livesession = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah@test-fun-mooc.fr",
            is_registered=True,
            should_send_reminders=True,
            video=video,
        )

        # at this point nothing happens, video has just been created
        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertEqual("", out.getvalue())
        out.close()

        # a change of the title only won't update the must_notify
        response = self.client.put(
            f"/api/videos/{video.id}/",
            {
                "title": "new title",
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        self.assertEqual(livesession.video.title, "new title")
        self.assertEqual(livesession.must_notify, [])

        # Now we change the date
        starting_at = (timezone.now() + timedelta(days=1)).replace(microsecond=0)
        response = self.client.put(
            f"/api/videos/{video.id}/",
            {
                "title": "title",
                "starting_at": starting_at,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        livesession.refresh_from_db()
        self.assertEqual(livesession.video.title, "title")
        self.assertEqual(livesession.must_notify, [settings.REMINDER_DATE_UPDATED])
        # create another live_session after the video has been updated
        # this one shouldn't be notified as it has been created after the update
        livesession_2 = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            email="sarah2@test-fun-mooc.fr",
            is_registered=True,
            must_notify=["DATA"],
            reminders=["ONE"],
            should_send_reminders=True,
            video=video,
        )

        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(
            f"Sending email for livesession {livesession.id} for video "
            f"{livesession.video.id} step {settings.REMINDER_DATE_UPDATED}",
            out.getvalue(),
        )
        out.close()
        livesession.refresh_from_db()
        livesession_2.refresh_from_db()
        self.assertEqual(livesession.video.starting_at, starting_at)
        # key has been added
        key_updated = (
            f"{settings.REMINDER_DATE_UPDATED}_"
            f'{dateformat.format(timezone.now(), "Y-m-d H:i")}'
        )
        self.assertEqual(livesession.reminders, [key_updated])
        self.assertEqual(livesession_2.reminders, ["ONE"])
        self.assertEqual(livesession.must_notify, [])
        self.assertEqual(livesession_2.must_notify, ["DATA"])

        # we change sending the same date
        response = self.client.put(
            f"/api/videos/{video.id}/",
            {
                "title": "title",
                "starting_at": starting_at,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        livesession_2.refresh_from_db()
        # nothing is added
        self.assertEqual(livesession_2.must_notify, ["DATA"])
        self.assertEqual(livesession.must_notify, [])

        # if we replay the send_reminders command, nothing happens
        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertEqual("", out.getvalue())
        out.close()

        # we change sending a new date
        new_date = timezone.now() + timedelta(days=2)
        key_updated = (
            f"{settings.REMINDER_DATE_UPDATED}_"
            f'{dateformat.format(timezone.now(), "Y-m-d H:i")}'
        )
        response = self.client.put(
            f"/api/videos/{video.id}/",
            {
                "title": "title",
                "starting_at": new_date,
            },
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        livesession.refresh_from_db()
        livesession_2.refresh_from_db()
        # must_notify is updated for the two livesessions
        self.assertEqual(
            livesession_2.must_notify,
            ["DATA", settings.REMINDER_DATE_UPDATED],
        )
        self.assertEqual(livesession.must_notify, [settings.REMINDER_DATE_UPDATED])

        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertIn(
            f"Sending email for livesession {livesession.id} for video "
            f"{livesession.video.id} step {settings.REMINDER_DATE_UPDATED}",
            out.getvalue(),
        )
        self.assertIn(
            f"Sending email for livesession {livesession_2.id} for video "
            f"{livesession_2.video.id} step {settings.REMINDER_DATE_UPDATED}",
            out.getvalue(),
        )
        out.close()

        livesession.refresh_from_db()
        livesession_2.refresh_from_db()
        self.assertEqual(livesession.must_notify, [])
        self.assertEqual(livesession_2.must_notify, ["DATA"])
        self.assertEqual(livesession_2.reminders, ["ONE", key_updated])
        self.assertEqual(livesession.reminders, [key_updated, key_updated])

    def test_send_reminders_date_i18n(self):
        """Livesession's language is used to send email."""

        video = VideoFactory(
            live_state=IDLE,
            live_type=RAW,
            starting_at=timezone.now() + timedelta(days=200),
        )
        # LTI livesession
        lti_livesession = LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            created_on=timezone.now() - timedelta(days=32),
            email="chantal@test-fun-mooc.fr",
            is_registered=True,
            language="fr",
            lti_id="Maths",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            must_notify=[settings.REMINDER_DATE_UPDATED],
            should_send_reminders=True,
            video=video,
        )

        out = StringIO()
        call_command("send_reminders", stdout=out)
        self.assertIn(
            "Mail sent chantal@test-fun-mooc.fr Votre webinaire a été mis à jour.",
            out.getvalue(),
        )
        out.close()
        self.assertEqual(len(mail.outbox), 1)

        lti_key_access = lti_livesession.get_generate_salted_hmac()

        # check we send it to the the right mail.outbox[0].to[0]
        self.assertEqual("chantal@test-fun-mooc.fr", mail.outbox[0].to[0])
        # check it's the right content

        self.assertIn(
            f"Accéder au webinaire [//example.com/videos/{lti_livesession.video.pk}?lrpk="
            f"{lti_livesession.pk}&amp;key={lti_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )
        self.assertIn(
            f"se désabonner [//example.com/reminders/cancel/{lti_livesession.pk}/"
            f"{lti_key_access}]",
            " ".join(mail.outbox[0].body.split()),
        )
        self.assertEqual(
            mail.outbox[0].subject,
            "Votre webinaire a été mis à jour.",
        )
