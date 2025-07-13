"""Test the ``rename_documents`` management command."""

from datetime import datetime, timezone
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from botocore.stub import Stubber

from marsha import settings
from marsha.core.defaults import AWS_S3, PENDING, READY, SCW_S3
from marsha.core.factories import DocumentFactory
from marsha.core.management.commands import rename_documents
from marsha.core.models.file import Document
from marsha.core.utils import time_utils


class RenameDocumentsTestCase(TestCase):
    """
    Test the ``rename_documents`` command.
    """

    @mock.patch("marsha.core.storage.storage_class.file_storage.exists")
    def test_rename_documents(self, mock_exists):
        """Command should rename document S3 objects to their filename."""

        mock_exists.return_value = False

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        with Stubber(rename_documents.s3_client) as s3_client_stubber:
            # Generate some documents
            # (<original filename>, <expected and cleaned>)
            filenames = [
                ("normal_filename.pdf", "normal_filename.pdf"),
                ("weird\\file/name.pdf", "weird_file_name.pdf"),
                (".hidden_file", "hidden_file"),
            ]

            documents = []
            for filename_src, _ in filenames:
                document = DocumentFactory(
                    filename=filename_src,
                    uploaded_on=now,
                    upload_state=READY,
                    storage_location=AWS_S3,
                )
                documents.append(document)

            # Create mocks for copy_objects with Stubber
            # Note: Stubber requires that its mocks are called in the exact order they
            # were created, so we must iterate over objects.all() in the same sequence
            for document in Document.objects.all():
                stamp = time_utils.to_timestamp(document.uploaded_on)
                extension = "." + document.extension if document.extension else ""

                file_key_src = f"aws/{document.id}/document/{stamp}{extension}"

                sanitized_filename = rename_documents.Command().validate_filename(
                    document.filename
                )
                file_key_dest = f"aws/{document.id}/document/{sanitized_filename}"

                expected_params = {
                    "Bucket": settings.STORAGE_S3_BUCKET_NAME,
                    "CopySource": {
                        "Bucket": settings.STORAGE_S3_BUCKET_NAME,
                        "Key": file_key_src,
                    },
                    "Key": file_key_dest,
                }
                s3_client_stubber.add_response("copy_object", {}, expected_params)

            # Create some documents that should not be concerned
            DocumentFactory(
                upload_state=READY,
                storage_location=SCW_S3,
            )
            DocumentFactory(
                upload_state=PENDING,
                storage_location=AWS_S3,
            )

            call_command("rename_documents")

            s3_client_stubber.assert_no_pending_responses()

            # Check that each document.filename has been updated with the clean
            # S3-compatible filename
            for document, (_, expected_filename) in zip(documents, filenames):
                document.refresh_from_db()
                assert document.filename == expected_filename

    @mock.patch("marsha.core.storage.storage_class.file_storage.exists")
    def test_rename_documents_file_exists(self, mock_exists):
        """Command should not copy document if file already exists."""

        mock_exists.return_value = True

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        DocumentFactory(
            filename="filename.pdf",
            uploaded_on=now,
        )

        with Stubber(rename_documents.s3_client) as s3_client_stubber:
            call_command("rename_documents")
            s3_client_stubber.assert_no_pending_responses()
