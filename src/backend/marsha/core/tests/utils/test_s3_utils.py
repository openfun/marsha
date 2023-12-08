"""Tests for the `core.s3_utils` module."""
from datetime import datetime
from unittest import mock

from django.test import TestCase

from botocore.exceptions import ClientError

from marsha.core.utils.s3_utils import (
    get_aws_s3_client,
    get_s3_client,
    get_videos_s3_client,
    update_expiration_date,
)


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

    def test_get_aws_s3_client(self):
        """
        Should instantiate a s3 client with AWS config
        """

        mocked_config = mock.Mock()
        with mock.patch(
            "boto3.client", return_value=self.mock_s3_client
        ) as mock_boto3_client, mock.patch(
            "marsha.core.utils.s3_utils.Config", return_value=mocked_config
        ) as mock_config:
            client = get_aws_s3_client()

        self.assertEqual(client, self.mock_s3_client)
        mock_boto3_client.assert_called_once_with(
            "s3",
            aws_access_key_id="aws-access-key-id",
            aws_secret_access_key="aws-secret-access-key",
            config=mocked_config,
        )
        mock_config.assert_called_once_with(
            region_name="eu-west-1",
            signature_version="s3v4",
        )

    def test_get_videos_s3_client(self):
        """
        Should instantiate a s3 client with a Scaleway config
        """

        mocked_config = mock.Mock()
        with mock.patch(
            "boto3.client", return_value=self.mock_s3_client
        ) as mock_boto3_client, mock.patch(
            "marsha.core.utils.s3_utils.Config", return_value=mocked_config
        ) as mock_config:
            client = get_videos_s3_client()

        self.assertEqual(client, self.mock_s3_client)
        mock_boto3_client.assert_called_once_with(
            "s3",
            aws_access_key_id="scw-access-key",
            aws_secret_access_key="scw-secret-key",
            endpoint_url="https://s3.fr-par.scw.cloud",
            config=mocked_config,
        )
        mock_config.assert_called_once_with(
            region_name="fr-par",
            signature_version="s3v4",
        )

    def test_get_s3_client_with_aws_parameter(self):
        """
        Should call get_s3_aws_client function
        """

        with mock.patch(
            "marsha.core.utils.s3_utils.get_aws_s3_client"
        ) as mock_get_s3_aws_client:
            get_s3_client("AWS")

            mock_get_s3_aws_client.assert_called_once()

    def test_get_s3_client_with_videos_s3_parameter(self):
        """
        Should call get_videos_s3_client function
        """

        with mock.patch(
            "marsha.core.utils.s3_utils.get_videos_s3_client"
        ) as mock_get_videos_s3_client:
            get_s3_client("VIDEOS_S3")

            mock_get_videos_s3_client.assert_called_once()

    def test_get_s3_client_with_unknown_parameter(self):
        """
        Should return an error
        """

        try:
            get_s3_client("unknown")
        except ValueError as error:
            self.assertEqual(
                str(error),
                "Unknown s3 client type: unknown",
            )

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
