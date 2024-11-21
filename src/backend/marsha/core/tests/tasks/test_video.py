"""Test for video celery tasks"""

# pylint: disable=protected-access
from unittest import mock

from django.test import TestCase

from marsha.core.defaults import ERROR, MAX_RESOLUTION_EXCEDEED
from marsha.core.factories import VideoFactory
from marsha.core.tasks.video import (
    ffmpeg,
    launch_video_transcoding,
    launch_video_transcript,
)


FFMPEG_PROBE_VALID = {
    "streams": [
        {
            "index": 0,
            "codec_name": "h264",
            "codec_long_name": "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10",
            "profile": "Constrained Baseline",
            "codec_type": "video",
            "codec_tag_string": "avc1",
            "codec_tag": "0x31637661",
            "width": 960,
            "height": 540,
            "coded_width": 960,
            "coded_height": 540,
            "closed_captions": 0,
            "has_b_frames": 0,
            "sample_aspect_ratio": "1:1",
            "display_aspect_ratio": "16:9",
            "pix_fmt": "yuv420p",
            "level": 31,
            "color_range": "tv",
            "color_space": "bt709",
            "color_transfer": "bt709",
            "color_primaries": "bt709",
            "chroma_location": "left",
            "refs": 1,
            "is_avc": "true",
            "nal_length_size": "4",
            "r_frame_rate": "30000/1001",
            "avg_frame_rate": "30000/1001",
            "time_base": "1/30000",
            "start_pts": 0,
            "start_time": "0.000000",
            "duration_ts": 666666,
            "duration": "22.222200",
            "bit_rate": "1066073",
            "bits_per_raw_sample": "8",
            "nb_frames": "666",
            "disposition": {
                "default": 1,
                "dub": 0,
                "original": 0,
                "comment": 0,
                "lyrics": 0,
                "karaoke": 0,
                "forced": 0,
                "hearing_impaired": 0,
                "visual_impaired": 0,
                "clean_effects": 0,
                "attached_pic": 0,
                "timed_thumbnails": 0,
            },
            "tags": {
                "creation_time": "2020-07-22T10:18:45.000000Z",
                "language": "und",
                "vendor_id": "[0][0][0][0]",
            },
        },
        {
            "index": 1,
            "codec_name": "aac",
            "codec_type": "audio",
            "channels": 2,
            "sample_rate": "48000 Hz",
            "duration": "00:01:00.00",
            "bit_rate": "1066073",
            "tags": {"language": "eng"},
        },
    ],
    "format": {
        "filename": "/path/to/video.mp4",
        "nb_streams": 1,
        "nb_programs": 0,
        "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
        "format_long_name": "QuickTime / MOV",
        "start_time": "0.000000",
        "duration": "22.222200",
        "size": "2964950",
        "bit_rate": "1067383",
        "probe_score": 100,
        "tags": {
            "major_brand": "isom",
            "minor_version": "1",
            "compatible_brands": "isomavc1mp42",
            "creation_time": "2020-07-22T10:18:53.000000Z",
        },
    },
}

