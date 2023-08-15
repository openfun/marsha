import logging
import uuid

from ...models import VideoJobInfo
from .abstract_vod_transcoding_job_handler import AbstractVODTranscodingJobHandler
from .utils import (
    generate_runner_transcoding_video_input_file_url,
    load_transcoding_runner_video,
    on_vod_web_video_or_audio_merge_transcoding_job,
)

logger = logging.getLogger(__name__)


class VODWebVideoTranscodingJobHandler(AbstractVODTranscodingJobHandler):
    async def create(self, video, resolution, fps, depends_on_runner_job, priority):
        jobUUID = uuid.uuid4()
        payload = {
            "input": {
                "videoFileUrl": generate_runner_transcoding_video_input_file_url(
                    jobUUID, video.uuid
                )
            },
            "output": {"resolution": resolution, "fps": fps},
        }

        privatePayload = {
            "isNewVideo": True,
            "videoUUID": video.uuid,
        }

        job = await self.create_runner_job(
            type="vod-web-video-transcoding",
            jobUUID=jobUUID,
            payload=payload,
            privatePayload=privatePayload,
            depends_on_runner_job=depends_on_runner_job,
            priority=priority,
        )

        await VideoJobInfo.increase_or_create(video.uuid, "pendingTranscode")

        return job

    async def specificComplete(self, runner_job, result_payload):
        private_payload = runner_job.privatePayload

        video = await load_transcoding_runner_video(runner_job)
        if not video:
            return

        video_file_path = private_payload.videoFile

        await on_vod_web_video_or_audio_merge_transcoding_job(
            video=video,
            video_file_path=video_file_path,
            private_payload=private_payload,
        )

        logger.info(
            "Runner VOD web video transcoding job %s for %s ended.",
            runner_job.uuid,
            video.uuid,
            self.lTags(video.uuid, runner_job.uuid),
        )
