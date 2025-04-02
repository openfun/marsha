"""Tests for the VideoBaseSerializer serializer of the Marsha project."""

from datetime import datetime, timezone as baseTimezone
from unittest import mock

from django.test import TestCase, override_settings
from django.utils.module_loading import import_string

from marsha.core.defaults import AWS_PIPELINE, PEERTUBE_PIPELINE
from marsha.core.factories import VideoFactory
from marsha.core.serializers import VideoBaseSerializer
from marsha.core.storage import storage_class


class VideoBaseSerializerTest(TestCase):
    """Test the VideoBaseSerializer serializer."""

    def test_video_serializer_urls_with_aws_pipeline(self):
        """The VideoBaseSerializer should return the right URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=AWS_PIPELINE,
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

    @override_settings(
        MEDIA_URL="https://abc.svc.edge.scw.cloud/",
    )
    def test_video_serializer_urls_with_peertube_pipeline(self):
        """The VideoBaseSerializer should return the right URLs."""
        # Reload the storage class to have the right storage class
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=PEERTUBE_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )

        storage = import_string("marsha.core.storage.s3.S3FileStorage")()
        with mock.patch("marsha.core.serializers.video.file_storage", new=storage):
            serializer = VideoBaseSerializer(video)

            self.assertEqual(
                f"https://abc.svc.edge.scw.cloud/vod/{video.pk}/video/1640995200/thumbnail.jpg",
                serializer.data["urls"]["thumbnails"][1080],
            )
            self.assertEqual(
                f"https://abc.svc.edge.scw.cloud/vod/{video.pk}/video/1640995200/master.m3u8?"
                "v=25301066da0654a2967176ea47c26f6735b2cfcbd206f49fe1379f5103bb7b1f",
                serializer.data["urls"]["manifests"]["hls"],
            )
            self.assertEqual(
                f"https://abc.svc.edge.scw.cloud/vod/{video.pk}/video/1640995200/thumbnail.jpg",
                serializer.data["urls"]["previews"],
            )
            self.assertTrue(
                f"https://abc.svc.edge.scw.cloud/vod/{video.pk}/"
                "video/1640995200/1640995200-1080-fragmented.mp4"
                in serializer.data["urls"]["mp4"][1080]
            )

    def test_video_serializer_urls_with_no_pipeline(self):
        """The VideoBaseSerializer should default to AWS pipeline."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=None,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )

        with mock.patch(
            "marsha.core.serializers.video.capture_message"
        ) as sentry_capture_message:
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
            self.assertEqual(video.transcode_pipeline, AWS_PIPELINE)
            sentry_capture_message.assert_called_once_with(
                f"VOD {video.pk} had no transcode_pipeline and was recovered to AWS",
            )

    @override_settings(
        MEDIA_URL="https://abc.svc.edge.scw.cloud/",
    )
    def test_video_serializer_urls_with_no_pipeline_recovered_to_peertube(self):
        """The VideoBaseSerializer should return the right URLs with Peertube pipeline."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=None,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )

        with (
            mock.patch(
                "marsha.core.serializers.video.capture_message"
            ) as sentry_capture_message,
            mock.patch(
                "marsha.core.serializers.video.file_storage"
            ) as mock_file_storage,
        ):
            mock_file_storage.url = storage_class.file_storage.url
            mock_file_storage.exists.return_value = True

            serializer = VideoBaseSerializer(video)
            self.assertEqual(
                f"https://abc.svc.edge.scw.cloud/vod/{video.pk}/video/1640995200/thumbnail.jpg",
                serializer.data["urls"]["thumbnails"][1080],
            )
            self.assertEqual(
                f"https://abc.svc.edge.scw.cloud/vod/{video.pk}/video/1640995200/master.m3u8",
                serializer.data["urls"]["manifests"]["hls"],
            )
            self.assertEqual(
                f"https://abc.svc.edge.scw.cloud/vod/{video.pk}/video/1640995200/thumbnail.jpg",
                serializer.data["urls"]["previews"],
            )
            self.assertTrue(
                f"https://abc.svc.edge.scw.cloud/vod/{video.pk}/"
                "video/1640995200/1640995200-1080-fragmented.mp4"
                in serializer.data["urls"]["mp4"][1080]
            )
            self.assertEqual(video.transcode_pipeline, PEERTUBE_PIPELINE)
            sentry_capture_message.assert_called_once_with(
                f"VOD {video.pk} had no transcode_pipeline and was recovered to peertube",
            )
