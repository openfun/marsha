"""Management command to transcript a video."""

import logging
import uuid

from django.core.management import BaseCommand, CommandError

from marsha.core import defaults
from marsha.core.models import TimedTextTrack, Video
from marsha.core.utils.transcript_utils import transcript


logger = logging.getLogger(__name__)

DEFAULT_VIDEO_LIMIT = 10


class Command(BaseCommand):
    """Transcript a video."""

    help = "Transcript a video"

    def add_arguments(self, parser):
        parser.add_argument(
            "--video-id", type=uuid.UUID, help="The video id to transcript"
        )
        parser.add_argument(
            "--limit",
            type=int,
            help="The number of videos to transcript",
        )
        parser.add_argument(
            "--all", default=False, action="store_true", help="Transcript all videos"
        )

    def handle(self, *args, **options):
        """Select a video to transcript and start the transcription job."""
        video_id = options["video_id"]

        if options["limit"] and options["all"]:
            raise CommandError(
                "Error: argument --limit: not allowed with argument --all"
            )

        if options["all"]:
            limit = None
        else:
            limit = options["limit"] or DEFAULT_VIDEO_LIMIT

        videos = self._get_videos(video_id, limit)

        if not videos:
            return

        for video in videos:
            if not video:
                continue

            try:
                logger.info("Try to transcript video %s", video.id)
                transcript(video)
                logger.info("Transcription job started for video %s", video.id)
            except Exception as e:  # pylint: disable=broad-except
                logger.error("Error: %s", e)

    def _get_videos(self, video_id, limit):
        """Get a video by id or the untranscribed videos."""
        if video_id:
            return [self._get_video_by_id(video_id)]
        return self._get_latest_untranscribed_videos(limit)

    def _get_video_by_id(self, video_id):
        """Get a video by id."""
        try:
            video = Video.objects.get(id=video_id)

        except Video.DoesNotExist:
            logger.error("No video found with id %s", video_id)
            return None

        if video.upload_state != defaults.READY:
            logger.error("Video %s is not ready", video_id)
            return None

        if video.timedtexttracks.filter(mode=TimedTextTrack.TRANSCRIPT).exists():
            logger.error("Transcript already exists for video %s", video_id)
            return None

        return video

    def _get_latest_untranscribed_videos(self, limit=DEFAULT_VIDEO_LIMIT):
        """Get the latest untranscribed video."""

        excluded_timed_text_tracks = TimedTextTrack.objects.filter(
            mode=TimedTextTrack.TRANSCRIPT
        )

        videos = (
            Video.objects.exclude(timedtexttracks__in=excluded_timed_text_tracks)
            .filter(upload_state=defaults.READY)
            .order_by("-created_on")[:limit]
        )

        if not videos:
            logger.info("No video to transcript")

        return videos
