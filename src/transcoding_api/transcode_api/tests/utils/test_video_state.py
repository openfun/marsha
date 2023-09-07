from unittest.mock import Mock, patch

from django.test import TestCase, override_settings

from transcode_api.factories import VideoFactory
from transcode_api.models import VideoState
from transcode_api.utils.video_state import (
    build_next_video_state,
    move_to_failed_transcoding_state,
    move_to_published_state,
    video_is_published,
)

mock_callback_video_published = Mock()


class VideoStateTestCase(TestCase):
    """Test the video state utils file."""

    def setUp(self):
        """Create a video."""
        self.video = VideoFactory(name="Test Video")

    def test_build_next_video_state(self):
        """Should return the next video state depending on the current."""
        with self.assertRaises(ValueError):
            build_next_video_state(VideoState.PUBLISHED)

        self.assertEqual(
            build_next_video_state(VideoState.TO_TRANSCODE), VideoState.PUBLISHED
        )
        self.assertEqual(
            build_next_video_state(VideoState.TO_IMPORT), VideoState.TO_TRANSCODE
        )
        self.assertEqual(
            build_next_video_state(VideoState.WAITING_FOR_LIVE),
            VideoState.TO_TRANSCODE,
        )
        self.assertEqual(
            build_next_video_state(VideoState.LIVE_ENDED), VideoState.TO_TRANSCODE
        )

        self.assertEqual(
            build_next_video_state(VideoState.TO_MOVE_TO_EXTERNAL_STORAGE),
            VideoState.PUBLISHED,
        )

        self.assertEqual(
            build_next_video_state(VideoState.TRANSCODING_FAILED),
            VideoState.TO_TRANSCODE,
        )

        self.assertEqual(
            build_next_video_state(VideoState.TO_MOVE_TO_EXTERNAL_STORAGE_FAILED),
            VideoState.TO_TRANSCODE,
        )

        self.assertEqual(
            build_next_video_state(VideoState.TO_EDIT), VideoState.PUBLISHED
        )

    def test_move_to_failed_transcoding_state(self):
        """Should  move to a failed transcoding state."""
        self.video.state = VideoState.TO_TRANSCODE
        self.video.save()

        move_to_failed_transcoding_state(self.video)

        self.assertEqual(self.video.state, VideoState.TRANSCODING_FAILED)

    def test_move_to_failed_transcoding_state_already_failed(self):
        """If the video is already in a failed transcoding state, do nothing."""
        self.video.state = VideoState.TRANSCODING_FAILED
        self.video.save()

        move_to_failed_transcoding_state(self.video)

        self.assertEqual(self.video.state, VideoState.TRANSCODING_FAILED)

    @patch("transcode_api.utils.video_state.video_is_published")
    def test_move_to_published_state(self, mock_video_is_published):
        """Should move to a published state."""
        move_to_published_state(self.video)

        self.assertEqual(self.video.state, VideoState.PUBLISHED)
        mock_video_is_published.assert_called_once_with(self.video)

    @override_settings(
        TRANSCODING_VIDEO_IS_PUBLISHED_CALLBACK_PATH="transcode_api.tests.utils.test_video_state.mock_callback_video_published"
    )
    def test_video_is_published(self):
        """Should call the video callback defined in settings."""
        video_is_published(self.video)

        mock_callback_video_published.assert_called_once_with(self.video)
