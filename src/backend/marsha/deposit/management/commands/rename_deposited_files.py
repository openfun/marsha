"""Rename deposited files in Scaleway S3 for serving them with the right name."""

import logging

from django.conf import settings
from django.core.management.base import BaseCommand

import boto3

from marsha.core.defaults import AWS_S3, AWS_STORAGE_BASE_DIRECTORY, READY
from marsha.core.storage.storage_class import file_storage
from marsha.core.utils import time_utils
from marsha.deposit.models import DepositedFile


logger = logging.getLogger(__name__)

scw_credentials = {
    "aws_access_key_id": settings.STORAGE_S3_ACCESS_KEY,
    "aws_secret_access_key": settings.STORAGE_S3_SECRET_KEY,
    "region_name": settings.STORAGE_S3_REGION_NAME,
    "endpoint_url": settings.STORAGE_S3_ENDPOINT_URL,
}

# Configure medialive client
s3_client = boto3.client("s3", **scw_credentials)


class Command(BaseCommand):
    """Rename deposited files in Scaleway S3 to their filename."""

    help = "Rename deposited files in Scaleway S3 to their filename."

    def validate_filename(self, value):
        """Transform filename to make it valid."""

        value = value.replace("/", "_")
        value = value.replace("\\", "_")
        value = value.lstrip(".")

        return value

    def handle(self, *args, **options):
        """Execute management command."""

        files = DepositedFile.objects.filter(
            storage_location=AWS_S3, upload_state=READY
        )

        for file in files:
            # Get the file stored on Scaleway S3 under `aws/`
            stamp = time_utils.to_timestamp(file.uploaded_on)
            extension = "." + file.extension if file.extension else ""

            file_key_src = file.get_storage_key(
                filename=f"{stamp}{extension}", base_dir=AWS_STORAGE_BASE_DIRECTORY
            )
            copy_source = {
                "Bucket": settings.STORAGE_S3_BUCKET_NAME,
                "Key": file_key_src,
            }

            filename = self.validate_filename(file.filename)

            # Override file filename with the validated S3-compatible filename
            if filename != file.filename:
                file.filename = filename
                file.save()

            # Compute file key destination which should be the document filename
            file_key_dest = file.get_storage_key(
                filename, base_dir=AWS_STORAGE_BASE_DIRECTORY
            )
            if file_storage.exists(file_key_dest):
                logger.info("Object %s already exists", file_key_dest)
                continue

            logger.info("Copying %s to %s", file_key_src, file_key_dest)
            s3_client.copy_object(
                Bucket=settings.STORAGE_S3_BUCKET_NAME,
                CopySource=copy_source,
                Key=file_key_dest,
            )

        logger.info("Finished copying!")
