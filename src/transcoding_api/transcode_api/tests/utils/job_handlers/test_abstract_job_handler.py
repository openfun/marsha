from datetime import timedelta
from unittest.mock import Mock, call, patch

from django.test import TestCase, override_settings
from django.utils import timezone

from transcode_api.factories import RunnerJobFactory, VideoFactory
from transcode_api.models import RunnerJobState, RunnerJobType
from transcode_api.utils.job_handlers.vod_hls_transcoding_job_handler import (
    VODHLSTranscodingJobHandler,
)


class TestAbstractJobHandler(TestCase):
    """Test the abstract job handler."""

    def setUp(self):
        """Create a video, a runner job."""
        # Create a Video object to use in the tests
        self.video = VideoFactory(
            uuid="123e4567-e89b-12d3-a456-426655440002",
            name="Test Video",
        )

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
                "videoUUID": "test_uuid",
            },
            failures=4,
            priority=0,
        )

    @patch(
        "transcode_api.utils.job_handlers.abstract_job_handler.send_available_jobs_ping_to_runners"
    )
    def test_create_runner_parent_job(self, mock_ping):
        """Should be able to create a VOD_HLS_TRANSCODING runner job."""
        handler = VODHLSTranscodingJobHandler()
        runner_job = handler.create_runner_job(
            type=RunnerJobType.VOD_HLS_TRANSCODING,
            job_uuid="123e4567-e89b-12d3-a456-426655440003",
            payload={"test": "test"},
            private_payload={"private": "private"},
            priority=0,
            depends_on_runner_job=None,
        )
        self.assertEqual(runner_job.state, RunnerJobState.PENDING)
        self.assertEqual(runner_job.type, RunnerJobType.VOD_HLS_TRANSCODING)
        self.assertEqual(runner_job.payload, {"test": "test"})
        self.assertEqual(runner_job.privatePayload, {"private": "private"})
        self.assertEqual(runner_job.priority, 0)
        self.assertIsNone(runner_job.dependsOnRunnerJob)

        mock_ping.assert_called_once()

    @patch(
        "transcode_api.utils.job_handlers.abstract_job_handler.send_available_jobs_ping_to_runners"
    )
    def test_create_runner_child_job(self, mock_ping):
        """Should be able to create a VOD_HLS_TRANSCODING child runner job."""
        handler = VODHLSTranscodingJobHandler()
        runner_job = handler.create_runner_job(
            type=RunnerJobType.VOD_HLS_TRANSCODING,
            job_uuid="123e4567-e89b-12d3-a456-426655440003",
            payload={"test": "test"},
            private_payload={"private": "private"},
            priority=0,
            depends_on_runner_job=self.runner_job,
        )
        self.assertEqual(runner_job.state, RunnerJobState.WAITING_FOR_PARENT_JOB)
        self.assertEqual(runner_job.type, RunnerJobType.VOD_HLS_TRANSCODING)
        self.assertEqual(runner_job.payload, {"test": "test"})
        self.assertEqual(runner_job.privatePayload, {"private": "private"})
        self.assertEqual(runner_job.priority, 0)
        self.assertEqual(runner_job.dependsOnRunnerJob, self.runner_job)

        mock_ping.assert_not_called()

    def test_update_with_progress(self):
        """Should update the progress of the runner job."""
        handler = VODHLSTranscodingJobHandler()
        handler.specific_update = Mock()
        handler.update(
            runner_job=self.runner_job,
            progress=100,
            update_payload=None,
        )

        self.assertEqual(self.runner_job.progress, 100)
        handler.specific_update.assert_called_once_with(self.runner_job, None)

    def test_update_without_progress(self):
        """Should not update the progress of the runner job."""
        handler = VODHLSTranscodingJobHandler()
        handler.specific_update = Mock()
        handler.update(
            runner_job=self.runner_job,
            progress=None,
            update_payload=None,
        )

        self.assertEqual(self.runner_job.progress, 50)
        handler.specific_update.assert_called_once_with(self.runner_job, None)

    @patch(
        "transcode_api.utils.job_handlers.abstract_job_handler.send_available_jobs_ping_to_runners"
    )
    def test_complete_with_child(self, mock_ping):
        """Should be able to complete a VOD_HLS_TRANSCODING job."""
        handler = VODHLSTranscodingJobHandler()
        handler.specific_complete = Mock()
        runner_job = RunnerJobFactory(
            state=RunnerJobState.WAITING_FOR_PARENT_JOB,
            type=RunnerJobType.VOD_HLS_TRANSCODING,
            dependsOnRunnerJob=self.runner_job,
        )
        handler.complete(
            runner_job=self.runner_job,
            result_payload={"test": "test"},
        )

        handler.specific_complete.assert_called_once_with(
            self.runner_job,
            {"test": "test"},
        )
        mock_ping.assert_called_once()

        runner_job.refresh_from_db()

        self.assertEqual(self.runner_job.state, RunnerJobState.COMPLETED)
        self.assertIsNone(self.runner_job.progress)
        self.assertAlmostEqual(
            self.runner_job.finishedAt, timezone.now(), delta=timedelta(seconds=1)
        )
        self.assertEqual(runner_job.state, RunnerJobState.PENDING)

    @patch(
        "transcode_api.utils.job_handlers.abstract_job_handler.send_available_jobs_ping_to_runners"
    )
    def test_complete_without_child(self, mock_ping):
        """Should be able to complete a VOD_HLS_TRANSCODING job without a child."""
        handler = VODHLSTranscodingJobHandler()
        handler.specific_complete = Mock()
        handler.complete(
            runner_job=self.runner_job,
            result_payload={"test": "test"},
        )

        handler.specific_complete.assert_called_once_with(
            self.runner_job,
            {"test": "test"},
        )
        mock_ping.assert_not_called()

        self.assertEqual(self.runner_job.state, RunnerJobState.COMPLETED)
        self.assertIsNone(self.runner_job.progress)
        self.assertAlmostEqual(
            self.runner_job.finishedAt, timezone.now(), delta=timedelta(seconds=1)
        )

    @patch(
        "transcode_api.utils.job_handlers.abstract_job_handler.send_available_jobs_ping_to_runners"
    )
    def test_complete_with_specific_complete_failing(self, mock_ping):
        """Should be able to complete a VOD_HLS_TRANSCODING job with a failing specific_complete."""
        handler = VODHLSTranscodingJobHandler()
        handler.specific_complete = Mock()
        handler.specific_complete.side_effect = Exception("Test")
        handler.complete(
            runner_job=self.runner_job,
            result_payload={"test": "test"},
        )

        handler.specific_complete.assert_called_once_with(
            self.runner_job,
            {"test": "test"},
        )
        mock_ping.assert_not_called()
        self.assertEqual(self.runner_job.state, RunnerJobState.ERRORED)
        self.assertEqual(self.runner_job.error, "Test")
        self.assertIsNone(self.runner_job.progress)
        self.assertAlmostEqual(
            self.runner_job.finishedAt, timezone.now(), delta=timedelta(seconds=1)
        )

    def test_cancel(self):
        """Should be able to cancel a VOD_HLS_TRANSCODING job."""
        runner_job = RunnerJobFactory(
            state=RunnerJobState.WAITING_FOR_PARENT_JOB,
            type=RunnerJobType.VOD_HLS_TRANSCODING,
            dependsOnRunnerJob=self.runner_job,
        )
        handler = VODHLSTranscodingJobHandler()
        handler.specific_cancel = Mock()
        handler.cancel(
            runner_job=self.runner_job,
            from_parent=False,
        )

        handler.specific_cancel.assert_has_calls(
            [
                call(self.runner_job),
                call(runner_job),
            ]
        )

        runner_job.refresh_from_db()
        self.assertEqual(self.runner_job.state, RunnerJobState.CANCELLED)
        self.assertEqual(runner_job.state, RunnerJobState.PARENT_CANCELLED)

    def test_abort_with_abort_supported(self):
        """Should reset the state of the runner job."""
        handler = VODHLSTranscodingJobHandler()
        handler.is_abort_supported = Mock(return_value=True)
        handler.specific_abort = Mock()
        handler.abort(runner_job=self.runner_job)
        self.assertEqual(self.runner_job.state, RunnerJobState.PENDING)
        self.assertEqual(self.runner_job.processingJobToken, None)
        self.assertEqual(self.runner_job.progress, None)
        self.assertEqual(self.runner_job.finishedAt, None)
        self.assertEqual(self.runner_job.startedAt, None)

    def test_abort_with_abort_not_supported(self):
        """Should put the runner job in error state."""
        handler = VODHLSTranscodingJobHandler()
        handler.is_abort_supported = Mock(return_value=False)
        handler.specific_abort = Mock()
        handler.error = Mock()
        handler.abort(runner_job=self.runner_job)

        handler.error.assert_called_once_with(
            self.runner_job,
            "Job has been aborted but it is not supported by this job type",
        )
        handler.specific_abort.assert_not_called()

    def test_error_with_abort_supported(self):
        """Should reset the state of the runner job."""
        handler = VODHLSTranscodingJobHandler()
        handler.is_abort_supported = Mock(return_value=True)
        handler.specific_error = Mock()
        handler.error(runner_job=self.runner_job, message="Test")

        handler.specific_error.assert_called_once_with(
            self.runner_job, "Test", RunnerJobState.PENDING
        )
        self.assertEqual(self.runner_job.state, RunnerJobState.PENDING)
        self.assertEqual(self.runner_job.processingJobToken, None)
        self.assertEqual(self.runner_job.progress, None)
        self.assertEqual(self.runner_job.finishedAt, None)
        self.assertEqual(self.runner_job.startedAt, None)

    @override_settings(TRANSCODING_RUNNER_MAX_FAILURE=1)
    def test_error_with_max_failure_exceeded(self):
        """Should put the runner job in error state."""
        handler = VODHLSTranscodingJobHandler()
        handler.is_abort_supported = Mock(return_value=True)
        handler.specific_error = Mock()
        handler.error(runner_job=self.runner_job, message="Test")

        handler.specific_error.assert_called_once_with(
            self.runner_job, "Test", RunnerJobState.ERRORED
        )
        self.assertEqual(self.runner_job.state, RunnerJobState.ERRORED)
        self.assertEqual(self.runner_job.processingJobToken, None)
        self.assertAlmostEqual(
            self.runner_job.finishedAt, timezone.now(), delta=timedelta(seconds=1)
        )

    def test_error_with_abort_not_supported(self):
        """Should put the runner job in error state."""
        handler = VODHLSTranscodingJobHandler()
        handler.is_abort_supported = Mock(return_value=False)
        handler.specific_error = Mock()
        handler.error(runner_job=self.runner_job, message="Test")

        handler.specific_error.assert_called_once_with(
            self.runner_job, "Test", RunnerJobState.ERRORED
        )
        self.assertEqual(self.runner_job.state, RunnerJobState.ERRORED)
        self.assertEqual(self.runner_job.processingJobToken, None)
        self.assertAlmostEqual(
            self.runner_job.finishedAt, timezone.now(), delta=timedelta(seconds=1)
        )
