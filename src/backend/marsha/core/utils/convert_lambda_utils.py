"""Utils for invoking AWS lambda convert."""

import json

from django.conf import settings

import boto3
from botocore.client import Config


lambda_client = boto3.client(
    "lambda",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    config=Config(
        region_name=settings.AWS_S3_REGION_NAME,
        signature_version="s3v4",
    ),
)


def invoke_lambda_convert(record_url, vod_key):
    """Invoke the lambda function to convert the uploaded file."""
    return lambda_client.invoke(
        FunctionName=f"{settings.AWS_BASE_NAME}-marsha-convert",
        InvocationType="Event",
        Payload=json.dumps(
            {
                "type": "convertClassroomRecording",
                "parameters": {
                    "recordUrl": record_url,
                    "vodKey": vod_key,
                    "sourceBucket": settings.AWS_SOURCE_BUCKET_NAME,
                },
            }
        ).encode(),
    )
