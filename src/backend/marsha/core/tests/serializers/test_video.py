"""Tests for the VideoBaseSerializer serializer of the Marsha project."""
from datetime import datetime, timezone as baseTimezone

from django.test import TestCase

from marsha.core.factories import VideoFactory
from marsha.core.serializers import VideoBaseSerializer


class VideoBaseSerializerTest(TestCase):
    """Test the VideoBaseSerializer serializer."""

    def test_video_serializer_urls_with_aws_pipeline(self):
        """The VideoBaseSerializer should return the right URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline="AWS",
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )

        serializer = VideoBaseSerializer(video)

        self.assertTrue(
            f"https://abc.cloudfront.net/{video.pk}/mp4/1640995200_1080.mp4"
            in serializer.data["urls"]["mp4"][1080]
        )
        self.assertEqual(
            f"https://abc.cloudfront.net/{video.pk}/thumbnails/1640995200_1080.0000000.jpg",
            serializer.data["urls"]["thumbnails"][1080],
        )
        self.assertEqual(
            f"https://abc.cloudfront.net/{video.pk}/cmaf/1640995200.m3u8",
            serializer.data["urls"]["manifests"]["hls"],
        )
        self.assertEqual(
            f"https://abc.cloudfront.net/{video.pk}/previews/1640995200_100.jpg",
            serializer.data["urls"]["previews"],
        )

    def test_video_serializer_urls_with_not_aws_pipeline(self):
        """The VideoBaseSerializer should return the right URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=None,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )

        serializer = VideoBaseSerializer(video)

        self.assertTrue(
            f"https://abc.cloudfront.net/{video.pk}/1640995200/1640995200-1080-fragmented.mp4"
            in serializer.data["urls"]["mp4"][1080]
        )
        self.assertEqual(
            f"https://abc.cloudfront.net/{video.pk}/1640995200/thumbnail.jpg",
            serializer.data["urls"]["thumbnails"][1080],
        )
        self.assertEqual(
            f"https://abc.cloudfront.net/{video.pk}/1640995200/master.m3u8",
            serializer.data["urls"]["manifests"]["hls"],
        )
        self.assertEqual(
            f"https://abc.cloudfront.net/{video.pk}/1640995200/thumbnail.jpg",
            serializer.data["urls"]["previews"],
        )
