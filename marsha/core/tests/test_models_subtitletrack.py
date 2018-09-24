"""Tests for the models in the ``core`` app of the Marsha project."""
from django.db import IntegrityError
from django.test import TestCase

from ..factories import SubtitleTrackFactory, VideoFactory
from ..models import SubtitleTrack


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class SubtitleTrackModelsTestCase(TestCase):
    """Test our intentions about the subtitle track model."""

    def test_models_subtitletrack_fields_unique(self):
        """Subtitle tracks should be unique for a given triplet: video/language/closed caption."""
        subtitle_track = SubtitleTrackFactory(language="fr")

        # A subtitle track with a different closed captioning flag can still be created
        SubtitleTrack.objects.create(
            video=subtitle_track.video,
            language="fr",
            has_closed_captioning=not subtitle_track.has_closed_captioning,
        )

        # A subtitle track for a different language can still be created
        SubtitleTrack.objects.create(
            video=subtitle_track.video,
            language="en",
            has_closed_captioning=subtitle_track.has_closed_captioning,
        )

        # A subtitle track for a different video can still be created
        SubtitleTrack.objects.create(
            video=VideoFactory(),
            language="fr",
            has_closed_captioning=subtitle_track.has_closed_captioning,
        )

        # Trying to create a subtitle track with all three fields identitcal should raise a
        # database error
        with self.assertRaises(IntegrityError):
            SubtitleTrack.objects.create(
                video=subtitle_track.video,
                language="fr",
                has_closed_captioning=subtitle_track.has_closed_captioning,
            )
