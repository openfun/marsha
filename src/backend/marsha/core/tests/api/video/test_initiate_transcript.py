"""Tests for the Video initiate transcript API."""

from datetime import datetime, timezone as baseTimezone
from http import HTTPStatus
import json
from unittest import mock

from django.db.transaction import atomic
from django.test import TestCase

from marsha.core import defaults, factories, models
from marsha.core.simple_jwt.factories import (
    InstructorOrAdminLtiTokenFactory,
    UserAccessTokenFactory,
)
from marsha.websocket.utils import channel_layers_utils


class VideoInitiateTranscriptAPITest(TestCase):
    """Test the "initiate transcript" API of the video object."""

    maxDiff = None

    def test_api_video_initiate_transcript_anonymous_user(self):
        """Anonymous users should not be able to initiate a transcript."""
        video = factories.VideoFactory()

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-transcript/",
        )

        self.assertEqual(response.status_code, HTTPStatus.UNAUTHORIZED)
        self.assertEqual(
            response.json(), {"detail": "Authentication credentials were not provided."}
        )

    def test_api_video_instructor_initiate_transcript_in_read_only(self):
        """An instructor with read_only set to true should not be able to initiate a transcript."""
        video = factories.VideoFactory()
        jwt_token = InstructorOrAdminLtiTokenFactory(
            playlist=video.playlist,
            permissions__can_update=False,
        )

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-transcript/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)

    def test_api_video_initiate_transcript_token_user(self):
        """A token user associated to a video should be able to initiate a transcript."""
        video = factories.VideoFactory(
            pk="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            upload_state=defaults.READY,
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            transcode_pipeline=defaults.PEERTUBE_PIPELINE,
            resolutions=[720, 1080],
            playlist__title="foo bar",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        with self.settings(LANGUAGES=(("en", "English"),)), mock.patch(
            "marsha.core.api.video.launch_video_transcript.delay"
        ) as mock_launch_video_transcript, mock.patch.object(
            channel_layers_utils, "dispatch_timed_text_track"
        ) as mock_dispatch_timed_text_track, mock.patch.object(
            channel_layers_utils, "dispatch_video"
        ) as mock_dispatch_video:
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-transcript/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, HTTPStatus.OK)
        mock_launch_video_transcript.assert_called_once_with(
            video_pk=video.pk, stamp="1533686400", domain="http://testserver"
        )

        timed_text_track = video.timedtexttracks.get()
        mock_dispatch_timed_text_track.assert_called_once_with(timed_text_track)
        mock_dispatch_video.assert_called_once_with(video)

        self.assertEqual(timed_text_track.language, "en")
        self.assertEqual(timed_text_track.mode, models.TimedTextTrack.SUBTITLE)
        self.assertEqual(timed_text_track.upload_state, defaults.PROCESSING)

    def test_api_video_initiate_transcript_staff_or_user(self):
        """Users authenticated via a session should not be able to retrieve a transcript policy."""
        for user in [factories.UserFactory(), factories.UserFactory(is_staff=True)]:
            self.client.login(username=user.username, password="test")
            video = factories.VideoFactory()

            response = self.client.post(
                f"/api/videos/{video.id}/initiate-transcript/",
            )

            self.assertEqual(response.status_code, HTTPStatus.UNAUTHORIZED)
            self.assertEqual(
                response.json(),
                {"detail": "Authentication credentials were not provided."},
            )

    def test_api_video_initiate_transcript_by_organization_instructor(self):
        """Organization instructors cannot initiate a transcript."""
        organization_access = factories.OrganizationAccessFactory(
            role=models.INSTRUCTOR
        )
        video = factories.VideoFactory(
            playlist__organization=organization_access.organization
        )
        jwt_token = UserAccessTokenFactory(user=organization_access.user)

        response = self.client.post(
            f"/api/videos/{video.id}/initiate-transcript/",
            HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
        )

        self.assertEqual(response.status_code, HTTPStatus.FORBIDDEN)
        self.assertEqual(
            json.loads(response.content),
            {"detail": "You do not have permission to perform this action."},
        )

    def test_api_video_initiate_transcript_existing_timed_text_track(self):
        """When a transcript already exists, it should not be re-created."""
        video = factories.VideoFactory(
            pk="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            upload_state=defaults.READY,
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            transcode_pipeline=defaults.PEERTUBE_PIPELINE,
            resolutions=[720, 1080],
            playlist__title="foo bar",
        )
        factories.TimedTextTrackFactory(
            video=video,
            language="en",
            mode=models.TimedTextTrack.SUBTITLE,
            upload_state=defaults.READY,
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        with atomic(), self.settings(LANGUAGES=(("en", "English"),)), mock.patch(
            "marsha.core.api.video.launch_video_transcript.delay"
        ) as mock_launch_video_transcript, mock.patch.object(
            channel_layers_utils, "dispatch_timed_text_track"
        ) as mock_dispatch_timed_text_track, mock.patch.object(
            channel_layers_utils, "dispatch_video"
        ) as mock_dispatch_video:
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-transcript/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertContains(
            response,
            "Transcript already exists for this video",
            status_code=HTTPStatus.BAD_REQUEST,
        )
        video.refresh_from_db()
        self.assertEqual(video.timedtexttracks.count(), 1)
        mock_launch_video_transcript.assert_not_called()
        mock_dispatch_video.assert_not_called()
        mock_dispatch_timed_text_track.assert_not_called()

    def test_api_video_initiate_transcript_aws_pipeline(self):
        """A token user associated to a video should be able to initiate a transcript."""
        video = factories.VideoFactory(
            pk="a2f27fde-973a-4e89-8dca-cc59e01d255c",
            upload_state=defaults.READY,
            uploaded_on=datetime(2018, 8, 8, tzinfo=baseTimezone.utc),
            transcode_pipeline=defaults.AWS_PIPELINE,
            resolutions=[720, 1080],
            playlist__title="foo bar",
        )
        jwt_token = InstructorOrAdminLtiTokenFactory(playlist=video.playlist)

        with self.settings(LANGUAGES=(("en", "English"),)), mock.patch(
            "marsha.core.api.video.launch_video_transcript.delay"
        ) as mock_launch_video_transcript, mock.patch.object(
            channel_layers_utils, "dispatch_timed_text_track"
        ) as mock_dispatch_timed_text_track, mock.patch.object(
            channel_layers_utils, "dispatch_video"
        ) as mock_dispatch_video:
            response = self.client.post(
                f"/api/videos/{video.id}/initiate-transcript/",
                HTTP_AUTHORIZATION=f"Bearer {jwt_token}",
            )

        self.assertEqual(response.status_code, 200)
        mock_launch_video_transcript.assert_called_once_with(
            video_pk=video.pk,
            stamp="1533686400",
            domain="http://testserver",
            video_url=(
                "http://testserver/api/videos/a2f27fde-973a-4e89-8dca-cc59e01d255c"
                "/transcript-source/"
            ),
        )

        timed_text_track = video.timedtexttracks.get()
        mock_dispatch_timed_text_track.assert_called_once_with(timed_text_track)
        mock_dispatch_video.assert_called_once_with(video)

        self.assertEqual(timed_text_track.language, "en")
        self.assertEqual(timed_text_track.mode, models.TimedTextTrack.SUBTITLE)
        self.assertEqual(timed_text_track.upload_state, defaults.PROCESSING)
