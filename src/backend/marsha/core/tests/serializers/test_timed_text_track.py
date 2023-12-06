"""Tests for the TimedTextTrack serializer of the Marsha project."""
from datetime import datetime, timezone as baseTimezone

from django.test import TestCase, override_settings

from marsha.core.defaults import AWS_PIPELINE, CELERY_PIPELINE, PEERTUBE_PIPELINE
from marsha.core.factories import TimedTextTrackFactory, VideoFactory
from marsha.core.serializers import TimedTextTrackSerializer


class TimedTextTrackSerializerTest(TestCase):
    """Test the TimedTextTrack serializer."""

    def test_timed_text_track_serializer_urls_with_aws_pipeline(self):
        """The TimedTextTrackSerializer should return AWS URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=AWS_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
            playlist__title="playlist-001",
        )
        timed_text_track = TimedTextTrackFactory(
            video=video,
            uploaded_on=date,
            process_pipeline=AWS_PIPELINE,
            language="fr",
            extension="srt",
            mode="ts",
        )
        serializer = TimedTextTrackSerializer(timed_text_track)
        self.assertEqual(
            f"https://abc.cloudfront.net/{video.pk}/timedtext/1640995200_fr_ts.vtt",
            serializer.data["url"],
        )
        self.assertEqual(
            f"https://abc.cloudfront.net/{video.pk}/timedtext/source/1640995200_fr_ts"
            "?response-content-disposition=attachment%3B+filename%3Dplaylist-001_1640995200.srt",
            serializer.data["source_url"],
        )

    @override_settings(
        MEDIA_URL="https://abc.cloudfront.net/",
    )
    def test_timed_text_track_serializer_urls_with_celery_pipeline(self):
        """The TimedTextTrackSerializer should return videos storage URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=PEERTUBE_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )
        timed_text_track = TimedTextTrackFactory(
            video=video,
            uploaded_on=date,
            process_pipeline=CELERY_PIPELINE,
            language="fr",
            extension="srt",
            mode="ts",
        )
        serializer = TimedTextTrackSerializer(timed_text_track)
        self.assertEqual(
            f"https://abc.cloudfront.net/vod/{video.pk}/timedtext/"
            f"{timed_text_track.pk}/1640995200/1640995200.vtt",
            serializer.data["url"],
        )
        self.assertEqual(
            f"https://abc.cloudfront.net/vod/{video.pk}/timedtext/"
            f"{timed_text_track.pk}/1640995200/source.srt",
            serializer.data["source_url"],
        )

    def test_timed_text_track_media_serializer_urls_no_uploaded_on(self):
        """The TimedTextTrackSerializer should not return URLs."""
        date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        video = VideoFactory(
            transcode_pipeline=PEERTUBE_PIPELINE,
            live_state=None,
            resolutions=[1080],
            uploaded_on=date,
        )
        timed_text_track = TimedTextTrackFactory(
            video=video,
            uploaded_on=None,
        )
        serializer = TimedTextTrackSerializer(timed_text_track)

        self.assertIsNone(serializer.data["url"])
