import logging

import ffmpeg
import shortuuid
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from transcode_api.models import Video
from transcode_api.serializers import (
    RunnerJobSerializer,
)
from transcode_api.storage import video_storage
from transcode_api.utils.ffprobe import get_video_stream_duration
from transcode_api.utils.files import (
    build_new_file,
    get_lower_case_extension,
    get_video_directory,
)
from transcode_api.utils.thumbnail import build_video_thumbnails
from transcode_api.utils.transcoding.job_creation import (
    create_transcoding_jobs,
)
from transcode_api.utils.video_state import build_next_video_state

from .mixins import ListMixin

logger = logging.getLogger(__name__)


class VideoViewSet(mixins.DestroyModelMixin, ListMixin, viewsets.GenericViewSet):
    queryset = Video.objects.all()
    serializer_class = RunnerJobSerializer

    def transcode_new_video(self, video: Video, filename: str):
        path = video_storage.path(filename)
        probe = ffmpeg.probe(path)
        
        video_file = build_new_file(video=video, filename=filename, mode="web-video")

        video.duration = get_video_stream_duration(path, existing_probe=probe)

        thumbnail_filename = build_video_thumbnails(
            video=video, video_file=video_file, existing_probe=probe
        )

        video.thumbnailFilename = thumbnail_filename
        video.save()

        logger.info(
            "Video with name %s and uuid %s created.",
            video.name,
            video.uuid,
        )

        try:
            create_transcoding_jobs(
                video=video, video_file=video_file, existing_probe=probe
            )
        except Exception as e:
            logger.error(
                "Cannot build new video jobs of %s.",
                video.uuid,
                exc_info=e,
            )
            raise e

        return Response(
            {
                "video": {
                    "id": video.id,
                    "shortUUID": shortuuid.uuid(str(video.uuid)),
                    "uuid": video.uuid,
                }
            }
        )

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request, pk=None):
        uploaded_video_file = request.FILES["videoFile"]
        name = request.data.get("name")
        extension = get_lower_case_extension(uploaded_video_file.name)

        video = Video.objects.create(
            name=name,
            state=build_next_video_state(),
        )
        filename = video_storage.save(
            get_video_directory(video, f"base_video.{extension}"),
            uploaded_video_file,
        )

        return self.transcode_new_video(video=video, filename=filename)

    @action(detail=False, methods=["post"], url_path="transcode")
    def transcode(self, request, pk=None):
        video_path_file = request.data.get("path")
        name = request.data.get("name")

        if not video_storage.exists(video_path_file):
            return Response(
                {"error": "Video file does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )

        video = Video.objects.create(
            name=name,
            state=build_next_video_state(),
        )

        return self.transcode_new_video(video=video, filename=video_path_file)
