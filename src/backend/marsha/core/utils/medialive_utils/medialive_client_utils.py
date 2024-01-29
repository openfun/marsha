"""Utils to create MediaLive configuration."""

from django.conf import settings

import boto3


aws_credentials = {
    "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
    "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
    "region_name": settings.AWS_S3_REGION_NAME,
}

# Configure medialive client
medialive_client = boto3.client("medialive", **aws_credentials)

# Configure mediapackage client
mediapackage_client = boto3.client("mediapackage", **aws_credentials)

# Configure SSM client
ssm_client = boto3.client("ssm", **aws_credentials)
