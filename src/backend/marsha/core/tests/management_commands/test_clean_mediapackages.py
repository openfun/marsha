"""Tests for clean_mediapackages command."""

from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from marsha.core.management.commands import clean_mediapackages


class CleanMediapackagesTest(TestCase):
    """Test clean_mediapackages command."""

    @mock.patch.object(clean_mediapackages, "list_indexed_medialive_channels")
    @mock.patch.object(clean_mediapackages, "list_mediapackage_channels")
    def test_clean_mediapackages_no_mediapackage(
        self, mock_mediapackage_channels, mock_medialive_indexed_channels
    ):
        """Command should do nothing when there is no mediapackage to process."""
        out = StringIO()
        mock_mediapackage_channels.return_value = []
        mock_medialive_indexed_channels.return_value = {}

        call_command("clean_mediapackages", stdout=out)

        self.assertEqual("", out.getvalue())
        out.close()

    @mock.patch.object(clean_mediapackages, "list_indexed_medialive_channels")
    @mock.patch.object(clean_mediapackages, "list_mediapackage_channels")
    def test_clean_mediapackages_related_medialive(
        self, mock_mediapackage_channels, mock_medialive_indexed_channels
    ):
        """Command should do nothing when there is related medialives."""
        out = StringIO()
        mock_mediapackage_channels.return_value = [{"Id": "MP1"}, {"Id": "MP2"}]
        mock_medialive_indexed_channels.return_value = {
            "MP1": {"Id": "ML1", "Name": "MP1"},
            "MP2": {"Id": "ML2", "Name": "MP2"},
        }

        call_command("clean_mediapackages", stdout=out)

        self.assertIn("Processing mediapackage channel MP1", out.getvalue())
        self.assertIn("Processing mediapackage channel MP2", out.getvalue())
        self.assertNotIn("Mediapackage channel MP1 deleted", out.getvalue())
        self.assertNotIn("Mediapackage channel MP2 deleted", out.getvalue())
        out.close()

    @mock.patch.object(clean_mediapackages, "list_mediapackage_channel_harvest_jobs")
    @mock.patch.object(clean_mediapackages, "list_indexed_medialive_channels")
    @mock.patch.object(clean_mediapackages, "list_mediapackage_channels")
    def test_clean_mediapackages_harvest_job_pending(
        self,
        mock_mediapackage_channels,
        mock_medialive_indexed_channels,
        mock_harvest_jobs,
    ):
        """Command should do nothing when there is a pending harvest job."""
        out = StringIO()
        mock_mediapackage_channels.return_value = [{"Id": "MP1"}]
        mock_medialive_indexed_channels.return_value = {}
        mock_harvest_jobs.return_value = [{"Status": "PENDING"}]

        call_command("clean_mediapackages", stdout=out)

        self.assertIn("Processing mediapackage channel MP1", out.getvalue())
        self.assertNotIn("Mediapackage channel MP1 deleted", out.getvalue())
        out.close()

    @mock.patch.object(clean_mediapackages, "delete_mediapackage_channel")
    @mock.patch.object(clean_mediapackages, "list_mediapackage_channel_harvest_jobs")
    @mock.patch.object(clean_mediapackages, "list_mediapackage_channels")
    @mock.patch.object(clean_mediapackages, "list_indexed_medialive_channels")
    def test_clean_mediapackages_harvest_job_failed(
        self,
        mock_medialive_indexed_channels,
        mock_mediapackage_channels,
        mock_harvest_jobs,
        mock_delete_mediapackage,
    ):
        """Command should delete channel when only a failed harvest job exists."""
        out = StringIO()
        mock_mediapackage_channels.return_value = [{"Id": "MP1"}]
        mock_medialive_indexed_channels.return_value = {}
        mock_harvest_jobs.return_value = [{"Status": "FAILED"}]
        mock_delete_mediapackage.return_value = ["EP1", "EP2"]

        call_command("clean_mediapackages", stdout=out)

        self.assertIn("Processing mediapackage channel MP1", out.getvalue())
        self.assertIn("Mediapackage channel endpoint EP1 deleted", out.getvalue())
        self.assertIn("Mediapackage channel endpoint EP2 deleted", out.getvalue())
        self.assertIn("Mediapackage channel MP1 deleted", out.getvalue())
        out.close()

    @mock.patch.object(clean_mediapackages, "list_mediapackage_channel_harvest_jobs")
    @mock.patch.object(clean_mediapackages, "list_indexed_medialive_channels")
    @mock.patch.object(clean_mediapackages, "list_mediapackage_channels")
    def test_clean_mediapackages_harvest_jobs_failed_and_pending(
        self,
        mock_mediapackage_channels,
        mock_medialive_indexed_channels,
        mock_harvest_jobs,
    ):
        """Command should do nothing when failed and pending harvest job exists."""
        out = StringIO()
        mock_mediapackage_channels.return_value = [{"Id": "MP1"}]
        mock_medialive_indexed_channels.return_value = {}
        mock_harvest_jobs.return_value = [
            {"Status": "FAILED"},
            {"Status": "PENDING"},
        ]

        call_command("clean_mediapackages", stdout=out)

        self.assertIn("Processing mediapackage channel MP1", out.getvalue())
        self.assertNotIn("Mediapackage channel MP1 deleted", out.getvalue())
        out.close()

    @mock.patch.object(clean_mediapackages, "list_mediapackage_channel_harvest_jobs")
    @mock.patch.object(clean_mediapackages, "list_indexed_medialive_channels")
    @mock.patch.object(clean_mediapackages, "list_mediapackage_channels")
    def test_clean_mediapackages_harvest_jobs_pending_and_failed(
        self,
        mock_mediapackage_channels,
        mock_medialive_indexed_channels,
        mock_harvest_jobs,
    ):
        """Command should do nothing when pending and failed harvest job exists."""
        out = StringIO()
        mock_mediapackage_channels.return_value = [{"Id": "MP1"}]
        mock_medialive_indexed_channels.return_value = {}
        mock_harvest_jobs.return_value = [
            {"Status": "PENDING"},
            {"Status": "FAILED"},
        ]

        call_command("clean_mediapackages", stdout=out)

        self.assertIn("Processing mediapackage channel MP1", out.getvalue())
        self.assertNotIn("Mediapackage channel MP1 deleted", out.getvalue())
        out.close()

    @mock.patch.object(clean_mediapackages, "delete_mediapackage_channel")
    @mock.patch.object(clean_mediapackages, "list_mediapackage_channel_harvest_jobs")
    @mock.patch.object(clean_mediapackages, "list_indexed_medialive_channels")
    @mock.patch.object(clean_mediapackages, "list_mediapackage_channels")
    def test_clean_mediapackages_no_harvest_job(
        self,
        mock_mediapackage_channels,
        mock_medialive_indexed_channels,
        mock_harvest_jobs,
        mock_delete_mediapackage,
    ):
        """Command should delete channel when no harvest job exists."""
        out = StringIO()
        mock_mediapackage_channels.return_value = [{"Id": "MP1"}]
        mock_medialive_indexed_channels.return_value = {}
        mock_harvest_jobs.return_value = []
        mock_delete_mediapackage.return_value = ["EP1", "EP2"]

        call_command("clean_mediapackages", stdout=out)

        self.assertIn("Processing mediapackage channel MP1", out.getvalue())
        self.assertIn("Mediapackage channel endpoint EP1 deleted", out.getvalue())
        self.assertIn("Mediapackage channel endpoint EP2 deleted", out.getvalue())
        self.assertIn("Mediapackage channel MP1 deleted", out.getvalue())
        out.close()
