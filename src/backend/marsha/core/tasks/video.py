"""Celery videos tasks for the core app."""

from django_peertube_runner_connector.transcode import transcode_video
from sentry_sdk import capture_exception

from marsha.celery_app import app
from marsha.core.defaults import ERROR, TMP_VIDEOS_STORAGE_BASE_DIRECTORY
from marsha.core.models.video import Video


@app.task
def launch_video_transcoding(video_pk: str, stamp: str, domain: str):
    """Resize a thumbnail using video_storage.
    Args:
        video_pk (UUID): The video to transcode.
        stamp (str): The stamp at which the thumbnail was uploaded
        which will be used to find the key.
    """
    video = Video.objects.get(pk=video_pk)
    try:
        source = video.get_videos_storage_prefix(
            stamp, TMP_VIDEOS_STORAGE_BASE_DIRECTORY
        )
        prefix_destination = video.get_videos_storage_prefix(stamp)
        transcode_video(
            file_path=source,
            destination=prefix_destination,
            base_name=stamp,
            domain=domain,
        )
    except Exception as exception:  # pylint: disable=broad-except+
        capture_exception(exception)
        video.update_upload_state(ERROR, None)
