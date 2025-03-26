"""Utils for invoking SCW serverless function transfer."""

import json
from django.conf import settings

import boto3

sqs_client = boto3.client(
    "sqs",
    endpoint_url="https://sqs.mnq.fr-par.scaleway.com",
    aws_access_key_id=settings.SCW_QUEUE_ACCESS_KEY,
    aws_secret_access_key=settings.SCW_QUEUE_SECRET_KEY,
    region_name="fr-par",
)


def invoke_function_transfer(record_url, vod_key):
    """Invoke the Scaleway serverless function to transfer the BBB recording."""

    return sqs_client.send_message(
        QueueUrl=settings.SCW_QUEUE_TRANSFER_URL,
        MessageBody=json.dumps(
            {
                "recordUrl": record_url,
                "vodKey": vod_key,
                "bucket": settings.VIDEOS_STORAGE_S3_BUCKET_NAME,
            },
        ),
    )
