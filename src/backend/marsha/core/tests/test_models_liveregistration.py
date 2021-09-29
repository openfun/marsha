"""Tests for the models in the ``core`` app of the Marsha project."""
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.utils import IntegrityError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import ConsumerSiteFactory, LiveRegistrationFactory, VideoFactory
from ..models import LiveRegistration


class LiveRegistrationModelsTestCase(TestCase):
    """Test liveregistration model."""

    def test_models_liveregistration_fields_email_required(self):
        """The `email` field is required on liveregistration."""
        with self.assertRaises(ValidationError) as context:
            LiveRegistrationFactory(email=None)
        self.assertEqual(context.exception.messages, ["This field cannot be null."])

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
