"""Tests for the SharedLiveMedia serializer of the Marsha project."""

from datetime import datetime, timezone as baseTimezone

from django.test import TestCase, override_settings

from marsha.core.defaults import AWS_PIPELINE, CELERY_PIPELINE, PEERTUBE_PIPELINE
from marsha.core.factories import SharedLiveMediaFactory, VideoFactory
from marsha.core.serializers import SharedLiveMediaSerializer


class SharedLiveMediaSerializerTest(TestCase):
    """Test the SharedLiveMedia serializer."""

    def test_shared_live_media_serializer_urls_with_aws_pipeline(self):
        """The SharedLiveMediaSerializer should return AWS URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=AWS_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )
        shared_live_media = SharedLiveMediaFactory(
            video=video,
            uploaded_on=date,
            process_pipeline=AWS_PIPELINE,
        )
        serializer = SharedLiveMediaSerializer(shared_live_media)
        for page in range(1, shared_live_media.nb_pages + 1):
            self.assertEqual(
                f"https://abc.cloudfront.net/{video.pk}/sharedlivemedia/"
                f"{shared_live_media.pk}/1640995200_{page}.svg",
                serializer.data["urls"]["pages"][page],
            )

    @override_settings(
        MEDIA_URL="https://abc.cloudfront.net/",
    )
    def test_shared_live_media_serializer_urls_with_celery_pipeline(self):
        """The SharedLiveMediaSerializer should return videos storage URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=PEERTUBE_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )
        shared_live_media = SharedLiveMediaFactory(
            video=video,
            uploaded_on=date,
            process_pipeline=CELERY_PIPELINE,
        )
        serializer = SharedLiveMediaSerializer(shared_live_media)

        for page in range(1, shared_live_media.nb_pages + 1):
            self.assertEqual(
                f"https://abc.cloudfront.net/vod/{video.pk}/sharedlivemedia/"
                f"{shared_live_media.pk}/1640995200/1640995200_{page}.svg",
                serializer.data["urls"]["pages"][page],
            )

    def test_shared_live_media_serializer_urls_no_uploaded_on(self):
        """The SharedLiveMediaSerializer should not return URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=PEERTUBE_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )
        shared_live_media = SharedLiveMediaFactory(
            video=video,
            uploaded_on=None,
        )
        serializer = SharedLiveMediaSerializer(shared_live_media)

        self.assertIsNone(serializer.data["urls"])
