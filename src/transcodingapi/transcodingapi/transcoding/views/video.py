import logging
from os.path import basename
from shutil import move

import shortuuid
from helpers.files import build_new_file
from helpers.job_handlers.utils import get_local_video_activity_pub_url
from helpers.paths import get_fs_video_file_output_path
from helpers.transcoding.create_jobs import (
    create_optimize_or_merge_audio_jobs,
)
from helpers.video_state import build_next_video_state
from models import Video
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from serializers import (
    RunnerJobSerializer,
)

from .mixins import ListMixin

logger = logging.getLogger(__name__)


class RunnerJobViewSet(mixins.DestroyModelMixin, ListMixin, viewsets.GenericViewSet):
    queryset = Video.objects.all()
    serializer_class = RunnerJobSerializer

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request, pk=None):
        # get video file from request
        video_file = request.FILES("videofile")
        videoPhysicalFile = video_file[0]

        video = Video.objects.create(
            name=request.data.get("name"),
            state=build_next_video_state(),
            duration=video_file.duration,
        )

        video.url = get_local_video_activity_pub_url(
            video
        )  # We use the UUID, so set the URL after building the object

        video.save()

        videoFile = build_new_file(
            video=video, path=videoPhysicalFile.path, mode="web-video"
        )

        # Move physical file
        destination = get_fs_video_file_output_path(videoFile)

        move(videoPhysicalFile.path, destination)

        # This is important in case if there is another attempt in the retry process
        videoPhysicalFile.filename = basename(destination)
        videoPhysicalFile.path = destination

        # TODO: handle thumbnails and preview
        # thumbnailModel, previewModel = await buildVideoThumbnailsFromReq(
        #     {
        #         "video": video,
        #         "files": files,
        #         "fallback": lambda type: generateLocalVideoMiniature(
        #             {"video": video, "videoFile": videoFile, "type": type}
        #         ),
        #     }
        # )

        # video.addAndSaveThumbnail(thumbnailModel)
        # video.addAndSaveThumbnail(previewModel)

        # videoSourceModel.create(filename=originalFilename, videoId=video.id) Not sure it is needed
        logger.info(
            "Video with name %s and uuid %s created.",
            video.name,
            video.uuid,
        )

        try:
            create_optimize_or_merge_audio_jobs()
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
                    "shortUUID": shortuuid.uuid(video.uuid),
                    "uuid": video.uuid,
                }
            }
        )
