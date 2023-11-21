"""Tests for the `core.s3_utils` module."""
from unittest import mock

from django.test import TestCase

from marsha.core.utils.s3_utils import (
    get_aws_s3_client,
    get_s3_client,
    get_videos_s3_client,
    move_s3_directory,
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

    def test_s3_move_directory(self):
        """
        Test the move_s3_directory with existing files. It should list,
        copy, and delete files.
        """
        mock_s3_client = mock.Mock()

        mock_s3_client.list_objects_v2.return_value = {
            "IsTruncated": False,
            "Contents": [
                {
                    "Key": "example1.txt",
                    "LastModified": "2015-01-01 00:00:00",
                    "ETag": '"example1etag"',
                    "Size": 100,
                    "StorageClass": "STANDARD",
                },
                {
                    "Key": "example2.txt",
                    "LastModified": "2015-01-01 00:00:00",
                    "ETag": '"example2etag"',
                    "Size": 200,
                    "StorageClass": "STANDARD",
                },
            ],
            "Name": "mybucket",
            "Prefix": "",
            "MaxKeys": 1000,
            "CommonPrefixes": [],
            "KeyCount": 2,
            "ResponseMetadata": {
                "RequestId": "example3id",
                "HostId": "example4id",
                "HTTPStatusCode": 200,
                "HTTPHeaders": {
                    "x-amz-id-2": "example5id",
                    "x-amz-request-id": "example6id",
                    "date": "Wed, 21 Oct 2015 20:33:07 GMT",
                    "x-amz-bucket-region": "us-west-2",
                    "content-type": "application/xml",
                    "transfer-encoding": "chunked",
                    "server": "AmazonS3",
                },
                "RetryAttempts": 0,
            },
        }

        with mock.patch(
            "marsha.core.utils.s3_utils.get_s3_client", return_value=mock_s3_client
        ):
            move_s3_directory("test_key", "destination", "AWS", "test-bucket")
            mock_s3_client.list_objects_v2.assert_called_once_with(
                Bucket="test-bucket", Prefix="test_key"
            )

            mock_s3_client.copy.assert_has_calls(
                [
                    mock.call(
                        {"Bucket": "test-bucket", "Key": "example1.txt"},
                        "test-bucket",
                        "destination/example1.txt",
                    ),
                    mock.call(
                        {"Bucket": "test-bucket", "Key": "example2.txt"},
                        "test-bucket",
                        "destination/example2.txt",
                    ),
                ]
            )

            mock_s3_client.delete_objects.assert_called_once_with(
                Bucket="test-bucket",
                Delete={
                    "Objects": [
                        {"Key": "example1.txt"},
                        {"Key": "example2.txt"},
                    ]
                },
            )

    def test_s3_move_directory_with_no_content(self):
        """
        Test the move_s3_directory with no content. It should list,
        and do nothing.
        """
        mock_s3_client = mock.Mock()

        mock_s3_client.list_objects_v2.return_value = {
            "IsTruncated": False,
            "Name": "mybucket",
            "Prefix": "",
            "MaxKeys": 1000,
            "CommonPrefixes": [],
            "KeyCount": 0,
            "ResponseMetadata": {
                "RequestId": "example3id",
                "HostId": "example4id",
                "HTTPStatusCode": 200,
                "HTTPHeaders": {
                    "x-amz-id-2": "example5id",
                    "x-amz-request-id": "example6id",
                    "date": "Wed, 21 Oct 2015 20:33:07 GMT",
                    "x-amz-bucket-region": "us-west-2",
                    "content-type": "application/xml",
                    "transfer-encoding": "chunked",
                    "server": "AmazonS3",
                },
                "RetryAttempts": 0,
            },
        }

        with mock.patch(
            "marsha.core.utils.s3_utils.get_s3_client", return_value=mock_s3_client
        ):
            move_s3_directory("test_key", "destination", "AWS", "test-bucket")
            mock_s3_client.list_objects_v2.assert_called_once_with(
                Bucket="test-bucket", Prefix="test_key"
            )

            mock_s3_client.copy.assert_not_called()
            mock_s3_client.delete_objects.assert_not_called()
