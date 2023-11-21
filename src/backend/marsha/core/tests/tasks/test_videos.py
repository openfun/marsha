"""Test for video celery tasks"""
# pylint: disable=protected-access
from unittest import mock

from django.test import TestCase

from marsha.core.factories import VideoFactory
from marsha.core.tasks.video import delete_s3_video


class TestVideoTask(TestCase):
    """
    Test for video celery tasks
    """

    def test_delete_s3_video(self):
        """
        Test the the delete_s3_video function. It should call the move_s3_directory
        that move the content of the video to the "deleted" folder for AWS and
        Videos S3 buckets.
        """
        video = VideoFactory()

        with mock.patch(
            "marsha.core.tasks.video.move_s3_directory"
        ) as mock_move_s3_directory:
            delete_s3_video(str(video.pk))
            mock_move_s3_directory.assert_has_calls(
                [
                    mock.call(
                        str(video.pk),
                        "deleted",
                        "AWS",
                        "test-marsha-destination",
                    ),
                    mock.call(
                        f"vod/{video.pk}",
                        "deleted",
                        "VIDEOS_S3",
                        "test-marsha",
                    ),
                ]
            )
