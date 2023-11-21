"""Tests for the RetentionDateObjectMixin in the ``core`` app of the Marsha project."""
from datetime import date, datetime, timezone as baseTimezone
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from django.utils import timezone

from marsha.core.factories import PlaylistFactory, VideoFactory


# pylint: disable=too-many-public-methods


class RetentionDateObjectMixinTextCase(TestCase):
    """Test our intentions about the RetentionDateObjectMixin."""

    def setUp(self):
        """
        Set up the test case by initializing the playlist with a retention duration of 30 days.
        Also, create a mock object for the S3 utilities.
        """
        self.playlist = PlaylistFactory(
            retention_duration=30,
        )

        self.mock_delete_s3_video = Mock()

    def test_creation_of_retention_date_object_mixin(self):
        """
        Test the creation of models that inherit from RetentionDateObjectMixin.

        This function tests the behavior of updating the retention date of a `Video`
        object. It creates a `Video` object with a specified playlist, and it asserts
        that the retention date is set correctly to the current time plus its playlist
        retention duration days.
        """
        with patch.object(
            timezone, "now", return_value=datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        ):
            video = VideoFactory(playlist=self.playlist)

            self.assertEqual(video.retention_date, date(2022, 1, 31))

    def test_update_of_retention_date_object_mixin(self):
        """
        Test the update of models that inherit from RetentionDateObjectMixin.

        This function tests the behavior of updating the retention date of a `Video`
        object. It should do nothing but updating the field
        """
        video = VideoFactory(playlist=self.playlist)

        with patch(
            "marsha.core.models.playlist.delete_s3_video", new=self.mock_delete_s3_video
        ), patch.object(
            timezone, "now", return_value=datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        ):
            video.retention_date = datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
            video.save()
            video.refresh_from_db()

            self.assertEqual(video.retention_date, date(2022, 1, 1))
            self.mock_delete_s3_video.delay.assert_not_called()

    @override_settings(AWS_S3_EXPIRATION_DURATION=15)
    def test_soft_delete_of_retention_date_object_mixin(self):
        """
        Test the soft delete of models that inherit from RetentionDateObjectMixin.

        This function tests the behavior of deleting a `Video`
        object. When deleted, it should call `s3_utils.update_expiration_date` with
        the retention date set to the current time + AWS_S3_EXPIRATION_DURATION.
        """

        video = VideoFactory(playlist=self.playlist)

        with patch(
            "marsha.core.models.playlist.delete_s3_video", new=self.mock_delete_s3_video
        ), patch.object(
            timezone, "now", return_value=datetime(2022, 1, 1, tzinfo=baseTimezone.utc)
        ):
            video.delete()
            video.refresh_from_db()

            self.mock_delete_s3_video.delay.assert_called_once_with(str(video.pk))
