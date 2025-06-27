"""Test the ``rename_classroom_documents`` management command."""

from datetime import datetime, timezone
from os.path import splitext
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from botocore.stub import Stubber

from marsha import settings
from marsha.bbb.factories import ClassroomDocumentFactory, ClassroomFactory
from marsha.bbb.management.commands import rename_classroom_documents
from marsha.bbb.models import ClassroomDocument
from marsha.core.utils import time_utils


class RenameClassroomDocumentsTestCase(TestCase):
    """
    Test the ``rename_classroom_documents`` command.
    """

    @mock.patch("marsha.core.storage.storage_class.file_storage.exists")
    def test_rename_classroom_documents(self, mock_exists):
        """Command should rename document S3 objects to their filename."""

        mock_exists.return_value = False

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        with Stubber(rename_classroom_documents.s3_client) as s3_client_stubber:
            # Generate some classroom documents
            # (<original filename>, <expected and cleaned>)
            filenames = [
                ("normal_filename.pdf", "normal_filename.pdf"),
                ("weird\\file/name.pdf", "weird_file_name.pdf"),
                (".hidden_file", "hidden_file"),
            ]

            documents = []
            for filename_src, _ in filenames:
                document = ClassroomDocumentFactory(
                    classroom=ClassroomFactory(),
                    filename=filename_src,
                    uploaded_on=now,
                )

                documents.append(document)

            # Create mocks for copy_objects with Stubber
            # Note: Stubber requires that its mocks are called in the exact order they
            # were created, so we must iterate over objects.all() in the same sequence
            for document in ClassroomDocument.objects.all():
                stamp = time_utils.to_timestamp(document.uploaded_on)
                extension = ""
                if "." in document.filename:
                    extension = splitext(document.filename)[1]

                file_key_src = (
                    f"aws/{document.classroom.id}/classroomdocument/"
                    f"{document.id}/{stamp}{extension}"
                )

                sanitized_filename = (
                    rename_classroom_documents.Command().validate_filename(
                        document.filename
                    )
                )
                file_key_dest = (
                    f"aws/{document.classroom.id}/classroomdocument/"
                    f"{document.id}/{sanitized_filename}"
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

            call_command("rename_classroom_documents")

            s3_client_stubber.assert_no_pending_responses()

            # Check that each document.filename has been updated with the clean
            # S3-compatible filename
            for document, (_, expected_filename) in zip(documents, filenames):
                document.refresh_from_db()
                assert document.filename == expected_filename

    @mock.patch("marsha.core.storage.storage_class.file_storage.exists")
    def test_rename_classroom_documents_file_exists(self, mock_exists):
        """Command should not copy document if file already exists."""

        mock_exists.return_value = True

        now = datetime(2018, 8, 8, tzinfo=timezone.utc)

        ClassroomDocumentFactory(
            classroom=ClassroomFactory(),
            filename="filename.pdf",
            uploaded_on=now,
        )

        with Stubber(rename_classroom_documents.s3_client) as s3_client_stubber:
            call_command("rename_classroom_documents")
            s3_client_stubber.assert_no_pending_responses()
