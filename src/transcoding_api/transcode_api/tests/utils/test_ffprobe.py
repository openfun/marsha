from django.test import TestCase

from transcode_api.tests.probe_response import probe_response
from transcode_api.utils.ffprobe import (
    build_file_metadata,
    get_audio_stream,
    get_video_stream,
    get_video_stream_dimensions_info,
    get_video_stream_duration,
    get_video_stream_fps,
    has_audio_stream,
    is_audio_file,
)


class TestFFProbe(TestCase):
    def test_get_video_stream_duration(self):
        # Call the get_video_stream_duration function with the mock probe object
        duration = get_video_stream_duration(
            "/path/to/video.mp4", existing_probe=probe_response
        )

        # Assert that the duration is correct
        self.assertEqual(duration, 22)

    def test_get_video_stream(self):
        # Call the get_video_stream function with the mock probe object
        stream = get_video_stream("/path/to/video.mp4", existing_probe=probe_response)

        # Assert that the video stream is returned
        self.assertDictContainsSubset({"codec_type": "video"}, stream)

    def test_get_video_stream_dimensions_info(self):
        # Call the get_video_stream_dimensions_info function with the mock video stream object
        dimensions_info = get_video_stream_dimensions_info(
            "/path/to/video.mp4", existing_probe=probe_response
        )

        # Assert that the dimensions info is correct
        self.assertEqual(dimensions_info["width"], 960)
        self.assertEqual(dimensions_info["height"], 540)
        self.assertEqual(dimensions_info["ratio"], 1.7777777777777777)
        self.assertEqual(dimensions_info["resolution"], 540)
        self.assertFalse(dimensions_info["isPortraitMode"])

    def test_get_video_stream_fps(self):
        # Call the get_video_stream_fps function with the mock probe object
        fps = get_video_stream_fps(probe_response)

        # Assert that the fps is correct
        self.assertEqual(fps, 30)

    def test_is_audio_file(self):
        # Call the is_audio_file function with the mock probe object
        is_audio = is_audio_file(probe_response)

        # Assert that the file is an audio file
        self.assertFalse(is_audio)

    def test_has_audio_stream(self):
        # Call the has_audio_stream function with the mock probe object
        has_audio = has_audio_stream(probe_response)

        # Assert that the file has an audio stream
        self.assertTrue(has_audio)

    def test_get_audio_stream(self):
        # Call the get_audio_stream function with the mock probe object
        audio_stream = get_audio_stream(
            "/path/to/audio.mp3", existing_probe=probe_response
        )

        # Assert that the audio stream is correct
        self.assertEqual(
            audio_stream["absolute_path"],
            "/path/to/audio.mp3",
        )
        self.assertEqual(
            audio_stream["audio_stream"],
            {
                "bit_rate": "1066073",
                "channels": 2,
                "codec_name": "aac",
                "codec_type": "audio",
                "duration": "00:01:00.00",
                "index": 1,
                "sample_rate": "48000 Hz",
                "tags": {"language": "eng"},
            },
        )
        self.assertEqual(audio_stream["bitrate"], 1066073)

    def test_build_file_metadata(self):
        # Call the build_file_metadata function with the mock probe object
        metadata = build_file_metadata(probe_response)

        # Assert that the metadata is correct
        self.assertEqual(metadata["chapter"], "")
        self.assertEqual(metadata["format"], probe_response["format"])
        self.assertEqual(metadata["streams"], probe_response["streams"])
