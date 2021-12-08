"""Tests for the models in the ``core`` app of the Marsha project."""
from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import ConsumerSiteFactory, LiveRegistrationFactory, VideoFactory
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
        """Combinaison of lti_user_id/consumer_site/video should be unique."""
        video = VideoFactory()
        video2 = VideoFactory()

        liveregister = LiveRegistrationFactory(
            email="registered@test-fun-mooc.fr",
            video=video,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            consumer_site=video.playlist.consumer_site,
        )

        # A registration with a different email for another video with the same lti info
        # is possible
        LiveRegistrationFactory(
            email="issaved@test-fun-mooc.fr",
            video=video2,
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
                    consumer_site=video.playlist.consumer_site,
                    video=video,
                )
                self.assertEqual(
                    context.exception.messages,
                    {"error": "IntegrityError"},
                )

        # Soft deleted videos should not count for unicity
        liveregister.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveRegistrationFactory(
            consumer_site=video.playlist.consumer_site,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )

    def test_models_liveregistration_fields_video_email_consumer_site_unique(self):
        """Combinaison of consumer_site/video/email should be unique."""
        other_consumer_site = ConsumerSiteFactory()
        video = VideoFactory()
        liveregister = LiveRegistrationFactory(
            email="registered@test-fun-mooc.fr",
            video=video,
            consumer_site=video.playlist.consumer_site,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)
        # A registration with a different email for the same video but in another lti_context_id
        # is possible
        LiveRegistrationFactory(
            email="registered@test-fun-mooc.fr",
            video=video,
            consumer_site=other_consumer_site,
        )
        self.assertEqual(LiveRegistration.objects.count(), 2)

        # Trying to create a registration for the same video and consumer site
        # should raise a database error
        with self.assertRaises(IntegrityError) as context:
            with transaction.atomic():
                LiveRegistrationFactory(
                    email="registered@test-fun-mooc.fr",
                    consumer_site=video.playlist.consumer_site,
                    video=video,
                )
                self.assertEqual(
                    context,
                    {"error": "IntegrityError"},
                )

        # Soft deleted videos should not count for unicity
        liveregister.delete(force_policy=SOFT_DELETE_CASCADE)
        LiveRegistrationFactory(
            email="registered@test-fun-mooc.fr",
            consumer_site=video.playlist.consumer_site,
            video=video,
        )

    def test_models_liveregistration_field_email_can_be_empty_isregistered_false(self):
        """Field email can be empty with field is_registered to False"""
        LiveRegistrationFactory(
            email="test@fun-mooc.fr",
            is_registered=False,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)

    def test_models_liveregistration_field_email_cant_be_empty_isregistered_true(self):
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

    def test_models_liveregistration_field_email_can_be_empty_consumer_lti_user_id(
        self,
    ):
        """Field email can be empty with lti_user_id and consumer_site set"""
        video = VideoFactory()
        LiveRegistrationFactory(
            email=None,
            consumer_site=video.playlist.consumer_site,
            is_registered=False,
            lti_user_id="56255f3807599c377bf0e5bf072359fd",
            video=video,
        )
        self.assertEqual(LiveRegistration.objects.count(), 1)

    def test_models_liveregistration_field_email_cant_be_empty_consumer_site(self):
        """Field email can't be empty with consumer_site null"""
        self.assertEqual(LiveRegistration.objects.count(), 0)
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            LiveRegistrationFactory(
                email=None,
                consumer_site=None,
                is_registered=False,
                lti_user_id="56255f3807599c377bf0e5bf072359fd",
                video=video,
            )
        assert (
            'violates check constraint "liveregistration_email_or_context_id_user_id"'
            in str(context.exception)
        )

    def test_models_liveregistration_field_email_cant_be_empty_lti_user_id(self):
        """Field email can't be empty with lti_user_id null"""
        video = VideoFactory()
        with self.assertRaises(IntegrityError) as context:
            LiveRegistrationFactory(
                email=None,
                consumer_site=video.playlist.consumer_site,
                lti_user_id=None,
                video=video,
            )
        assert (
            'violates check constraint "liveregistration_email_or_context_id_user_id"'
            in str(context.exception)
        )
