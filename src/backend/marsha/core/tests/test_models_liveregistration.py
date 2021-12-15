"""Tests for the models in the ``core`` app of the Marsha project."""
from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import LiveRegistrationFactory, VideoFactory
from ..models import LiveRegistration


class LiveRegistrationModelsTestCase(TestCase):
    """Test liveregistration model."""

    def test_models_liveregistration_fields_id_unique_consumer_none(self):
        """Duo email/video is unique when consumer_site is None."""
        video = VideoFactory()
        video2 = VideoFactory()

        # sophie@test-fun-mooc.fr register to video
        liveregister = LiveRegistrationFactory(
            email="sophie@test-fun-mooc.fr", video=video
        )

        # sophie@test-fun-mooc.fr can register to video2
        LiveRegistrationFactory(email="sophie@test-fun-mooc.fr", video=video2)

        # Trying to create a video with the same duo email/video should raise a
        # database error
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                LiveRegistrationFactory(email="sophie@test-fun-mooc.fr", video=video)

        # Soft deleted videos should not count for unicity
        liveregister.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveRegistrationFactory(email="sophie@test-fun-mooc.fr", video=video)

    def test_models_liveregistration_fields_lti_id_unique(self):
        """Combinaison of lti_user_id/lti_id/consumer_site/video should be unique."""
        video = VideoFactory()
        video2 = VideoFactory()

        liveregister = LiveRegistrationFactory(
            email="registered@test-fun-mooc.fr",
            video=video,
            lti_id="Maths 01",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )

        # A registration with a different email for another video with the same lti info
        # is possible
        LiveRegistrationFactory(
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
                LiveRegistrationFactory(
                    email="sophie@test-fun-mooc.fr",
                    lti_user_id="56255f3807599c377bf0e5bf072359fd",
                    lti_id="Maths 01",
                    consumer_site=video.playlist.consumer_site,
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"liveregistration_unique_video_lti_idx"',
            context.exception.args[0],
        )

        # Soft deleted videos should not count for unicity
        liveregister.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            lti_id="Maths 01",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

    def test_models_liveregistration_fields_video_email_constraint_lti_user_id(self):
        """lti_user_id is mandatory when lti_id and consumer_site are defined"""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    email="registered@test-fun-mooc.fr",
                    consumer_site=video.playlist.consumer_site,
                    lti_id="Maths",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_fields_video_email_constraint_lti_id(self):
        """lti_id is mandatory when lti_user_id and consumer_site are defined"""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    email="registered@test-fun-mooc.fr",
                    consumer_site=video.playlist.consumer_site,
                    lti_user_id="5555",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_fields_video_email_constraint_consumer_site(self):
        """consumer_site is mandatory when lti_user_id and lti_id are defined"""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    email="registered@test-fun-mooc.fr",
                    lti_id="Maths",
                    lti_user_id="5555",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_fields_video_email_constraint_lti_user_id__1(self):
        """Defining only email/lti_id/video is not a possible record."""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    email="registered@test-fun-mooc.fr",
                    lti_id="Maths",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_fields_video_email_constraint_lti_user_id__3(self):
        """Defining only email/lti_user_id/video is not a possible record."""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    email="registered@test-fun-mooc.fr",
                    lti_user_id="555",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_fields_video_email_constraint_lti_user_id__4(self):
        """Defining only email/consumer_site/video defined is not a possible record."""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    email="registered@test-fun-mooc.fr",
                    consumer_site=video.playlist.consumer_site,
                    video=video,
                )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_fields_video_constraint_email_mandatory(self):
        """email is mandatory when consumer_site is not defined"""
        video = VideoFactory()

        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    email=None,
                    video=video,
                )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_field_email_can_be_empty_consumer_lti_user_id(
        self,
    ):
        """Field email can be empty with lti_id, lti_user_id and consumer_site set."""
        video = VideoFactory()
        LiveRegistrationFactory(
            email=None,
            consumer_site=video.playlist.consumer_site,
            is_registered=False,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="5555",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)

    def test_models_liveregistration_field_email_cant_be_empty_consumer_site(self):
        """Field email can't be empty with consumer_site not defined."""
        self.assertEqual(LiveRegistration.objects.count(), 0)
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            LiveRegistrationFactory(
                email=None,
                consumer_site=None,
                is_registered=False,
                lti_user_id="56255f3807599c377bf0e5bf072359fd",
                lti_id="55555",
                video=video,
            )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_field_email_cant_be_empty_lti_user_id(self):
        """Field email can't be empty with lti_user_id not defined."""
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            LiveRegistrationFactory(
                email=None,
                consumer_site=video.playlist.consumer_site,
                is_registered=False,
                lti_user_id=None,
                lti_id="5555",
                video=video,
            )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_field_email_cant_be_empty_lti_id(self):
        """Field email can't be empty with lti_id not defined."""
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            LiveRegistrationFactory(
                email=None,
                consumer_site=video.playlist.consumer_site,
                lti_user_id="56255f3807599c377bf0e5bf072359fd",
                lti_id=None,
                video=video,
            )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_public_field_email_cant_be_empty_isregistered_true(
        self,
    ):
        """Field email can't be empty with field is_registered to True"""
        with self.assertRaises(IntegrityError) as context:
            LiveRegistrationFactory(
                email=None,
                is_registered=True,
            )
        assert (
            'violates check constraint "liveregistration_email_is_registered"'
            in str(context.exception)
        )

    def test_models_liveregistration_public_field_email_cant_be_empty_isregistered_false(
        self,
    ):
        """Field email can't be empty with field is_registered to False"""
        with self.assertRaises(IntegrityError) as context:
            LiveRegistrationFactory(
                email=None,
                is_registered=False,
            )
        assert 'violates check constraint "liveregistration_lti_or_public"' in str(
            context.exception
        )

    def test_models_liveregistration_lti_field_email_cant_be_empty_isregistered_true(
        self,
    ):
        """Field email for LTI can't be empty with field is_registered to True"""
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            LiveRegistrationFactory(
                email=None,
                consumer_site=video.playlist.consumer_site,
                is_registered=True,
                lti_user_id="56255f3807599c377bf0e5bf072359fd",
                lti_id="Maths",
                video=video,
            )
        assert (
            'violates check constraint "liveregistration_email_is_registered"'
            in str(context.exception)
        )

    def test_models_liveregistration_lti_field_email_cant_be_empty_isregistered_false(
        self,
    ):
        """Field email for LTI can be empty with field is_registered to False"""
        video = VideoFactory()
        LiveRegistrationFactory(
            email=None,
            consumer_site=video.playlist.consumer_site,
            is_registered=False,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            lti_id="Maths",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
