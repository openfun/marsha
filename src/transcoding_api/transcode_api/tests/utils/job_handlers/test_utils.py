from unittest.mock import patch

from django.test import TestCase

from transcode_api.factories import RunnerJobFactory, VideoFactory, VideoJobInfoFactory
from transcode_api.utils.job_handlers.utils import (
    load_transcoding_runner_video,
    on_transcoding_ended,
)


class TestUtils(TestCase):
    def test_load_transcoding_runner_video(self):
        video = VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440002")

        runner_job = RunnerJobFactory(
            privatePayload={"videoUUID": "123e4567-e89b-12d3-a456-426655440002"}
        )

        result = load_transcoding_runner_video(runner_job)

        self.assertEqual(result, video)

    def test_load_transcoding_runner_video_video_does_not_exist(self):
        VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440002")

        runner_job = RunnerJobFactory(
            privatePayload={"videoUUID": "123e4567-e89b-12d3-a456-426655440001"}
        )

        result = load_transcoding_runner_video(runner_job)

        self.assertIsNone(result)

    @patch("transcode_api.utils.job_handlers.utils.move_to_next_state")
    def test_on_transcoding_ended_move_to_next_state(self, mock_move_to_next_state):
        video = VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440002")
        job_info = VideoJobInfoFactory(video=video, pendingTranscode=1)

        on_transcoding_ended(video, True)
        job_info.refresh_from_db()

        self.assertEqual(job_info.pendingTranscode, 0)
        mock_move_to_next_state.assert_called_once_with(video=video)

    @patch("transcode_api.utils.job_handlers.utils.move_to_next_state")
    def test_on_transcoding_ended(self, mock_move_to_next_state):
        video = VideoFactory(uuid="123e4567-e89b-12d3-a456-426655440002")
        job_info = VideoJobInfoFactory(video=video, pendingTranscode=1)

        on_transcoding_ended(video, False)
        job_info.refresh_from_db()

        self.assertEqual(job_info.pendingTranscode, 0)
        mock_move_to_next_state.assert_not_called()
