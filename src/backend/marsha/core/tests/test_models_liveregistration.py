"""Tests for the models in the ``core`` app of the Marsha project."""
import uuid

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
            anonymous_id=uuid.uuid4(), email="sophie@test-fun-mooc.fr", video=video
        )

        # sophie@test-fun-mooc.fr can register to video2
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="sophie@test-fun-mooc.fr", video=video2
        )

        # Trying to create a video with the same duo email/video should raise a
        # database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    anonymous_id=uuid.uuid4(),
                    email="sophie@test-fun-mooc.fr",
                    video=video,
                )

        self.assertIn(
            "duplicate key value violates unique constraint "
            '"liveregistration_unique_email_video_with_consumer_site_none"',
            context.exception.args[0],
        )
        # Soft deleted videos should not count for unicity
        liveregister.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), email="sophie@test-fun-mooc.fr", video=video
        )

    def test_models_liveregistration_fields_display_username_unique(self):
        """Duo display_username/video must be unique."""
        video = VideoFactory()
        video2 = VideoFactory()

        liveregister = LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), display_username="sophie", video=video
        )

        # sophie can be used for video2
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), display_username="sophie", video=video2
        )

        # Trying to create a video with the same duo display_username/video for a public
        # connection should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    anonymous_id=uuid.uuid4(),
                    display_username="sophie",
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"liveregistration_unique_video_display_username"',
            context.exception.args[0],
        )
        # Trying to create a video with the same duo display_username/video for a LTI
        # connection should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    consumer_site=video.playlist.consumer_site,
                    display_username="sophie",
                    lti_id="Maths 01",
                    lti_user_id="56255f3807599c377bf0e5bf072359fd",
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"liveregistration_unique_video_display_username"',
            context.exception.args[0],
        )

        # sophie can be used for username
        LiveRegistrationFactory(
            lti_id="Maths 01",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
            username="sophie",
            video=video,
        )

        # Soft deleted videos should not count for unicity
        liveregister.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(), display_username="sophie", video=video
        )

    def test_models_liveregistration_fields_anonymous_id_unique(self):
        """Duo anonymous_id/video is unique."""
        video = VideoFactory()
        video2 = VideoFactory()
        identifier = uuid.uuid4()
        # uuid register to video
        liveregister = LiveRegistrationFactory(anonymous_id=identifier, video=video)

        # uuid can register to video2
        LiveRegistrationFactory(anonymous_id=identifier, video=video2)

        # Trying to create a video with the same duo display_username/video for a public
        # connection should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    anonymous_id=identifier,
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"liveregistration_unique_video_anonymous_id"',
            context.exception.args[0],
        )
        # Trying to create a video with the same duo display_username/video for a LTI
        # connection should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    anonymous_id=identifier,
                    consumer_site=video.playlist.consumer_site,
                    lti_id="Maths 01",
                    lti_user_id="56255f3807599c377bf0e5bf072359fd",
                    video=video,
                )
        self.assertIn(
            "duplicate key value violates unique constraint "
            '"liveregistration_unique_video_anonymous_id"',
            context.exception.args[0],
        )

        # Soft deleted videos should not count for unicity
        liveregister.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveRegistrationFactory(anonymous_id=identifier, video=video)

    def test_models_liveregistration_fields_username_not_set_public(self):
        """Field username can't be set when it's a public connection."""
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    anonymous_id=uuid.uuid4(),
                    username="sophie",
                    video=video,
                )
        self.assertIn(
            'violates check constraint "liveregistration_lti_or_public',
            context.exception.args[0],
        )

    def test_models_liveregistration_fields_lti_id_unique(self):
        """Combinaison of lti_user_id/lti_id/consumer_site/video should be unique."""
        video = VideoFactory()
        video2 = VideoFactory()

        liveregister = LiveRegistrationFactory(
            email="registered@test-fun-mooc.fr",
            lti_id="Maths 01",
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
            video=video,
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

    def test_models_liveregistration_field_anonymous_can_be_empty_consumer_lti_user_id(
        self,
    ):
        """Fields anonymous_id email can be empty with lti_id, lti_user_id, consumer_site set."""
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

    def test_models_liveregistration_field_anonymous_cant_be_empty_lti_user_id(self):
        """Field anonymous can't be empty for public connection."""
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            LiveRegistrationFactory(
                anonymous_id=None,
                email="mail@fun-test.fr",
                consumer_site=None,
                is_registered=False,
                lti_user_id=None,
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
                anonymous_id=None,
                email=None,
                is_registered=True,
            )
        self.assertIn(
            'violates check constraint "liveregistration_email_is_registered',
            context.exception.args[0],
        )

    def test_models_liveregistration_public_field_email_cant_be_empty_isregistered_false(
        self,
    ):
        """Field email can be empty with field is_registered to False"""
        LiveRegistrationFactory(
            anonymous_id=uuid.uuid4(),
            display_username=None,
            email=None,
            is_registered=False,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)

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
        self.assertIn(
            'violates check constraint "liveregistration_email_is_registered',
            context.exception.args[0],
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
