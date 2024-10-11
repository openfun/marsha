"""Test transcript_video command."""

from unittest.mock import patch

from django.core.management import call_command
from django.test import TestCase

from marsha.core.utils import transcode


@patch.object(transcode, "delete_transcoding_temp_files")
class TranscriptVideosTestCase(TestCase):
    """
    Test case for the transcript_videos command.
    """

    maxDiff = None

    def test_delete_transcoding_temp_files(self, mock_delete_temp_files):
        """Should call delete_transcoding_temp_files function."""
        call_command("delete_transcoding_temp_files")

        mock_delete_temp_files.assert_called_once()
