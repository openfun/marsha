"""Test for shared live media celery tasks"""

# pylint: disable=protected-access

from io import BytesIO
from unittest import mock

from django.core.files.base import ContentFile
from django.test import TestCase

import fitz  # PyMuPDF

from marsha.core.defaults import CELERY_PIPELINE, ERROR, TMP_STORAGE_BASE_DIRECTORY
from marsha.core.factories import SharedLiveMediaFactory
from marsha.core.storage.storage_class import file_storage
from marsha.core.tasks.shared_live_media import convert_shared_live_media


class TestSharedLiveMediaTask(TestCase):
    """
    Test for shared live media celery tasks
    """

    def test_shared_live_media(self):
        """
        Test the the convert_shared_live_media function. It should create
        a 4 svg for a pdf file of 4 pages.
        """
        shared_live_media = SharedLiveMediaFactory()
        stamp = "1640995200"

        # Create Fake PDF file
        with BytesIO() as buffer:
            doc = fitz.Document()
            for _ in range(4):
                doc.new_page()
            doc.save(buffer)
            content_file = ContentFile(buffer.getvalue())
            file_storage.save(
                shared_live_media.get_storage_prefix(stamp, TMP_STORAGE_BASE_DIRECTORY),
                content_file,
            )

        for page_number in range(1, 4):
            self.assertFalse(
                file_storage.exists(
                    f"{shared_live_media.get_storage_prefix(stamp)}/"
                    f"{stamp}_{page_number}.svg"
                )
            )

        self.assertFalse(
            file_storage.exists(
                f"{shared_live_media.get_storage_prefix(stamp)}/{stamp}.pdf"
            )
        )

        convert_shared_live_media(str(shared_live_media.pk), stamp)

        for page_number in range(1, 4):
            self.assertTrue(
                file_storage.exists(
                    f"{shared_live_media.get_storage_prefix(stamp)}/"
                    f"{stamp}_{page_number}.svg"
                )
            )
        self.assertTrue(
            file_storage.exists(
                f"{shared_live_media.get_storage_prefix(stamp)}/{stamp}.pdf"
            )
        )
        shared_live_media.refresh_from_db()
        self.assertEqual(shared_live_media.process_pipeline, CELERY_PIPELINE)

    def test_shared_live_media_with_error(self):
        """
        Test the the convert_shared_live_media function. It should fail, update
        the upload state to ERROR and capture the exception.
        """
        shared_live_media = SharedLiveMediaFactory()
        stamp = "1640995200"

        # Create Fake PDF file
        with BytesIO() as buffer:
            doc = fitz.Document()
            for _ in range(4):
                doc.new_page()
            doc.save(buffer)
            content_file = ContentFile(buffer.getvalue())
            file_storage.save(
                shared_live_media.get_storage_prefix(stamp, TMP_STORAGE_BASE_DIRECTORY),
                content_file,
            )

        with (
            mock.patch(
                "marsha.core.tasks.shared_live_media.fitz.open", side_effect=Exception
            ),
            mock.patch(
                "marsha.core.tasks.shared_live_media.capture_exception"
            ) as mock_capture_exception,
        ):
            convert_shared_live_media(str(shared_live_media.pk), stamp)
            shared_live_media.refresh_from_db()
            self.assertEqual(shared_live_media.upload_state, ERROR)
            mock_capture_exception.assert_called_once()
