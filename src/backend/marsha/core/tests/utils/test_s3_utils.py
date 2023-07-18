"""Tests for the `core.s3_utils` module."""
from datetime import datetime
from unittest import mock

from django.test import TestCase

from botocore.exceptions import ClientError

from marsha.core.utils.s3_utils import update_expiration_date


class S3UtilsTestCase(TestCase):
    """Test the `s3_utils` functions."""

    def setUp(self):
        """
        Set up the test environment for the test case.
        """
        self.mock_s3_client = mock.Mock()
        self.mock_s3_client.get_bucket_lifecycle_configuration.return_value = {
            "Rules": []
        }
        self.mock_s3_client.put_bucket_lifecycle_configuration.return_value = {}

        self.mock_boto3_client = mock.Mock(return_value=self.mock_s3_client)

    def test_update_expiration_date_existing_rule(self):
        """
        Test the update_expiration_date function with an existing rule.
        """
        self.mock_s3_client.get_bucket_lifecycle_configuration.return_value = {
            "Rules": [
                {
                    "ID": "test_key",
                    "Filter": {"Prefix": "test_key"},
                    "Status": "Enabled",
                    "Expiration": {"Date": "2022-01-01"},
                },
                {
                    "ID": "test_key2",
                    "Filter": {"Prefix": "test_key2"},
                    "Status": "Enabled",
                    "Expiration": {"Date": "2022-02-02"},
                },
            ]
        }

        with mock.patch("boto3.client", return_value=self.mock_s3_client):
            update_expiration_date("test_key", datetime(2022, 12, 31))

        self.mock_s3_client.put_bucket_lifecycle_configuration.assert_called_once_with(
            Bucket="test-marsha-destination",
            LifecycleConfiguration={
                "Rules": [
                    {
                        "ID": "test_key",
                        "Filter": {"Prefix": "test_key"},
                        "Status": "Enabled",
                        "Expiration": {"Date": "2022-12-31"},
                    },
                    {
                        "ID": "test_key2",
                        "Filter": {"Prefix": "test_key2"},
                        "Status": "Enabled",
                        "Expiration": {"Date": "2022-02-02"},
                    },
                ]
            },
        )

    def test_update_with_no_expiration_date_existing_rule(self):
        """
        Test the update_expiration_date function with an existing rule.
        """
        self.mock_s3_client.get_bucket_lifecycle_configuration.return_value = {
            "Rules": [
                {
                    "ID": "test_key",
                    "Filter": {"Prefix": "test_key"},
                    "Status": "Enabled",
                    "Expiration": {"Date": "2022-01-01"},
                },
                {
                    "ID": "test_key2",
                    "Filter": {"Prefix": "test_key2"},
                    "Status": "Enabled",
                    "Expiration": {"Date": "2022-02-02"},
                },
            ]
        }

        with mock.patch("boto3.client", return_value=self.mock_s3_client):
            update_expiration_date("test_key", None)

        self.mock_s3_client.put_bucket_lifecycle_configuration.assert_called_once_with(
            Bucket="test-marsha-destination",
            LifecycleConfiguration={
                "Rules": [
                    {
                        "ID": "test_key2",
                        "Filter": {"Prefix": "test_key2"},
                        "Status": "Enabled",
                        "Expiration": {"Date": "2022-02-02"},
                    },
                ]
            },
        )

    def test_update_expiration_date_new_rule(self):
        """
        Test the update_expiration_date function with a new rule.
        """
        with mock.patch("boto3.client", return_value=self.mock_s3_client):
            update_expiration_date("test_key", datetime(2022, 12, 31))

        self.mock_s3_client.put_bucket_lifecycle_configuration.assert_called_once_with(
            Bucket="test-marsha-destination",
            LifecycleConfiguration={
                "Rules": [
                    {
                        "ID": "test_key",
                        "Filter": {"Prefix": "test_key"},
                        "Status": "Enabled",
                        "Expiration": {"Date": "2022-12-31"},
                    }
                ]
            },
        )

    def test_update_with_no_expiration_date_new_rule(self):
        """
        Test the update_expiration_date function with a new rule.
        """
        with mock.patch("boto3.client", return_value=self.mock_s3_client):
            update_expiration_date("test_key", None)

        self.mock_s3_client.put_bucket_lifecycle_configuration.assert_called_once_with(
            Bucket="test-marsha-destination",
            LifecycleConfiguration={"Rules": []},
        )

    def test_update_expiration_date_no_lifecycle_configuration(self):
        """
        Test for updating the expiration date without a lifecycle configuration.
        """
        self.mock_s3_client.get_bucket_lifecycle_configuration.side_effect = ClientError(
            {
                "Error": {
                    "Code": "NoSuchLifecycleConfiguration",
                    "Message": "The bucket does not have a lifecycle configuration.",
                }
            },
            "get_bucket_lifecycle_configuration",
        )
        with mock.patch("boto3.client", return_value=self.mock_s3_client):
            update_expiration_date("test_key", datetime(2022, 12, 31))

        self.mock_s3_client.put_bucket_lifecycle_configuration.assert_called_once_with(
            Bucket="test-marsha-destination",
            LifecycleConfiguration={
                "Rules": [
                    {
                        "ID": "test_key",
                        "Filter": {"Prefix": "test_key"},
                        "Status": "Enabled",
                        "Expiration": {"Date": "2022-12-31"},
                    }
                ]
            },
        )
