from unittest import mock
from unittest.mock import patch

import ffmpeg
from django.core.files.base import ContentFile
from django.test import TestCase

from transcode_api.factories import (
    VideoFactory,
    VideoFileFactory,
    VideoStreamingPlaylistFactory,
)
from transcode_api.storage import video_storage
from transcode_api.utils.transcoding.hls_playlist import (
    on_hls_video_file_transcoding,
    rename_video_file_in_playlist,
    update_master_hls_playlist,
)

from ...probe_response import probe_response


class HlsPlaylistTestCase(TestCase):
    maxDiff = None

    @patch.object(ffmpeg, "probe")
    def test_update_master_hls_playlist_with_one_file(
        self,
        mock_run,
    ):
        video = VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440001", duration=10)
        playlist = VideoStreamingPlaylistFactory(video=video)
        VideoFileFactory(
            video=video,
            filename="test.mp4",
            fps=30,
            streamingPlaylist=playlist,
            size=1000,
        )
        update_master_hls_playlist(video, playlist)
        playlist.refresh_from_db()
        self.assertTrue(video_storage.exists(playlist.playlistFilename))
        content = video_storage.open(playlist.playlistFilename, "r").read()
        self.assertEqual(
            content,
            """#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800,RESOLUTION=0x0,FRAME-RATE=30,CODECS=""
test.mp4.m3u8
""",
        )

    @patch.object(ffmpeg, "probe")
    def test_update_master_hls_playlist_with_two_files(
        self,
        mock_run,
    ):
        video = VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440002", duration=10)
        playlist = VideoStreamingPlaylistFactory(video=video)
        VideoFileFactory(
            video=video,
            filename="test",
            fps=30,
            streamingPlaylist=playlist,
            size=1000,
        )
        VideoFileFactory(
            video=video,
            filename="test2",
            fps=30,
            streamingPlaylist=playlist,
            size=1000,
        )
        update_master_hls_playlist(video, playlist)
        playlist.refresh_from_db()
        self.assertTrue(video_storage.exists(playlist.playlistFilename))
        content = video_storage.open(playlist.playlistFilename, "r").read()
        self.assertEqual(
            content,
            """#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800,RESOLUTION=0x0,FRAME-RATE=30,CODECS=""
test.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800,RESOLUTION=0x0,FRAME-RATE=30,CODECS=""
test2.m3u8
""",
        )

    @patch.object(ffmpeg, "probe")
    def test_update_master_hls_playlist_with_no_files(
        self,
        mock_run,
    ):
        video = VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440001", duration=10)
        playlist = VideoStreamingPlaylistFactory(video=video)
        update_master_hls_playlist(video, playlist)
        playlist.refresh_from_db()
        self.assertFalse(video_storage.exists(playlist.playlistFilename))

    @patch("transcode_api.utils.transcoding.hls_playlist.update_master_hls_playlist")
    @patch.object(ffmpeg, "probe", return_value=probe_response)
    def test_on_hls_video_file_transcoding_on_existing_playlist(
        self, mock_probe, mock_update_master_hls_playlist
    ):
        # Set up mock objects
        video = VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440002", duration=10)
        playlist = VideoStreamingPlaylistFactory(video=video)
        video_file = VideoFileFactory(
            video=video,
            filename="test",
            fps=30,
            streamingPlaylist=playlist,
            size=1000,
        )

        # Call the function
        on_hls_video_file_transcoding(video, video_file)
        video_file.refresh_from_db()
        video.refresh_from_db()

        # Assert that the video file was saved with the correct metadata
        self.assertEqual(video_file.size, 2964950)
        self.assertEqual(video_file.fps, 30)
        self.assertEqual(
            video_file.metadata,
            {
                "chapter": probe_response.get("chapter", ""),
                "format": probe_response.get("format", ""),
                "streams": probe_response.get("streams", ""),
            },
        )

        # Assert that the video did not change
        self.assertEqual(video.duration, 10)

        # Assert that the master HLS playlist was updated
        mock_update_master_hls_playlist.assert_called_once_with(video, playlist)

    @patch("transcode_api.utils.transcoding.hls_playlist.update_master_hls_playlist")
    @patch.object(ffmpeg, "probe", return_value=probe_response)
    def test_on_hls_video_file_transcoding_without_existing_playlist(
        self, mock_probe, mock_update_master_hls_playlist
    ):
        # Set up mock objects
        video = VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440003", duration=None)
        video_file = VideoFileFactory(
            video=video,
            filename="test.mp4",
            fps=30,
            size=1000,
        )

        # Call the function
        on_hls_video_file_transcoding(video, video_file)
        video_file.refresh_from_db()
        video.refresh_from_db()

        # Assert that the video file was saved with the correct metadata
        self.assertIsNotNone(video_file.streamingPlaylist)
        self.assertEqual(video_file.size, 2964950)
        self.assertEqual(video_file.fps, 30)
        self.assertEqual(
            video_file.metadata,
            {
                "chapter": probe_response.get("chapter", ""),
                "format": probe_response.get("format", ""),
                "streams": probe_response.get("streams", ""),
            },
        )

        # Assert that the video was saved with the correct duration
        self.assertEqual(video.duration, 22)

        # Assert that the master HLS playlist was updated
        mock_update_master_hls_playlist.assert_called_once_with(video, mock.ANY)

    def test_rename_video_file_in_playlist(self):
        # Set up mock objects
        video = VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440004", duration=10)
        playlist = VideoStreamingPlaylistFactory(
            video=video, playlistFilename=f"video-{video.uuid}/master.m3u8"
        )
        VideoFileFactory(
            video=video,
            filename=f"video-{video.uuid}/test",
            fps=30,
            streamingPlaylist=playlist,
            size=1000,
        )
        content = ContentFile(
            """#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="dcfc7468-786b-466e-8fd0-809a1f5eaa03-480-fragmented.mp4",BYTERANGE="853@0"
#EXTINF:4.000000,
#EXT-X-BYTERANGE:320962@853
dcfc7468-786b-466e-8fd0-809a1f5eaa03-480-fragmented.mp4
#EXTINF:4.000000,
#EXT-X-BYTERANGE:276005@321815
dcfc7468-786b-466e-8fd0-809a1f5eaa03-480-fragmented.mp4
#EXTINF:4.000000,
#EXT-X-BYTERANGE:237588@597820
dcfc7468-786b-466e-8fd0-809a1f5eaa03-480-fragmented.mp4
#EXTINF:4.000000,
#EXT-X-BYTERANGE:167549@835408
dcfc7468-786b-466e-8fd0-809a1f5eaa03-480-fragmented.mp4
#EXTINF:4.000000,
#EXT-X-BYTERANGE:180089@1002957
dcfc7468-786b-466e-8fd0-809a1f5eaa03-480-fragmented.mp4
#EXTINF:2.233333,
#EXT-X-BYTERANGE:85675@1183046
dcfc7468-786b-466e-8fd0-809a1f5eaa03-480-fragmented.mp4
#EXT-X-ENDLIST
"""
        )
        video_storage.save(playlist.playlistFilename, content)

        # Call the function
        rename_video_file_in_playlist(playlist.playlistFilename, "video_file.filename")
        file_content = video_storage.open(playlist.playlistFilename, "r").read()
        self.assertEqual(
            file_content,
            """#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="video_file.filename",BYTERANGE="853@0"
#EXTINF:4.000000,
#EXT-X-BYTERANGE:320962@853
video_file.filename
#EXTINF:4.000000,
#EXT-X-BYTERANGE:276005@321815
video_file.filename
#EXTINF:4.000000,
#EXT-X-BYTERANGE:237588@597820
video_file.filename
#EXTINF:4.000000,
#EXT-X-BYTERANGE:167549@835408
video_file.filename
#EXTINF:4.000000,
#EXT-X-BYTERANGE:180089@1002957
video_file.filename
#EXTINF:2.233333,
#EXT-X-BYTERANGE:85675@1183046
video_file.filename
#EXT-X-ENDLIST
""",
        )
