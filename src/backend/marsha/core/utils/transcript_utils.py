"""Utils related to transcoding"""

from django.conf import settings
from django.contrib.sites.models import Site
from django.db import IntegrityError
from django.urls import reverse

from django_peertube_runner_connector.models import Video as TranscriptedVideo

from marsha.core import defaults
from marsha.core.models import TimedTextTrack, Video
from marsha.core.storage.storage_class import video_storage
from marsha.core.tasks.video import launch_video_transcript
from marsha.core.utils.time_utils import to_datetime
from marsha.websocket.utils import channel_layers_utils


class TranscriptError(Exception):
    """Error raised when an error occurs during the transcript process"""


def transcript(video):
    """Create a transcript for a video."""
    if not video:
        raise TranscriptError("No video to transcript")

    try:
        TimedTextTrack.objects.create(
            video=video,
            language=settings.LANGUAGES[0][0],
            mode=TimedTextTrack.TRANSCRIPT,
            upload_state=defaults.PROCESSING,
        )
    except IntegrityError as e:
        raise TranscriptError(
            f"A transcript already exists for video {video.id}"
        ) from e

    domain = (
        settings.TRANSCODING_CALLBACK_DOMAIN
        or f"https://{Site.objects.get_current().domain}"
    )

    transcript_args = {
        "video_pk": video.id,
        "stamp": video.uploaded_on_stamp(),
        "domain": domain,
    }

    if video.transcode_pipeline != defaults.PEERTUBE_PIPELINE:
        transcript_args["video_url"] = domain + reverse(
            "videos-transcript-source", kwargs={"pk": video.id}
        )

    launch_video_transcript.delay(**transcript_args)


def transcription_ended_callback(
    transcripted_video: TranscriptedVideo, language: str, vtt_path: str
):
    """
    Callback used when a Peertube runner has finished to transcript a video.

    Parameters
    ----------
    transcripted_video : Type[TranscriptedVideo]
        The transcripted video (The video as a django_peertube_runner_connector Video model).
    language : str
        The language of the transcript
    vtt_path : str
        The path to the VTT file
    """
    # Directory format: "vod/<video_id>/video/<stamp>"
    directory = transcripted_video.directory.split("/")
    uploaded_on = directory[-1]
    video_id = directory[-3]
    video = Video.objects.get(pk=video_id)

    timed_text_track, created = video.timedtexttracks.get_or_create(
        upload_state=defaults.PROCESSING,
        mode=TimedTextTrack.TRANSCRIPT,
        defaults={
            "language": language,
            "extension": "vtt",
            "uploaded_on": to_datetime(uploaded_on),
            "upload_state": defaults.READY,
        },
    )
    if not created:
        timed_text_track.upload_state = defaults.READY
        timed_text_track.uploaded_on = to_datetime(uploaded_on)
        timed_text_track.language = language
        timed_text_track.extension = "vtt"
        timed_text_track.save()

    with video_storage.open(vtt_path, "rt") as vtt_file:
        base = timed_text_track.get_videos_storage_prefix()

        video_storage.save(f"{base}/source.{timed_text_track.extension}", vtt_file)
        video_storage.save(
            f"{base}/{uploaded_on}.{timed_text_track.extension}", vtt_file
        )

    channel_layers_utils.dispatch_timed_text_track(timed_text_track)
    channel_layers_utils.dispatch_video(video)
