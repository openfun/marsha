"""Tests for the ThumbnailSerializer serializer of the Marsha project."""
from datetime import datetime, timezone as baseTimezone

from django.test import TestCase, override_settings

from marsha.core.defaults import AWS_PIPELINE, CELERY_PIPELINE, PEERTUBE_PIPELINE
from marsha.core.factories import ThumbnailFactory, VideoFactory
from marsha.core.serializers import ThumbnailSerializer


class ThumbnailSerializerTest(TestCase):
    """Test the ThumbnailSerializer serializer."""

    def test_thumbnail_serializer_urls_with_aws_pipeline(self):
        """The ThumbnailSerializer should return the AWS URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=AWS_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )
        thumbnail = ThumbnailFactory(
            video=video,
            uploaded_on=date,
            process_pipeline=AWS_PIPELINE,
        )
        serializer = ThumbnailSerializer(thumbnail)
        sizes = [1080, 720, 480, 240, 144]
        for size in sizes:
            self.assertEqual(
                f"https://abc.cloudfront.net/{video.pk}/thumbnails/1640995200_{size}.jpg",
                serializer.data["urls"][size],
            )

    @override_settings(
        MEDIA_URL="https://abc.cloudfront.net/",
    )
    def test_thumbnail_serializer_urls_with_celery_pipeline(self):
        """The ThumbnailSerializer should return the videos storage URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=PEERTUBE_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )
        thumbnail = ThumbnailFactory(
            video=video,
            uploaded_on=date,
            process_pipeline=CELERY_PIPELINE,
        )
        serializer = ThumbnailSerializer(thumbnail)

        sizes = [1080, 720, 480, 240, 144]
        for size in sizes:
            self.assertEqual(
                f"https://abc.cloudfront.net/vod/{video.pk}/thumbnail/1640995200/{size}.jpg",
                serializer.data["urls"][size],
            )

    def test_thumbnail_serializer_urls_no_uploaded_on(self):
        """The ThumbnailSerializer should return None if no uploaded_on."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=PEERTUBE_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )
        thumbnail = ThumbnailFactory(
            video=video,
            uploaded_on=None,
        )
        serializer = ThumbnailSerializer(thumbnail)

        self.assertIsNone(serializer.data["urls"])
