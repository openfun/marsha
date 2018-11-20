"""Tests for the models in the ``core`` app of the Marsha project."""
import random

from django.db import IntegrityError
from django.test import TestCase

from ..factories import SubtitleTrackFactory, VideoFactory
from ..models import SubtitleTrack


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class SubtitleTrackModelsTestCase(TestCase):
    """Test our intentions about the subtitle track model."""

    def test_models_subtitletrack_fields_unique(self):
        """Subtitle tracks should be unique for a given triplet: video/language/mode."""
        subtitle_track = SubtitleTrackFactory(language="fr")

        # A subtitle track with a different mode can still be created
        remaining_modes = [
            m[0] for m in SubtitleTrack.MODE_CHOICES if m[0] != subtitle_track.mode
        ]
        SubtitleTrack.objects.create(
            video=subtitle_track.video,
            language="fr",
            mode=random.choice(remaining_modes),
        )

        # A subtitle track for a different language can still be created
        SubtitleTrack.objects.create(
            video=subtitle_track.video, language="en", mode=subtitle_track.mode
        )

        # A subtitle track for a different video can still be created
        SubtitleTrack.objects.create(
            video=VideoFactory(), language="fr", mode=subtitle_track.mode
        )

        # Trying to create a subtitle track with all three fields identitcal should raise a
        # database error
        with self.assertRaises(IntegrityError):
            SubtitleTrack.objects.create(
                video=subtitle_track.video, language="fr", mode=subtitle_track.mode
            )
