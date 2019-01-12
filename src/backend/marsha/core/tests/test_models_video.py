"""Tests for the models in the ``core`` app of the Marsha project."""
import random

from django.core.exceptions import ValidationError
from django.test import TestCase

from safedelete.models import SOFT_DELETE_CASCADE

from ..factories import (
    AudioTrackFactory,
    PlaylistFactory,
    SignTrackFactory,
    TimedTextTrackFactory,
    VideoFactory,
)
from ..models import STATE_CHOICES, AudioTrack, SignTrack, TimedTextTrack
from ..utils.time_utils import to_datetime


# We don't enforce arguments documentation in tests
# pylint: disable=missing-param-doc,missing-type-doc,unused-argument


class VideoModelsTestCase(TestCase):
    """Test our intentions about the Video model."""

    def test_models_video_str(self):
        """The str method should display the title of the video and its eventual soft deletion."""
        video = VideoFactory(title="j'espère")
        self.assertEqual(str(video), "j'espère")

        video.delete()
        self.assertEqual(str(video), "j'espère [deleted]")

    def test_models_video_fields_lti_id_unique(self):
        """Videos should be unique for a given duo: lti_id/playlist."""
        video = VideoFactory()

        # A video with a different lti_id and the same playlist can still be created
        VideoFactory(playlist=video.playlist)

        # A video for a different playlist and the same lti_id can still be created
        VideoFactory(lti_id=video.lti_id)

        # Trying to create a video with the same duo lti_id/playlist should raise a
        # database error
        with self.assertRaises(ValidationError) as context:
            VideoFactory(lti_id=video.lti_id, playlist=video.playlist)
        self.assertEqual(
            context.exception.messages,
            ["Video with this Lti id and Playlist already exists."],
        )

        # Soft deleted videos should not count for unicity
        video.delete(force_policy=SOFT_DELETE_CASCADE)
        VideoFactory(lti_id=video.lti_id, playlist=video.playlist)

    def test_models_video_fields_resource_id_unique(self):
        """Videos should be unique for a given duo: resource_id/playlist."""
        video = VideoFactory()

        # A video with a different resource_id and the same playlist can still be created
        VideoFactory(playlist=video.playlist)

        # A video for a different playlist and the same resource_id can still be created
        VideoFactory(resource_id=video.resource_id)

        # Trying to create a video with the same duo resource_id/playlist should raise a
        # database error
        with self.assertRaises(ValidationError) as context:
            VideoFactory(resource_id=video.resource_id, playlist=video.playlist)
        self.assertEqual(
            context.exception.messages,
            ["Video with this Resource UUID and Playlist already exists."],
        )

        # Soft deleted videos should not count for unicity
        video.delete(force_policy=SOFT_DELETE_CASCADE)
        VideoFactory(resource_id=video.resource_id, playlist=video.playlist)

    def test_models_video_duplicate(self):
        """Duplicating a video should duplicate its related tracks as well."""
        video = VideoFactory()

        # Create all sorts of tracks for this video
        for track_factory in [
            AudioTrackFactory,
            SignTrackFactory,
            TimedTextTrackFactory,
        ]:
            # Create a track in ready state that should be duplicated
            track_factory(
                video=video,
                language="fr",
                uploaded_on=to_datetime(random.randint(0, 1533686400)),
                upload_state="ready",
            )
            # Create another track in another state to check that it is not duplicated
            # Make sure the language is different from the ready track already created
            # as there is a unicity constraint
            track_factory(
                video=video,
                language="en",
                upload_state=random.choice(
                    [s[0] for s in STATE_CHOICES if s[0] != "ready"]
                ),
            )

        track_models = [
            (AudioTrack, ["language", "uploaded_on"]),
            (SignTrack, ["language", "uploaded_on"]),
            (TimedTextTrack, ["language", "mode", "uploaded_on"]),
        ]
        original_tracks = [
            _class.objects.filter(video=video, upload_state="ready").values_list(
                *fields
            )
            for _class, fields in track_models
        ]

        # Now duplicate the video
        new_playlist = PlaylistFactory()
        new_video = video.duplicate(new_playlist)

        # Check that everything was duplicated as expected
        duplicated_tracks = [
            _class.objects.filter(video=new_video).values_list(*fields)
            for _class, fields in track_models
        ]
        for original, duplicated in zip(original_tracks, duplicated_tracks):
            self.assertEqual(list(original), list(duplicated))