FFMPEG_PROBE_TOO_HIGH_RESOLUTION = {
    "streams": [
        {
            "index": 0,
            "codec_name": "h264",
            "codec_long_name": "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10",
            "profile": "Constrained Baseline",
            "codec_type": "video",
            "codec_tag_string": "avc1",
            "codec_tag": "0x31637661",
            "width": 3840,
            "height": 2160,
            "coded_width": 3840,
            "coded_height": 2160,
            "closed_captions": 0,
            "has_b_frames": 0,
            "sample_aspect_ratio": "1:1",
            "display_aspect_ratio": "16:9",
            "pix_fmt": "yuv420p",
            "level": 31,
            "color_range": "tv",
            "color_space": "bt709",
            "color_transfer": "bt709",
            "color_primaries": "bt709",
            "chroma_location": "left",
            "refs": 1,
            "is_avc": "true",
            "nal_length_size": "4",
            "r_frame_rate": "30000/1001",
            "avg_frame_rate": "30000/1001",
            "time_base": "1/30000",
            "start_pts": 0,
            "start_time": "0.000000",
            "duration_ts": 666666,
            "duration": "22.222200",
            "bit_rate": "1066073",
            "bits_per_raw_sample": "8",
            "nb_frames": "666",
            "disposition": {
                "default": 1,
                "dub": 0,
                "original": 0,
                "comment": 0,
                "lyrics": 0,
                "karaoke": 0,
                "forced": 0,
                "hearing_impaired": 0,
                "visual_impaired": 0,
                "clean_effects": 0,
                "attached_pic": 0,
                "timed_thumbnails": 0,
            },
            "tags": {
                "creation_time": "2020-07-22T10:18:45.000000Z",
                "language": "und",
                "vendor_id": "[0][0][0][0]",
            },
        },
        {
            "index": 1,
            "codec_name": "aac",
            "codec_type": "audio",
            "channels": 2,
            "sample_rate": "48000 Hz",
            "duration": "00:01:00.00",
            "bit_rate": "1066073",
            "tags": {"language": "eng"},
        },
    ],
    "format": {
        "filename": "/path/to/video.mp4",
        "nb_streams": 1,
        "nb_programs": 0,
        "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
        "format_long_name": "QuickTime / MOV",
        "start_time": "0.000000",
        "duration": "22.222200",
        "size": "2964950",
        "bit_rate": "1067383",
        "probe_score": 100,
        "tags": {
            "major_brand": "isom",
            "minor_version": "1",
            "compatible_brands": "isomavc1mp42",
            "creation_time": "2020-07-22T10:18:53.000000Z",
        },
    },
}

FFMPEG_PROBE_WITHOUT_VIDEO_STREAM = {
    "streams": [
        {
            "index": 0,
            "codec_name": "aac",
            "codec_type": "audio",
            "channels": 2,
            "sample_rate": "48000 Hz",
            "duration": "00:01:00.00",
            "bit_rate": "1066073",
            "tags": {"language": "eng"},
        },
    ],
    "format": {
        "filename": "/path/to/audio.mp4",
        "nb_streams": 1,
        "nb_programs": 0,
        "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
        "format_long_name": "QuickTime / MOV",
        "start_time": "0.000000",
        "duration": "22.222200",
        "size": "2964950",
        "bit_rate": "1067383",
        "probe_score": 100,
        "tags": {
            "major_brand": "isom",
            "minor_version": "1",
            "compatible_brands": "isomavc1mp42",
            "creation_time": "2020-07-22T10:18:53.000000Z",
        },
    },
}


