from __future__ import annotations

import logging
import uuid
from os.path import dirname, join
from shutil import move
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models import RunnerJob, RunnerJobType, Video, VideoJobInfo

from ..files import build_new_file
from ..paths import get_hls_resolution_playlist_filename
from ..transcoding.hls import rename_video_file_in_playlist
from ..transcoding.web_transcoding import on_web_video_file_transcoding
from .abstract_vod_transcoding_job_handler import AbstractVODTranscodingJobHandler
from .utils import (
    generate_runner_transcoding_video_input_file_url,
    load_transcoding_runner_video,
    on_transcoding_ended,
)

logger = logging.getLogger(__name__)


class VODHLSTranscodingJobHandler(AbstractVODTranscodingJobHandler):
    async def create(
        self, video: Video, resolution, fps, depends_on_runner_job, priority
    ):
        job_uuid = uuid.uuid4()

        payload = {
            "input": {
                "videoFileUrl": generate_runner_transcoding_video_input_file_url(
                    job_uuid, video.uuid
                ),
            },
            "output": {
                "resolution": resolution,
                "fps": fps,
            },
        }

        private_payload = {
            "isNewVideo": False,
            "deleteWebVideoFiles": False,
            "videoUUID": video.uuid,
        }

        job = await self.create_runner_job(
            type=RunnerJobType.VOD_HLS_TRANSCODING,
            job_uuid=job_uuid,
            payload=payload,
            private_payload=private_payload,
            priority=priority,
            depends_on_runner_job=depends_on_runner_job,
        )

        await VideoJobInfo.increase_or_create(video.uuid, "pendingTranscode")

        return job

    async def specific_complete(self, runner_job: RunnerJob, result_payload):
        private_payload = runner_job.privatePayload

        video = await load_transcoding_runner_video(runner_job)
        if not video:
            return

        video_file_path = result_payload.videoFile
        resolution_playlist_file_path = result_payload.resolutionPlaylistFile

        video_file = await build_new_file(path=video_file_path, mode="hls")
        new_video_file_path = join(dirname(video_file_path), video_file.filename)
        move(video_file_path, new_video_file_path)

        resolution_playlist_filename = get_hls_resolution_playlist_filename(
            video_file.filename
        )
        new_resolution_playlist_file_path = join(
            dirname(resolution_playlist_file_path), resolution_playlist_filename
        )
        move(resolution_playlist_file_path, new_resolution_playlist_file_path)

        await rename_video_file_in_playlist(
            new_resolution_playlist_file_path, video_file.filename
        )

        await on_web_video_file_transcoding(
            video=video,
            video_file=video_file,
            m3u8_output_path=new_resolution_playlist_file_path,
            video_output_path=new_video_file_path,
        )

        await on_transcoding_ended(
            isNewVideo=private_payload.isNewVideo,
            moveVideoToNextState=True,
            video=video,
        )

        if private_payload.deleteWebVideoFiles:
            logger.info(
                "Removing web video files of %s now we have a HLS version of it.",
                video.uuid,
                self.lTags(video.uuid),
            )

            await video.remove_all_web_video_files()

        logger.info(
            "Runner VOD HLS job %s for %s ended.",
            runner_job.uuid,
            video.uuid,
            self.lTags(runner_job.uuid, video.uuid),
        )
