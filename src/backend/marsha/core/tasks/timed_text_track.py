"""Celery timed text track tasks for the core app."""

from html import escape, unescape

from django.core.files.base import ContentFile

from pycaption import (
    CaptionNode,
    DFXPReader,
    MicroDVDReader,
    SAMIReader,
    SCCReader,
    SRTReader,
    WebVTTReader,
    WebVTTWriter,
    detect_format,
)
from sentry_sdk import capture_exception

from marsha.celery_app import app
from marsha.core.defaults import (
    CELERY_PIPELINE,
    ERROR,
    READY,
    TMP_VIDEOS_STORAGE_BASE_DIRECTORY,
)
from marsha.core.models import TimedTextTrack
from marsha.core.storage.storage_class import video_storage
from marsha.core.utils.time_utils import to_datetime


class ReaderNotImplementedError(NotImplementedError):
    """Reader not implemented error."""


def _convert_timed_text_track_file(reader, timed_text_track_file):
    """Convert a timed text track from any format into a vtt."""
    return WebVTTWriter().write(reader().read(timed_text_track_file))


def _convert_transcript(reader, timed_text_reader):
    """Transcript are directly injected in HTML, so we want to sanitize them
    to avoid injecting unwanted HTML and then convert them into vtt."""

    captions = reader().read(timed_text_reader)
    languages = captions.get_languages()
    for language in languages:
        for caption in captions.get_captions(language):
            for node in caption.nodes:
                if node.type_ == CaptionNode.TEXT:
                    node.content = escape(unescape(node.content))
    return WebVTTWriter().write(captions)


def _get_extension_from_reader(reader):
    """Get the extension of a timed text track."""
    if reader is SAMIReader:
        return "sami"
    if reader is SCCReader:
        return "scc"
    if reader is SRTReader:
        return "srt"
    if reader is MicroDVDReader:
        return "sub"
    if reader is WebVTTReader:
        return "vtt"
    if reader is DFXPReader:
        return "xml"

    raise ReaderNotImplementedError(f"Reader {reader} not supported")


@app.task
def convert_timed_text_track(timed_text_track_pk, stamp):
    """Convert a timed text track into a vtt using video_storage."""
    timed_text_track = TimedTextTrack.objects.get(pk=timed_text_track_pk)
    try:
        mode = timed_text_track.mode
        source = timed_text_track.get_videos_storage_prefix(
            stamp, TMP_VIDEOS_STORAGE_BASE_DIRECTORY
        )
        prefix_destination = timed_text_track.get_videos_storage_prefix(stamp)

        with video_storage.open(source, "rt") as timed_text_file:
            timed_text = timed_text_file.read()
            reader = detect_format(timed_text)
            if not reader:
                raise ReaderNotImplementedError(f"Reader {reader} not supported")
            extension = _get_extension_from_reader(reader)

            if mode in ("st", "cc"):
                vtt_timed_text = _convert_timed_text_track_file(reader, timed_text)
            else:
                vtt_timed_text = _convert_transcript(reader, timed_text)

            video_storage.save(
                f"{prefix_destination}/{stamp}.vtt",
                ContentFile(vtt_timed_text),
            )
            video_storage.save(
                f"{prefix_destination}/source.{extension}", timed_text_file
            )

        timed_text_track.process_pipeline = CELERY_PIPELINE
        timed_text_track.save(update_fields=["process_pipeline"])
        timed_text_track.update_upload_state(
            READY, to_datetime(stamp), **{"extension": extension}
        )
    except Exception as exception:  # pylint: disable=broad-except+
        capture_exception(exception)
        timed_text_track.update_upload_state(ERROR, None)
