from datetime import timedelta
from unittest.mock import call, patch

from django.test import TestCase
from django.utils import timezone

from transcode_api.factories import (
    RunnerFactory,
    RunnerJobFactory,
    VideoFactory,
    VideoFileFactory,
    VideoJobInfoFactory,
)
from transcode_api.models import (
    RunnerJobState,
    VideoFile,
    VideoJobInfo,
    VideoJobInfoColumnType,
    VideoResolution,
)


class TestModel(TestCase):
    def setUp(self):
        self.video = VideoFactory(
            duration=60,
            name="Test Video",
        )

    @patch("transcode_api.models.video_storage")
    def test_remove_web_video_file(self, mock_storage):
        video_file = VideoFileFactory(filename="test.mp4")

        video_file.remove_web_video_file()

        mock_storage.delete.assert_called_once_with("test.mp4")

    def test_is_audio(self):
        audio_file = VideoFileFactory(
            resolution=VideoResolution.H_NOVIDEO,
            size=1024,
            extname="mp3",
            fps=-1,
        )

        video_file = VideoFileFactory(
            resolution=VideoResolution.H_720P,
            size=1024,
            extname="mp4",
            fps=30,
        )

        self.assertTrue(audio_file.is_audio())
        self.assertFalse(video_file.is_audio())

    def test_update_last_contact_within_5_minutes(self):
        runner = RunnerFactory(
            runnerToken="test_runner_token",
            name="Test Runner",
            description="Test Description",
            lastContact=timezone.now() - timedelta(minutes=10),
            ip="127.0.0.1",
        )
        # Call the update_last_contact method with a new IP address
        runner.update_last_contact("192.168.0.1")

        # Check that the lastContact and ip fields were updated
        self.assertAlmostEqual(
            runner.lastContact, timezone.now(), delta=timedelta(seconds=1)
        )
        self.assertEqual(runner.ip, "192.168.0.1")

    def test_update_last_contact(self):
        runner = RunnerFactory(
            runnerToken="test_runner_token",
            name="Test Runner",
            description="Test Description",
            lastContact=timezone.now() - timedelta(minutes=3),
            ip="127.0.0.1",
        )

        # Call the update_last_contact method with the same IP address
        runner.update_last_contact("127.0.0.1")

        # Check that the lastContact and ip fields were not updated
        self.assertNotAlmostEqual(
            runner.lastContact, timezone.now(), delta=timedelta(seconds=1)
        )
        self.assertEqual(runner.ip, "127.0.0.1")

    def test_set_to_error_or_cancel(self):
        runner_job = RunnerJobFactory(
            state=RunnerJobState.PROCESSING,
            error=None,
            failures=0,
            finishedAt=None,
        )

        runner_job.set_to_error_or_cancel(RunnerJobState.ERRORED)

        self.assertEqual(runner_job.state, RunnerJobState.ERRORED)
        self.assertIsNone(runner_job.processingJobToken)
        self.assertIsNotNone(runner_job.finishedAt)

    def test_reset_to_pending(self):
        runner_job = RunnerJobFactory(
            state=RunnerJobState.PROCESSING,
            error=None,
            failures=0,
            finishedAt=timezone.now(),
            startedAt=timezone.now(),
            progress=0.5,
        )

        runner_job.reset_to_pending()

        self.assertEqual(runner_job.state, RunnerJobState.PENDING)
        self.assertIsNone(runner_job.processingJobToken)
        self.assertIsNone(runner_job.progress)
        self.assertIsNone(runner_job.startedAt)
        self.assertIsNone(runner_job.finishedAt)

    def test_update_dependant_jobs(self):
        runner_job = RunnerJobFactory(
            state=RunnerJobState.PROCESSING,
        )

        child1 = RunnerJobFactory(
            state=RunnerJobState.WAITING_FOR_PARENT_JOB,
            dependsOnRunnerJob=runner_job,
        )
        child2 = RunnerJobFactory(
            state=RunnerJobState.WAITING_FOR_PARENT_JOB,
            dependsOnRunnerJob=runner_job,
        )

        num_updated = runner_job.update_dependant_jobs()

        child1.refresh_from_db()
        child2.refresh_from_db()

        self.assertEqual(num_updated, 2)
        self.assertEqual(child1.state, RunnerJobState.PENDING)
        self.assertEqual(child2.state, RunnerJobState.PENDING)

    def test_get_max_quality_file_with_not_file(self):
        # Call the get_max_quality_file method
        max_quality_file = self.video.get_max_quality_file()

        # Check that the method returns the expected VideoFile object
        self.assertIsNone(max_quality_file)

    def test_get_max_quality_file(self):
        VideoFileFactory(video=self.video, resolution=VideoResolution.H_720P)
        video_file2 = VideoFileFactory(
            video=self.video, resolution=VideoResolution.H_1080P
        )

        max_quality_file = self.video.get_max_quality_file()

        # Check that the method returns the expected VideoFile object
        self.assertEqual(video_file2, max_quality_file)

    @patch("transcode_api.models.video_storage")
    def test_remove_all_web_video_files(self, mock_storage):
        video_file1 = VideoFileFactory(video=self.video)
        video_file2 = VideoFileFactory(video=self.video)

        # Call the remove_all_web_video_files method
        self.video.remove_all_web_video_files()

        mock_storage.delete.has_calls(
            [
                call(video_file1.filename),
                call(video_file2.filename),
            ]
        )
        self.assertFalse(VideoFile.objects.filter(video=self.video).exists())

    def test_get_bandwidth_bits(self):
        video_file1 = VideoFileFactory(video=self.video, size=133333)

        bandwidth_bits = self.video.get_bandwidth_bits(video_file1)

        # Check that the method returns the expected bandwidth in bits
        self.assertEqual(bandwidth_bits, 17777)

    def test_get_bandwidth_bits_with_no_duration(self):
        self.video.duration = None
        video_file1 = VideoFileFactory(video=self.video, size=133333)

        bandwidth_bits = self.video.get_bandwidth_bits(video_file1)

        # Check that the method returns the expected bandwidth in bits
        self.assertEqual(bandwidth_bits, 133333)

    def test_increase_or_create_job_info_pending_transcode(self):
        # Call the increase_or_create_job_info method with a column name and an amount
        num_jobs = self.video.increase_or_create_job_info(
            VideoJobInfoColumnType.PENDING_TRANSCODE, 2
        )

        # Check that the method created a new VideoJobInfo object and updated the specified column
        self.assertEqual(num_jobs, 2)
        self.assertTrue(VideoJobInfo.objects.filter(video=self.video).exists())
        job_info = VideoJobInfo.objects.get(video=self.video)
        self.assertEqual(job_info.pendingTranscode, 2)

    def test_increase_or_create_job_info_pending_move(self):
        # Call the increase_or_create_job_info method with a column name and an amount
        num_jobs = self.video.increase_or_create_job_info(
            VideoJobInfoColumnType.PENDING_MOVE, 4
        )

        # Check that the method created a new VideoJobInfo object and updated the specified column
        self.assertEqual(num_jobs, 4)
        self.assertTrue(VideoJobInfo.objects.filter(video=self.video).exists())
        job_info = VideoJobInfo.objects.get(video=self.video)
        self.assertEqual(job_info.pendingMove, 4)

    def test_decrease_job_info_pending_transcode(self):
        # Call the decrease_job_info method with a column name
        job_info = VideoJobInfoFactory(video=self.video, pendingTranscode=2)
        num_jobs = self.video.decrease_job_info(
            VideoJobInfoColumnType.PENDING_TRANSCODE
        )

        job_info.refresh_from_db()
        self.assertEqual(num_jobs, 1)
        self.assertEqual(job_info.pendingTranscode, 1)

    def test_decrease_job_info_pending_move(self):
        # Call the decrease_job_info method with a column name
        job_info = VideoJobInfoFactory(video=self.video, pendingMove=4)
        num_jobs = self.video.decrease_job_info(VideoJobInfoColumnType.PENDING_MOVE)

        job_info.refresh_from_db()
        self.assertEqual(num_jobs, 3)
        self.assertEqual(job_info.pendingMove, 3)
