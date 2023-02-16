"""Tests for the models in the ``core`` app of the Marsha project."""
import uuid

from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from marsha.core.factories import LiveSessionFactory, VideoFactory
from marsha.core.models import LiveSession


class LiveSessionModelsTestCase(TestCase):
    """Test livesession model."""

    def test_models_livesession_fields_id_unique_consumer_none(self):
        """Duo email/video is unique when consumer_site is None."""
        video = VideoFactory()
        video2 = VideoFactory()

        # sophie@test-fun-mooc.fr register to video
        livesession = LiveSessionFactory(
            anonymous_id=uuid.uuid4(), email="sophie@test-fun-mooc.fr", video=video
        )

        # sophie@test-fun-mooc.fr can register to video2
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(), email="sophie@test-fun-mooc.fr", video=video2
        )

        # Trying to create a video with the same duo email/video should raise a
        # database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    anonymous_id=uuid.uuid4(),
                    email="sophie@test-fun-mooc.fr",
                    video=video,
                )

        self.assertIn(
            "duplicate key value violates unique constraint "
            '"livesession_unique_email_video_with_consumer_site_none"',
            context.exception.args[0],
        )
        # Soft deleted videos should not count for unicity
        livesession.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(), email="sophie@test-fun-mooc.fr", video=video
        )

    def test_models_livesession_fields_display_name_unique(self):
        """Duo display_name/video must be unique."""
        video = VideoFactory()
        video2 = VideoFactory()

        livesession = LiveSessionFactory(
            anonymous_id=uuid.uuid4(), display_name="sophie", video=video
        )

        # sophie can be used for video2
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(), display_name="sophie", video=video2
        )

        # Trying to create a video with the same duo display_name/video for a public
        # connection should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    anonymous_id=uuid.uuid4(),
                    display_name="sophie",
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"livesession_unique_video_display_name"',
            context.exception.args[0],
        )
        # Trying to create a video with the same duo display_name/video for a LTI
        # connection should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    consumer_site=video.playlist.consumer_site,
                    display_name="sophie",
                    lti_id="Maths 01",
                    lti_user_id="56255f3807599c377bf0e5bf072359fd",
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"livesession_unique_video_display_name"',
            context.exception.args[0],
        )

        # sophie can be used for username
        LiveSessionFactory(
            lti_id="Maths 01",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
            username="sophie",
            video=video,
        )

        # Soft deleted videos should not count for unicity
        livesession.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(), display_name="sophie", video=video
        )

    def test_models_livesession_fields_anonymous_id_unique(self):
        """Duo anonymous_id/video is unique."""
        video = VideoFactory()
        video2 = VideoFactory()
        identifier = uuid.uuid4()
        # uuid register to video
        livesession = LiveSessionFactory(anonymous_id=identifier, video=video)

        # uuid can register to video2
        LiveSessionFactory(anonymous_id=identifier, video=video2)

        # Trying to create a video with the same duo display_name/video for a public
        # connection should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    anonymous_id=identifier,
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"livesession_unique_video_anonymous_id"',
            context.exception.args[0],
        )
        # Trying to create a video with the same duo display_name/video for a LTI
        # connection should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    anonymous_id=identifier,
                    consumer_site=video.playlist.consumer_site,
                    lti_id="Maths 01",
                    lti_user_id="56255f3807599c377bf0e5bf072359fd",
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"livesession_unique_video_anonymous_id"',
            context.exception.args[0],
        )

        # Soft deleted videos should not count for unicity
        livesession.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveSessionFactory(anonymous_id=identifier, video=video)

    def test_models_livesession_fields_username_not_set_public(self):
        """Field username can't be set when it's a public connection."""
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    anonymous_id=uuid.uuid4(),
                    username="sophie",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "livesession_lti_or_public',
            context.exception.args[0],
        )

    def test_models_livesession_fields_lti_id_unique(self):
        """Combinaison of lti_user_id/lti_id/consumer_site/video should be unique."""
        video = VideoFactory()
        video2 = VideoFactory()

        livesession = LiveSessionFactory(
            email="registered@test-fun-mooc.fr",
            lti_id="Maths 01",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )

        # A registration with a different email for another video with the same lti info
        # is possible
        LiveSessionFactory(
            email="issaved@test-fun-mooc.fr",
            video=video2,
            lti_id="Maths 01",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )

        # Trying to create a video with the same trio lti_user_id/consumer_site/video
        # should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    email="sophie@test-fun-mooc.fr",
                    lti_user_id="56255f3807599c377bf0e5bf072359fd",
                    lti_id="Maths 01",
                    consumer_site=video.playlist.consumer_site,
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"livesession_unique_video_lti_idx"',
            context.exception.args[0],
        )

        # Soft deleted videos should not count for unicity
        livesession.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveSessionFactory(
            consumer_site=video.playlist.consumer_site,
            lti_id="Maths 01",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

    def test_models_livesession_fields_video_email_constraint_lti_user_id(self):
        """lti_user_id is mandatory when lti_id and consumer_site are defined"""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    email="registered@test-fun-mooc.fr",
                    consumer_site=video.playlist.consumer_site,
                    lti_id="Maths",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "livesession_lti_or_public',
            context.exception.args[0],
        )

    def test_models_livesession_fields_video_email_constraint_lti_id(self):
        """lti_id is mandatory when lti_user_id and consumer_site are defined"""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    email="registered@test-fun-mooc.fr",
                    consumer_site=video.playlist.consumer_site,
                    lti_user_id="5555",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "livesession_lti_or_public',
            context.exception.args[0],
        )

    def test_models_livesession_fields_video_email_constraint_consumer_site(self):
        """consumer_site is mandatory when lti_user_id and lti_id are defined"""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    email="registered@test-fun-mooc.fr",
                    lti_id="Maths",
                    lti_user_id="5555",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "livesession_lti_or_public',
            context.exception.args[0],
        )

    def test_models_livesession_fields_video_email_constraint_lti_user_id__1(self):
        """Defining only email/lti_id/video is not a possible record."""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    email="registered@test-fun-mooc.fr",
                    lti_id="Maths",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "livesession_lti_or_public',
            context.exception.args[0],
        )

    def test_models_livesession_fields_video_email_constraint_lti_user_id__3(self):
        """Defining only email/lti_user_id/video is not a possible record."""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    email="registered@test-fun-mooc.fr",
                    lti_user_id="555",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "livesession_lti_or_public',
            context.exception.args[0],
        )

    def test_models_livesession_fields_video_email_constraint_lti_user_id__4(self):
        """Defining only email/consumer_site/video defined is not a possible record."""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveSessionFactory(
                    email="registered@test-fun-mooc.fr",
                    consumer_site=video.playlist.consumer_site,
                    video=video,
                )
        self.assertIn(
            'violates check constraint "livesession_lti_or_public',
            context.exception.args[0],
        )

    def test_models_livesession_field_anonymous_can_be_empty_consumer_lti_user_id(
        self,
    ):
        """Fields anonymous_id email can be empty with lti_id, lti_user_id, consumer_site set."""
        video = VideoFactory()
        LiveSessionFactory(
            email=None,
            consumer_site=video.playlist.consumer_site,
            is_registered=False,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="5555",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)

    def test_models_livesession_field_anonymous_cant_be_empty_lti_user_id(self):
        """Field anonymous can't be empty for public connection."""
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            LiveSessionFactory(
                anonymous_id=None,
                email="mail@fun-test.fr",
                consumer_site=None,
                is_registered=False,
                lti_user_id=None,
                lti_id=None,
                video=video,
            )
        self.assertIn(
            'violates check constraint "livesession_lti_or_public',
            context.exception.args[0],
        )

    def test_models_livesession_public_field_email_cant_be_empty_isregistered_true(
        self,
    ):
        """Field email can't be empty with field is_registered to True"""
        with self.assertRaises(IntegrityError) as context:
            LiveSessionFactory(
                anonymous_id=None,
                email=None,
                is_registered=True,
            )
        self.assertIn(
            'violates check constraint "livesession_email_is_registered',
            context.exception.args[0],
        )

    def test_models_livesession_public_field_email_cant_be_empty_isregistered_false(
        self,
    ):
        """Field email can be empty with field is_registered to False"""
        LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            display_name=None,
            email=None,
            is_registered=False,
        )
        self.assertEqual(LiveSession.objects.count(), 1)

    def test_models_livesession_lti_field_email_cant_be_empty_isregistered_true(
        self,
    ):
        """Field email for LTI can't be empty with field is_registered to True"""
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            LiveSessionFactory(
                email=None,
                consumer_site=video.playlist.consumer_site,
                is_registered=True,
                lti_user_id="56255f3807599c377bf0e5bf072359fd",
                lti_id="Maths",
                video=video,
            )
        self.assertIn(
            'violates check constraint "livesession_email_is_registered',
            context.exception.args[0],
        )

    def test_models_livesession_lti_field_email_cant_be_empty_isregistered_false(
        self,
    ):
        """Field email for LTI can be empty with field is_registered to False"""
        video = VideoFactory()
        LiveSessionFactory(
            email=None,
            consumer_site=video.playlist.consumer_site,
            is_registered=False,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        self.assertEqual(LiveSession.objects.count(), 1)

    def test_models_livesession_key_access(
        self,
    ):
        """Field key_access has a value added on save that doesn't change on update"""
        live_session = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            video=VideoFactory(),
        )
        key_access = live_session.key_access
        # random string has 50 chars
        self.assertEqual(len(live_session.key_access), 50)
        # change value of a field and save
        live_session.should_send_reminders = False
        live_session.save()
        live_session.refresh_from_db()
        # key_access hasn't change
        self.assertEqual(key_access, live_session.key_access)

    def test_models_livesession_two_key_access(
        self,
    ):
        """Field key_access is not always the same default string."""
        live_session = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            video=VideoFactory(),
        )
        live_session2 = LiveSessionFactory(
            anonymous_id=uuid.uuid4(),
            video=VideoFactory(),
        )
        self.assertNotEqual(live_session.key_access, live_session2.key_access)
