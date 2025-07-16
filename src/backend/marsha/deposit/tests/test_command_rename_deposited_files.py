"""Test the ``rename_deposited_files`` management command."""

from datetime import datetime, timezone
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from botocore.stub import Stubber

from marsha import settings
from marsha.core.defaults import AWS_S3, PENDING, READY, SCW_S3
from marsha.core.utils import time_utils
from marsha.deposit.factories import DepositedFileFactory
from marsha.deposit.management.commands import rename_deposited_files
from marsha.deposit.models import DepositedFile


class RenameDepositedFilesTestCase(TestCase):
    """
    Test the ``rename_deposited_files`` command.
    """

    @mock.patch("marsha.core.storage.storage_class.file_storage.exists")
    def test_rename_deposited_files(self, mock_exists):
        """Command should rename S3 objects to their filename."""

        mock_exists.return_value = False

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        with Stubber(rename_deposited_files.s3_client) as s3_client_stubber:
            # Generate some classroom files
            # (<original filename>, <expected and cleaned>)
            filenames = [
                ("normal_filename.pdf", "normal_filename.pdf"),
                ("weird\\file/name.pdf", "weird_file_name.pdf"),
                (".hidden_file", "hidden_file"),
            ]

            files = []
            for filename_src, _ in filenames:
                file = DepositedFileFactory(
                    filename=filename_src,
                    extension="pdf",
                    uploaded_on=now,
                    upload_state=READY,
                    storage_location=AWS_S3,
                )
                files.append(file)

            # Create mocks for copy_objects with Stubber
            # Note: Stubber requires that its mocks are called in the exact order they
            # were created, so we must iterate over objects.all() in the same sequence
            for file in DepositedFile.objects.all():
                stamp = time_utils.to_timestamp(file.uploaded_on)
                extension = "." + file.extension if file.extension else ""

                file_key_src = (
                    f"aws/{file.file_depository.id}/depositedfile/"
                    f"{file.id}/{stamp}{extension}"
                )

                sanitized_filename = rename_deposited_files.Command().validate_filename(
                    file.filename
                )
                file_key_dest = (
                    f"aws/{file.file_depository.id}/depositedfile/"
                    f"{file.id}/{sanitized_filename}"
                )

                expected_params = {
                    "Bucket": settings.STORAGE_S3_BUCKET_NAME,
                    "CopySource": {
                        "Bucket": settings.STORAGE_S3_BUCKET_NAME,
                        "Key": file_key_src,
                    },
                    "Key": file_key_dest,
                }
                s3_client_stubber.add_response("copy_object", {}, expected_params)

            # Create some classroom files that should not be concerned
            DepositedFileFactory(
                upload_state=READY,
                storage_location=SCW_S3,
            )
            DepositedFileFactory(
                upload_state=PENDING,
                storage_location=AWS_S3,
            )

            call_command("rename_deposited_files")

            s3_client_stubber.assert_no_pending_responses()

            # Check that each file.filename has been updated with the clean
            # S3-compatible filename
            for file, (_, expected_filename) in zip(files, filenames):
                file.refresh_from_db()
                assert file.filename == expected_filename

    @mock.patch("marsha.core.storage.storage_class.file_storage.exists")
    def test_rename_deposited_files_file_exists(self, mock_exists):
        """Command should not copy file if file already exists."""

        mock_exists.return_value = True

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        DepositedFileFactory(
            filename="filename.pdf",
            uploaded_on=now,
        )

        with Stubber(rename_deposited_files.s3_client) as s3_client_stubber:
            call_command("rename_deposited_files")
            s3_client_stubber.assert_no_pending_responses()
