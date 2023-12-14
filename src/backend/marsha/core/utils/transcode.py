""" Utils related to transcoding """
from django_peertube_runner_connector.models import Video as TranscodedVideo, VideoState

from marsha.core.defaults import ERROR, PEERTUBE_PIPELINE, READY
from marsha.core.models.video import Video
from marsha.core.utils.time_utils import to_datetime


def transcoding_ended_callback(transcoded_video: TranscodedVideo):
    """
    Callback used when the a Peertube runnner has finished
    to transcode a video.

    Parameters
    ----------
    transcoded_video : Type[TranscodedVideo]
        The transcoded video (The video a django_peertube_runner_connector Video model).

    """
    # Directory format: "vod/<video_id>/video/<stamp>"
    directory = transcoded_video.directory.split("/")
    uploaded_on = directory[-1]
    video_id = directory[-3]
    video = Video.objects.get(pk=video_id)

    if transcoded_video.state == VideoState.TRANSCODING_FAILED:
        video.update_upload_state(ERROR, None)
        return

    resolutions = [
        x.resolution for x in transcoded_video.streamingPlaylist.videoFiles.all()
    ]
    video.transcode_pipeline = PEERTUBE_PIPELINE
    video.save(update_fields=["transcode_pipeline"])

    video.update_upload_state(
        READY,
        to_datetime(uploaded_on),
        **{"resolutions": resolutions},
    )
