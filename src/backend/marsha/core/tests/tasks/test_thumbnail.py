"""Test for thumbnail celery tasks"""

# pylint: disable=protected-access
from io import BytesIO
from unittest import mock

from django.core.files.base import ContentFile
from django.test import TestCase

from PIL import Image

from marsha.core.defaults import (
    CELERY_PIPELINE,
    ERROR,
    TMP_STORAGE_BASE_DIRECTORY,
)
from marsha.core.factories import ThumbnailFactory
from marsha.core.storage.storage_class import file_storage
from marsha.core.tasks.thumbnail import resize_thumbnails


class TestThumbnailTask(TestCase):
    """
    Test for thumbnail celery tasks
    """

    def test_resize_thumbnails_task(self):
        """
        Test the the test_resize_thumbnails function. It should create
        different thumbnails for different sizes from the original image.
        """
        thumbnail = ThumbnailFactory()
        image = Image.new("RGBA", size=(1080, 1080), color=(256, 0, 0))
        stamp = "1640995200"
        with BytesIO() as buffer:
            image.save(buffer, "PNG")
            content_file = ContentFile(buffer.getvalue())
            file_storage.save(
                thumbnail.get_storage_prefix(stamp, TMP_STORAGE_BASE_DIRECTORY),
                content_file,
            )
        sizes = [1080, 720, 480, 240, 144]
        for size in sizes:
            self.assertFalse(
                file_storage.exists(f"{thumbnail.get_storage_prefix(stamp)}/{size}.jpg")
            )

        resize_thumbnails(str(thumbnail.pk), stamp)

        for size in sizes:
            self.assertTrue(
                file_storage.exists(f"{thumbnail.get_storage_prefix(stamp)}/{size}.jpg")
            )
        thumbnail.refresh_from_db()
        self.assertEqual(thumbnail.process_pipeline, CELERY_PIPELINE)

    def test_resize_thumbnails_task_with_error(self):
        """
        Test the the test_resize_thumbnails function. It should fail, updated
        the upload state to ERROR and capture the exception.
        """
        thumbnail = ThumbnailFactory()
        image = Image.new("RGBA", size=(1080, 1080), color=(256, 0, 0))
        stamp = "1640995200"
        with BytesIO() as buffer:
            image.save(buffer, "PNG")
            content_file = ContentFile(buffer.getvalue())
            file_storage.save(
                thumbnail.get_storage_prefix(stamp, TMP_STORAGE_BASE_DIRECTORY),
                content_file,
            )
        sizes = [1080, 720, 480, 240, 144]
        for size in sizes:
            self.assertFalse(
                file_storage.exists(f"{thumbnail.get_storage_prefix(stamp)}/{size}.jpg")
            )
        with (
            mock.patch("marsha.core.tasks.thumbnail.Image.open", side_effect=Exception),
            mock.patch(
                "marsha.core.tasks.thumbnail.capture_exception"
            ) as mock_capture_exception,
        ):
            resize_thumbnails(str(thumbnail.pk), stamp)

            thumbnail.refresh_from_db()
            mock_capture_exception.assert_called_once()
            self.assertEqual(thumbnail.upload_state, ERROR)