class TestVideoTask(TestCase):
    """
    Test for video celery tasks
    """

    def test_launch_video_transcode(self):
        """
        Test the the launch_video_transcoding task. It should simply call
        the launch_video_transcoding function.
        """
        video = VideoFactory()
        stamp = "1640995200"
        with mock.patch(
            "marsha.core.tasks.video.transcode_video"
        ) as mock_transcode_video, mock.patch.object(
            ffmpeg, "probe"
        ) as mock_ffmpeg_probe:

            mock_ffmpeg_probe.return_value = FFMPEG_PROBE_VALID
            launch_video_transcoding(str(video.pk), stamp, "http://127.0.0.1:8000")
            mock_transcode_video.assert_called_once_with(
                file_path=f"tmp/{video.pk}/video/{stamp}",
                destination=f"vod/{video.pk}/video/{stamp}",
                base_name=stamp,
                domain="http://127.0.0.1:8000",
            )

        video.refresh_from_db()
        self.assertEqual(video.duration, 22.2222)
        self.assertEqual(video.size, 2964950)

    def test_launch_video_transcode_without_video_streams(self):
        """
        Test the the launch_video_transcoding task. It should simply call
        the launch_video_transcoding function. The video probe has no video stream.
        """
        video = VideoFactory()
        stamp = "1640995200"
        with mock.patch(
            "marsha.core.tasks.video.transcode_video"
        ) as mock_transcode_video, mock.patch.object(
            ffmpeg, "probe"
        ) as mock_ffmpeg_probe:

            mock_ffmpeg_probe.return_value = FFMPEG_PROBE_WITHOUT_VIDEO_STREAM
            launch_video_transcoding(str(video.pk), stamp, "http://127.0.0.1:8000")
            mock_transcode_video.assert_called_once_with(
                file_path=f"tmp/{video.pk}/video/{stamp}",
                destination=f"vod/{video.pk}/video/{stamp}",
                base_name=stamp,
                domain="http://127.0.0.1:8000",
            )

        video.refresh_from_db()
        self.assertEqual(video.duration, 22.2222)
        self.assertEqual(video.size, 2964950)

    def test_launch_video_transcode_fail(self):
        """
        Test the the launch_video_transcoding task. The transcode_video
        function should raise an exception and video state should be ERROR.
        """
        video = VideoFactory()
        stamp = "1640995200"
        with mock.patch(
            "marsha.core.tasks.video.transcode_video"
        ) as mock_transcode_video, mock.patch.object(
            ffmpeg, "probe"
        ) as mock_ffmpeg_probe:

            mock_ffmpeg_probe.return_value = FFMPEG_PROBE_VALID

            mock_transcode_video.side_effect = Exception("Test exception")
            launch_video_transcoding(str(video.pk), stamp, "http://127.0.0.1:8000")
            mock_transcode_video.assert_called_once_with(
                file_path=f"tmp/{video.pk}/video/{stamp}",
                destination=f"vod/{video.pk}/video/{stamp}",
                base_name=stamp,
                domain="http://127.0.0.1:8000",
            )
            video.refresh_from_db()
            self.assertEqual(video.upload_state, ERROR)

    def test_launch_video_transcode_fail_resolution_too_hight(self):
        """
        Test the the launch_video_transcoding task. The transcode_video
        function should raise an exception and video state should be ERROR
        because the video resolution is too high.
        """
        video = VideoFactory()
        stamp = "1640995200"
        with mock.patch(
            "marsha.core.tasks.video.transcode_video"
        ) as mock_transcode_video, mock.patch.object(
            ffmpeg, "probe"
        ) as mock_ffmpeg_probe:

            mock_ffmpeg_probe.return_value = FFMPEG_PROBE_TOO_HIGH_RESOLUTION

            mock_transcode_video.side_effect = Exception("Test exception")
            launch_video_transcoding(str(video.pk), stamp, "http://127.0.0.1:8000")
            mock_transcode_video.assert_not_called()
            video.refresh_from_db()
            self.assertEqual(video.upload_state, ERROR)
            self.assertEqual(video.upload_error_reason, MAX_RESOLUTION_EXCEDEED)

    def test_launch_video_transcript(self):
        """
        Test the launch_video_transcoding task. It should simply call
        the launch_video_transcoding function.
        """
        video = VideoFactory()
        stamp = "1640995200"
        with mock.patch(
            "marsha.core.tasks.video.transcript_video"
        ) as mock_transcript_video:
            launch_video_transcript(str(video.pk), stamp, "http://127.0.0.1:8000")
            mock_transcript_video.assert_called_once_with(
                destination=f"vod/{video.pk}/video/{stamp}",
                domain="http://127.0.0.1:8000",
            )

    def test_launch_video_transcript_video_url(self):
        """
        Test the launch_video_transcoding task.
        If a video_url is provided, it should be passed to the transcript_video function.
        """
        video = VideoFactory()
        stamp = "1640995200"
        with mock.patch(
            "marsha.core.tasks.video.transcript_video"
        ) as mock_transcript_video:
            launch_video_transcript(
                str(video.pk), stamp, "http://127.0.0.1:8000", "video_url"
            )
            mock_transcript_video.assert_called_once_with(
                destination=f"vod/{video.pk}/video/{stamp}",
                domain="http://127.0.0.1:8000",
                video_url="video_url",
            )
