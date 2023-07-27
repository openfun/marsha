"""Tests for the RetentionDateObjectMixin in the ``core`` app of the Marsha project."""
from datetime import date, datetime
from unittest.mock import Mock, patch

from django.test import TestCase, override_settings
from django.utils import timezone

from botocore.exceptions import ClientError

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

        self.mock_s3_utils = Mock()
        self.mock_s3_utils.update_expiration_date.return_value = {}

    def test_creation_of_retention_date_object_mixin(self):
        """
        Test the creation of models that inherit from RetentionDateObjectMixin.

        This function tests the behavior of updating the retention date of a `Video`
        object. It creates a `Video` object with a specified playlist and it asserts
        that the retention date is set correctly to the current time plus its playlist
        retention duration days.
        """
        with patch(
            "marsha.core.models.playlist.s3_utils", new=self.mock_s3_utils
        ), patch.object(timezone, "now", return_value=datetime(2022, 1, 1)):
            video = VideoFactory(playlist=self.playlist)

            self.assertEqual(video.retention_date, date(2022, 1, 31))
            self.mock_s3_utils.update_expiration_date.assert_not_called()

    def test_update_of_retention_date_object_mixin(self):
        """
        Test the update of models that inherit from RetentionDateObjectMixin.

        This function tests the behavior of updating the retention date of a `Video`
        object. The retention date should be a no call should be done.
        """
        video = VideoFactory(playlist=self.playlist)

        with patch(
            "marsha.core.models.playlist.s3_utils", new=self.mock_s3_utils
        ), patch.object(timezone, "now", return_value=datetime(2022, 1, 15)):
            video.retention_date = datetime(2022, 1, 1)
            video.save()
            video.refresh_from_db()

            self.assertEqual(video.retention_date, date(2022, 1, 1))
            self.mock_s3_utils.update_expiration_date.assert_not_called()

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
            "marsha.core.models.playlist.s3_utils", new=self.mock_s3_utils
        ), patch.object(timezone, "now", return_value=datetime(2022, 1, 1)):
            video.delete()
            video.refresh_from_db()

            self.mock_s3_utils.update_expiration_date.assert_called_once_with(
                str(video.pk), date(2022, 1, 16)
            )

    def test_soft_undelete_of_retention_date_object_mixin(self):
        """
        Test the soft delete of models that inherit from RetentionDateObjectMixin.

        This function tests the behavior of deleting a `Video`
        object. When deleted, it should call `s3_utils.update_expiration_date` with
        the an expiration date set to None.
        """
        video = VideoFactory(playlist=self.playlist)
        video.delete()

        with patch(
            "marsha.core.models.playlist.s3_utils", new=self.mock_s3_utils
        ), patch.object(timezone, "now", return_value=datetime(2022, 1, 1)):
            video.undelete()
            video.refresh_from_db()

            self.mock_s3_utils.update_expiration_date.assert_called_once_with(
                str(video.pk), None
            )

    def test_save_of_retention_date_object_mixin_exception(self):
        """
        Test of an exception occurring when saving using the RetentionDateObjectMixin.

        When mock_s3_utils.update_expiration_date raise an exception,
        it should not block the save of the `Video` object,
        and the exception should be logged.
        """

        self.mock_s3_utils.update_expiration_date.side_effect = ClientError(
            {"Error": {"Message": "Can't access the S3 API"}},
            "put_bucket_lifecycle_configuration",
        )

        with patch(
            "marsha.core.models.playlist.s3_utils", new=self.mock_s3_utils
        ), self.assertLogs("marsha.core.models", level="ERROR") as log:
            video = VideoFactory(playlist=self.playlist)

            video.delete()
            video.refresh_from_db()

            self.assertIn(
                "Error while updating expiration date in S3: An error occurred (Unknown) "
                "when calling the put_bucket_lifecycle_configuration operation: "
                "Can't access the S3 API",
                log.output[0],
            )
