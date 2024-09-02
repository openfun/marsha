"""Tests for the Video transcript source API."""

from datetime import datetime, timezone
from http import HTTPStatus

from django_peertube_runner_connector.factories import RunnerJobFactory
import requests
import responses
from rest_framework.test import APITestCase

from marsha.core import factories
from marsha.core.defaults import READY
from marsha.core.serializers import VideoSerializer


class VideoTranscriptSourceAPITest(APITestCase):
    """Test the "transcript source" API of the video object."""

    def setUp(self):
        """Create a video object and a runner job."""
        self.video = factories.VideoFactory(
            title="Test Video",
            upload_state=READY,
            uploaded_on=datetime(2018, 8, 8, tzinfo=timezone.utc),
            resolutions=[144, 240, 480, 720],
        )
        self.url = f"/api/videos/{self.video.pk}/transcript-source/"
        serializer = VideoSerializer(self.video)
        self.video_url = serializer.data.get("urls").get("mp4").get(144)
        runner_job = RunnerJobFactory()
        self.runner_job_data = {
            "runnerToken": runner_job.runner.runnerToken,
            "jobToken": runner_job.processingJobToken,
        }

    @responses.activate
    def test_api_video_transcript_source(self):
        """The API should return the video source."""
        responses.get(
            url=self.video_url,
            body=b"video content",
            status=200,
            content_type="video/mp4",
        )

        response = self.client.post(self.url, data=self.runner_job_data)

        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(response["Content-Type"], "video/mp4")
        self.assertEqual(b"".join(response.streaming_content), b"video content")

    @responses.activate
    def test_api_video_transcript_source_missing_video_url(self):
        """The API should return a 404 if the video source is not available."""
        self.video.resolutions = []
        self.video.save()

        response = self.client.post(self.url, data=self.runner_job_data)

        self.assertContains(
            response,
            "No video source available for this video.",
            status_code=HTTPStatus.NOT_FOUND,
        )

    @responses.activate
    def test_api_video_transcript_source_request_failure(self):
        """The API should return a 400 if the request to the video source fails."""
        responses.get(
            url=self.video_url,
            body=requests.RequestException(),
            status=500,
        )

        response = self.client.post(self.url, data=self.runner_job_data)

        self.assertEqual(response.status_code, HTTPStatus.BAD_REQUEST)

    @responses.activate
    def test_api_video_transcript_source_no_runner(self):
        """The API should return a 403 if the request is not from a runner job."""
        responses.get(
            url=self.video_url,
            body=b"video content",
            status=200,
            content_type="video/mp4",
        )
        data = {
            "runnerToken": "unknown-runner-token",
            "jobToken": "unknown-job-token",
        }

        response = self.client.post(self.url, data=data)

        self.assertContains(
            response,
            "RunnerJob not found.",
            status_code=HTTPStatus.FORBIDDEN,
        )
