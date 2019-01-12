"""Tests for the models in the ``core`` app of the Marsha project."""
import random

from django.core.exceptions import ValidationError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import TimedTextTrackFactory, VideoFactory
from ..models import TimedTextTrack


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class TimedTextTrackModelsTestCase(TestCase):
    """Test our intentions about the timed text track model."""

    def test_models_timedtexttrack_fields_mode_required(self):
        """The `mode` field is required on timed text tracks."""
        with self.assertRaises(ValidationError) as context:
            TimedTextTrackFactory(mode=None)
        self.assertEqual(context.exception.messages, ["This field cannot be null."])

    def test_models_timedtexttrack_fields_mode_unique(self):
        """Timed text tracks should be unique for a given triplet: video/language/mode."""
        timed_text_track = TimedTextTrackFactory(language="fr")

        # A timed text track with a different mode can still be created
        remaining_modes = [
            m[0] for m in TimedTextTrack.MODE_CHOICES if m[0] != timed_text_track.mode
        ]
        TimedTextTrack.objects.create(
            video=timed_text_track.video,
            language="fr",
            mode=random.choice(remaining_modes),
        )

        # A timed text track for a different language can still be created
        TimedTextTrack.objects.create(
            video=timed_text_track.video, language="en", mode=timed_text_track.mode
        )

        # A timed text track for a different video can still be created
        TimedTextTrack.objects.create(
            video=VideoFactory(), language="fr", mode=timed_text_track.mode
        )

        # Trying to create a timed text track with all three fields identical should raise a
        # database error
        with self.assertRaises(ValidationError) as context:
            TimedTextTrack.objects.create(
                video=timed_text_track.video, language="fr", mode=timed_text_track.mode
            )
        self.assertEqual(
            context.exception.messages,
            ["Timed text track with this Video, Language and Mode already exists."],
        )

        # Soft deleted timed text tracks should not count for unicity
        timed_text_track.delete(force_policy=SOFT_DELETE_CASCADE)
        TimedTextTrackFactory(
            video=timed_text_track.video, language="fr", mode=timed_text_track.mode
        )
