from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from transcode_api.factories import VideoFactory
from transcode_api.models import VideoResolution
from transcode_api.storage import video_storage
from transcode_api.utils.files import (
    build_new_file,
    generate_hls_master_playlist_filename,
    generate_hls_video_filename,
    generate_web_video_filename,
    get_hls_resolution_playlist_filename,
    get_lower_case_extension,
    get_video_directory,
)

uuid_regex = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"


class FilesTestCase(TestCase):
    """Test the files utils file."""

    def setUp(self):
        """Create a video a file."""
        self.video = VideoFactory(name="Test Video")
        self.simple_file = SimpleUploadedFile(
            "file.mp4", b"file_content", content_type="video/mp4"
        )

    def test_get_video_directory(self):
        """Should return a video directory."""
        directory = get_video_directory(self.video)
        self.assertEqual(directory, f"video-{self.video.uuid}/")

    def test_get_video_directory_with_suffix(self):
        """Should return a video directory with a suffix."""
        directory = get_video_directory(self.video, suffix="test")
        self.assertEqual(directory, f"video-{self.video.uuid}/test")

    def test_get_lower_case_extension(self):
        """Should return a lower case extension."""
        path = "test.mp4"
        extension = get_lower_case_extension(path)
        self.assertEqual(extension, ".mp4")

    def test_generate_web_video_filename(self):
        """Should generate a web video filename with an uuid in it."""
        filename = generate_web_video_filename(720, ".mp4")

        # example: 46ce5659-e9e2-466c-9f11-a9a1674962c9-720.mp4
        self.assertRegex(filename, rf"^{uuid_regex}-720\.mp4$")

    def test_generate_hls_video_filename(self):
        """Should generate a hls video filename with an fragmented and uuid in it."""
        filename = generate_hls_video_filename(720)

        # example: 46ce5659-e9e2-466c-9f11-a9a1674962c9-720-fragmented.mp4
        self.assertRegex(filename, rf"^{uuid_regex}-720-fragmented\.mp4$")

    def test_get_hls_resolution_playlist_filename(self):
        """Should generate a hls resolution playlist (m3u8) corresponding to a fragmented file."""
        video_filename = "test-720-fragmented.mp4"
        playlist_filename = get_hls_resolution_playlist_filename(video_filename)
        self.assertEqual(playlist_filename, "test-720.m3u8")

    def test_generate_hls_master_playlist_filename(self):
        """Should generate a hls master playlist (m3u8) with an uuid in it."""
        master_playlist_filename = generate_hls_master_playlist_filename()
        self.assertRegex(master_playlist_filename, rf"^{uuid_regex}-master\.m3u8$")

    def test_generate_hls_master_playlist_filename_with_live(self):
        """Should generate a hls master playlist (m3u8)."""
        master_playlist_filename = generate_hls_master_playlist_filename(is_live=True)
        self.assertEqual(master_playlist_filename, "master.m3u8")

    @mock.patch("transcode_api.utils.files.ffmpeg.probe")
    def test_build_new_file_with_video(self, mock_probe):
        """Should create a video file model related to a file  and a video."""
        filename = video_storage.save("audio_test.mp4", self.simple_file)

        mock_probe.return_value = {
            "streams": [
                {
                    "index": 0,
                    "codec_name": "h264",
                    "codec_type": "video",
                    "width": 1920,
                    "height": 1080,
                    "duration": "00:01:00.00",
                    "bit_rate": "5000",
                    "r_frame_rate": "30000/1001",
                    "avg_frame_rate": "30000/1001",
                    "tags": {"language": "eng"},
                },
                {
                    "index": 1,
                    "codec_name": "aac",
                    "codec_type": "audio",
                    "channels": 2,
                    "sample_rate": "48000 Hz",
                    "duration": "00:01:00.00",
                    "bit_rate": "128",
                    "tags": {"language": "eng"},
                },
            ],
            "format": {
                "filename": filename,
                "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
                "duration": "00:01:00.00",
                "bit_rate": "5128",
                "tags": {"title": "My Video", "artist": "Me", "album": "My Album"},
                "size": 4,
            },
        }

        video_file = build_new_file(self.video, filename)

        self.assertEqual(video_file.extname, ".mp4")
        self.assertEqual(video_file.size, 4)
        self.assertEqual(video_file.resolution, 1080)
        self.assertEqual(video_file.fps, 30)
        self.assertEqual(video_file.video, self.video)

    @mock.patch("transcode_api.utils.files.ffmpeg.probe")
    def test_build_new_file_with_audio(self, mock_probe):
        """Should create an audio video file model related to a file  and a video."""
        filename = video_storage.save("audio_test.mp3", self.simple_file)

        mock_probe.return_value = {
            "streams": [
                {
                    "index": 0,
                    "codec_name": "mp3",
                    "codec_type": "audio",
                    "channels": 2,
                    "sample_rate": "44100 Hz",
                    "duration": "00:01:00.00",
                    "bit_rate": "128 kb/s",
                    "tags": {"language": "eng"},
                }
            ],
            "format": {
                "filename": filename,
                "format_name": "mp3",
                "duration": "00:01:00.00",
                "bit_rate": "128 kb/s",
                "tags": {"title": "My Audio", "artist": "Me", "album": "My Album"},
                "size": 4,
            },
        }

        video_file = build_new_file(self.video, filename)

        self.assertEqual(video_file.extname, ".mp3")
        self.assertEqual(video_file.size, 4)
        self.assertEqual(video_file.resolution, VideoResolution.H_NOVIDEO)
        self.assertEqual(video_file.fps, -1)
        self.assertEqual(video_file.video, self.video)
