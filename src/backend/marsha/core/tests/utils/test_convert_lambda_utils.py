"""Test convert_lambda utils functions."""

import json

from django.test import TestCase, override_settings

from botocore.stub import Stubber

from marsha.core.utils import convert_lambda_utils


@override_settings(
    AWS_ACCESS_KEY_ID="test",
    AWS_SECRET_ACCESS_KEY="test",
    AWS_S3_REGION_NAME="us-east-1",
    AWS_BASE_NAME="test",
    AWS_SOURCE_BUCKET_NAME="test-source-bucket",
)
class ConvertLambdaUtilsTestCase(TestCase):
    """Test convert_lambda utils."""

    def test_invoke_lambda_convert(self):
        """Test invoke_lambda_convert."""
        invoke_lambda_response = {
            "ResponseMetadata": {
                "RequestId": "0709f4e9-c3a5-4677-b503-6c06712020a9",
                "HTTPStatusCode": 202,
                "HTTPHeaders": {
                    "date": "Tue, 09 May 2023 08:20:57 GMT",
                    "content-length": "0",
                    "connection": "keep-alive",
                    "x-amzn-requestid": "0709f4e9-c3a5-4677-b503-6c06712020a9",
                    "x-amzn-remapped-content-length": "0",
                    "x-amzn-trace-id": "root=1-645a0269-14f44fa13ed3718b470ab7d7;sampled=0",
                },
                "RetryAttempts": 0,
            },
            "StatusCode": 202,
            "Payload": b"",
        }

        with Stubber(convert_lambda_utils.lambda_client) as lambda_stubber:
            lambda_stubber.add_response(
                "invoke",
                service_response=invoke_lambda_response,
                expected_params={
                    "FunctionName": "test-marsha-convert",
                    "InvocationType": "Event",
                    "Payload": json.dumps(
                        {
                            "type": "convertClassroomRecording",
                            "parameters": {
                                "recordUrl": "record_url",
                                "vodKey": "vod_key",
                                "sourceBucket": "test-source-bucket",
                            },
                        }
                    ).encode(),
                },
            )

            response = convert_lambda_utils.invoke_lambda_convert(
                "record_url", "vod_key"
            )

            lambda_stubber.assert_no_pending_responses()
            self.assertEqual(response, invoke_lambda_response)
