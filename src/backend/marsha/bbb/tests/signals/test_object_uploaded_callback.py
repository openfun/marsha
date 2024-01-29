"""Tests for the create service in the ``bbb`` app of the Marsha project."""

from unittest import mock

from django.test import TestCase

from marsha.bbb.factories import ClassroomRecordingFactory
from marsha.bbb.utils import bbb_utils
from marsha.core.api import signal_object_uploaded
from marsha.core.factories import VideoFactory
from marsha.core.models import Video


class ObjectUploadedCallbackTestCase(TestCase):
    """Test our intentions about the delete Classroom recordings service."""

    maxDiff = None

    @mock.patch.object(bbb_utils, "delete_recording")
    def test_object_uploaded_callback_video_with_recording(self, delete_recording_mock):
        """
        When a video with a recording has been uploaded,
        BBB API call to delete recordings should be called.
        """
        video = VideoFactory()
        ClassroomRecordingFactory(
            record_id="7a567d67-29d3-4547-96f3-035733a4dfaa", vod=video
        )

        signal_object_uploaded.send(sender="update_state", model=Video, instance=video)
        delete_recording_mock.assert_called_once()

    @mock.patch.object(bbb_utils, "delete_recording")
    def test_object_uploaded_callback_video_with_no_recording(
        self, delete_recording_mock
    ):
        """
        When a video with no recording has been uploaded,
        BBB Api should not be called.
        """
        video = VideoFactory()

        signal_object_uploaded.send(sender="update_state", model=Video, instance=video)
        delete_recording_mock.assert_not_called()
