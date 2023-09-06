from unittest.mock import patch

from django.test import TestCase

from transcode_api.factories import RunnerJobFactory, VideoFactory, VideoJobInfoFactory
from transcode_api.models import RunnerJobState, RunnerJobType
from transcode_api.utils.job_handlers.vod_hls_transcoding_job_handler import (
    VODHLSTranscodingJobHandler,
)


class TestVODHLSTranscodingJobHandler(TestCase):
    def setUp(self):
        # Create a Video object to use in the tests
        self.video = VideoFactory(
            uuid="123e4567-e89b-12d3-a456-426655440002",
            name="Test Video",
        )

        self.job_info = VideoJobInfoFactory(video=self.video, pendingTranscode=1)

        # Create a RunnerJob object to use in the tests
        self.runner_job = RunnerJobFactory(
            type=RunnerJobType.VOD_HLS_TRANSCODING,
            progress=50,
            payload={
                "input": {
                    "videoFileUrl": "http://example.com/test.mp4",
                },
                "output": {
                    "resolution": "720p",
                    "fps": 30,
                },
            },
            privatePayload={
                "isNewVideo": False,
                "deleteWebVideoFiles": False,
                "videoUUID": "123e4567-e89b-12d3-a456-426655440002",
            },
            failures=4,
            priority=0,
        )

    @patch(
        "transcode_api.utils.job_handlers.abstract_vod_transcoding_job_handler.move_to_failed_transcoding_state"
    )
    def test_error(self, mock_move):
        handler = VODHLSTranscodingJobHandler()
        handler.specific_error(
            runner_job=self.runner_job,
            message="Test",
            next_state=RunnerJobState.ERRORED,
        )
        mock_move.assert_called_once_with(self.video)
        self.job_info.refresh_from_db()
        self.assertEqual(self.job_info.pendingTranscode, 0)

    @patch(
        "transcode_api.utils.job_handlers.abstract_vod_transcoding_job_handler.move_to_next_state"
    )
    def test_cancel(self, mock_move):
        handler = VODHLSTranscodingJobHandler()
        handler.specific_cancel(runner_job=self.runner_job)
        mock_move.assert_called_once_with(video=self.video, is_new_video=False)
        self.job_info.refresh_from_db()
        self.assertEqual(self.job_info.pendingTranscode, 0)
