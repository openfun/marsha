"""Celery videos tasks for the core app."""


from marsha import settings
from marsha.celery_app import app
from marsha.core.defaults import (
    DELETED_VIDEOS_STORAGE_BASE_DIRECTORY,
    VOD_VIDEOS_STORAGE_BASE_DIRECTORY,
)
from marsha.core.utils.s3_utils import move_s3_directory


@app.task
def delete_s3_video(video_pk: str):
    """Deleting a video from S3 will first move it to the "to_delete" folder.
    This folder has a lifecycle policy that will expire the content after a certain period of time.
    A video can be stored on AWS S3 or on Videos S3.
    Doing so gives us some times to recover a video that was deleted.

    Args:
        video_pk (str): The video to delete on S3.
    """

    # Video on AWS_DESTINATION_BUCKET_NAME has {video_pk}/ as prefix
    move_s3_directory(
        video_pk,
        DELETED_VIDEOS_STORAGE_BASE_DIRECTORY,
        "AWS",
        settings.AWS_DESTINATION_BUCKET_NAME,
    )

    # Video on VIDEOS_STORAGE_S3 has {VOD_VIDEOS_STORAGE_BASE_DIRECTORY}/{video_pk}/ as prefix
    move_s3_directory(
        f"{VOD_VIDEOS_STORAGE_BASE_DIRECTORY}/{video_pk}",
        DELETED_VIDEOS_STORAGE_BASE_DIRECTORY,
        "VIDEOS_S3",
        settings.VIDEOS_STORAGE_S3_BUCKET_NAME,
    )
