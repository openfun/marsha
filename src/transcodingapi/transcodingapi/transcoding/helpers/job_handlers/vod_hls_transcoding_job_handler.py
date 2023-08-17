from __future__ import annotations

import logging
import uuid
from os.path import dirname, join
from shutil import move

from ...models import RunnerJob, RunnerJobType, Video, VideoJobInfo
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
    def create(self, video: Video, resolution, fps, depends_on_runner_job, priority):
        job_uuid = uuid.uuid4()

        payload = {
            "input": {
                "videoFileUrl": generate_runner_transcoding_video_input_file_url(
                    str(job_uuid), str(video.uuid)
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
            "videoUUID": str(video.uuid),
        }

        job = self.create_runner_job(
            type=RunnerJobType.VOD_HLS_TRANSCODING,
            job_uuid=job_uuid,
            payload=payload,
            private_payload=private_payload,
            priority=priority,
            depends_on_runner_job=depends_on_runner_job,
        )

        VideoJobInfo.increase_or_create(video.uuid, "pendingTranscode")

        return job

    def specific_complete(self, runner_job: RunnerJob, result_payload):
        private_payload = runner_job.privatePayload

        video = load_transcoding_runner_video(runner_job)
        if not video:
            return

        video_file_path = result_payload.videoFile
        resolution_playlist_file_path = result_payload.resolutionPlaylistFile

        video_file = build_new_file(path=video_file_path, mode="hls")
        new_video_file_path = join(dirname(video_file_path), video_file.filename)
        move(video_file_path, new_video_file_path)

        resolution_playlist_filename = get_hls_resolution_playlist_filename(
            video_file.filename
        )
        new_resolution_playlist_file_path = join(
            dirname(resolution_playlist_file_path), resolution_playlist_filename
        )
        move(resolution_playlist_file_path, new_resolution_playlist_file_path)

        rename_video_file_in_playlist(
            new_resolution_playlist_file_path, video_file.filename
        )

        on_web_video_file_transcoding(
            video=video,
            video_file=video_file,
            m3u8_output_path=new_resolution_playlist_file_path,
            video_output_path=new_video_file_path,
        )

        on_transcoding_ended(
            is_new_video=private_payload.isNewVideo,
            move_video_to_next_state=True,
            video=video,
        )

        if private_payload.deleteWebVideoFiles:
            logger.info(
                "Removing web video files of %s now we have a HLS version of it.",
                video.uuid,
                self.lTags(video.uuid),
            )

            video.remove_all_web_video_files()

        logger.info(
            "Runner VOD HLS job %s for %s ended.",
            runner_job.uuid,
            video.uuid,
            self.lTags(runner_job.uuid, video.uuid),
        )
