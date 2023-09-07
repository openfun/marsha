import logging

import ffmpeg
import shortuuid
from django.urls import reverse
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from django_peertube_runner_connector.models import Video
from django_peertube_runner_connector.serializers import (
    RunnerJobSerializer,
)
from django_peertube_runner_connector.storage import video_storage
from django_peertube_runner_connector.utils.ffprobe import get_video_stream_duration
from django_peertube_runner_connector.utils.files import (
    build_new_file,
    get_lower_case_extension,
    get_video_directory,
)
from django_peertube_runner_connector.utils.thumbnail import build_video_thumbnails
from django_peertube_runner_connector.utils.transcoding.job_creation import (
    create_transcoding_jobs,
)
from django_peertube_runner_connector.utils.video_state import build_next_video_state

from .mixins import ListMixin

logger = logging.getLogger(__name__)


class VideoViewSet(mixins.DestroyModelMixin, ListMixin, viewsets.GenericViewSet):
    queryset = Video.objects.all()
    serializer_class = RunnerJobSerializer

    def build_video_url(self, job_uuid, video_uuid):
        return self.request.build_absolute_uri(
            reverse("runner-jobs-download_video_file", args=(job_uuid, video_uuid))
        )

    def transcode_new_video(self, video: Video, filename: str):
        url = video_storage.url(filename)
        probe = ffmpeg.probe(url)

        video_file = build_new_file(
            video=video, filename=filename, existing_probe=probe
        )

        video.duration = get_video_stream_duration(filename, existing_probe=probe)

        thumbnail_filename = build_video_thumbnails(
            video=video, video_file=video_file, existing_probe=probe
        )

        video.thumbnailFilename = thumbnail_filename
        video.save()

        logger.info(f"Video with name {video.name} and uuid {video.uuid} created.")

        create_transcoding_jobs(
            video=video,
            video_file=video_file,
            existing_probe=probe,
            build_video_url=self.build_video_url,
        )

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
            get_video_directory(video, f"base_video{extension}"),
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
